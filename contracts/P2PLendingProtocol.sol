// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IZRC20} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {BytesHelperLib} from "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import {PythUtils} from "@pythnetwork/pyth-sdk-solidity/PythUtils.sol";
// UniversalContract,
contract P2PLendingProtocol is
    UniversalContract,
    ReentrancyGuard,
    Pausable,
    Ownable,
    EIP712
{
    // =============== CORE STATE VARIABLES ===============

    SystemContract public immutable systemContract;
    IPyth public pyth;
    GatewayZEVM public immutable gatewayZEVM;
    address public immutable uniswapRouter;
    uint256 public loanRequestCounter;
    uint256 public loanCounter;
    uint256 public bidCounter;

    // =============== CONSTANTS ===============

    uint256 public constant MIN_COLLATERAL_RATIO = 11000; // 110% (basis points)
    uint256 public constant LIQUIDATION_THRESHOLD = 10500; // 105%
    uint256 public constant MAX_INTEREST_RATE = 3000; // 30% APR
    uint256 public constant MIN_LOAN_DURATION = 7 days;
    uint256 public constant MAX_LOAN_DURATION = 365 days;
    uint256 public constant MAX_LOAN_REQUEST_DURATION = 30 days;
    uint256 public constant LISTING_FEE_BPS = 50; // 0.5%
    uint256 public constant MAX_BATCH_SIZE = 20;
    uint256 public constant PRICE_CHECK_INTERVAL = 300; // 5 minutes
    uint256 public constant RETRY_ATTEMPTS = 3;
    uint256[] public _bids;
    string[] public SUPPORTED_ACTIONS = [
        "CREATE_LOAN_REQUEST",
        "PLACE_LOAN_REQUEST_BID",
        "RECOVER_BID_FUNDING",
        "EXECUTE_LOAN",
        "REPAY_LOAN",
        "RECOVER_LOAN_COLLATERAL",
        // ADMIN ACTIONS
        "ADD_SUPPORTED_ASSETS",
        "UPDATE_ASSET_PRICE",
        "EMERGENCY_PAUSE",
        "UNPAUSE"
    ];

    error Unauthorized();

    // =============== MAPPINGS ===============

    mapping(address => bool) public supportedAssets; // ZRC20 asset support
    mapping(uint256 => LoanRequest) private loanRequests; // Loan Request ID to Loan Request details
    mapping(address => uint256) public assetPrices; // Asset prices in USD (18 decimals)
    mapping(address => bytes32) public pythPriceIds;
    mapping(uint256 => EscrowInfo) public collateralEscrows; // Loan ID to collateral escrow info
    mapping(uint256 => Loan) public loans; // Loan ID to Loan details
    mapping(uint256 => Bid) public bids;
    mapping(address => uint256) public nonces;
    mapping(uint256 => EscrowInfo) public fundingEscrows;
    mapping(uint256 => uint256) public lastPriceCheck; //  LoadID => (last price timestamp)
    mapping(uint256 => uint256) public retryAttempts;
    mapping(uint256 => uint256) public nextRetryTime;
    mapping(uint256 => uint256) private activeLoanIndex; // loanId -> index in activeLoanIds
    mapping(address => User) private users; // user address => all user information

    // =============== VARIABLES ===============

    address[] public supportedAssetsList; // List of supported assets for iteration
    uint256[] public activeLoanIds; // iterable list of active loans

    // =============== STRUCTS ===============

    struct User {
        address userAddress;
        uint256[] bids;
        uint256[] loans;
        uint256[] loanRequests;
        uint256[] acceptedBids;
        bool exists;
    }

    struct LoanRequest {
        uint256 id;
        address borrower;
        address principalAsset;
        address collateralAsset;
        uint256 principalAmount;
        uint256 collateralAmount;
        bytes receivingWallet;
        uint256 maxInterestRate;
        uint256 loanDuration;
        uint256 requestValidDays;
        uint256 listingFee;
        uint256[] bids;
        uint256 createdAt;
        uint256 loanID;
        LoanRequestStatus status;
        bool exists;
    }

    struct Loan {
        uint256 id;
        address borrower;
        address principalAsset;
        address collateralAsset;
        uint256 principalAmount;
        uint256 collateralAmount;
        bytes receivingWallet;
        uint256 loanDuration;
        uint64 interestRate;
        uint256 repaymentDeadline;
        LoanStatus status;
        uint256 createdAt;
        uint256 loanRequestID;
        uint256[] bids;
        uint128 totalRepaid;
        bool exists;
    }

    struct EscrowInfo {
        address asset; // ZRC20 token address
        uint128 balance;
        bytes32 escrowType;
        address owner;
        uint256 initiatorID; // ID of the initiator (loan request ID or Bid ID)
        bool isLocked;
        bool canWithdraw;
        bool exists;
    }

    struct MetaBid {
        uint256 loanRequestId;
        address lender;
        uint128 amount;
        uint64 interestRate;
        address fundingAsset;
        uint256 nonce;
        uint64 deadline;
        bool exists;
    }

    struct Bid {
        uint256 id;
        uint256 loanRequestId;
        address lender;
        // uint256 escrowID; // ID to the Bid's escrow funding walet
        uint128 amount; // Amount lender willing to provide
        uint128 amountFilled; // Amount that was actually filled from the lender's bid
        uint64 interestRate; // Interest rate lender wants (basis points)
        address fundingAsset; // Asset lender has (ZRC20)
        bool requiresSwap; // Whether lender asset needs swap to principal
        BidStatus status;
        uint256 createdAt;
        uint128 gasDeducted; // Gas costs deducted from this bid
        bool exists;
    }

    struct LiquidationInfo {
        uint256 collateralValue; // USD value of collateral
        uint256 loanValue; // USD value of loan + interest
        uint256 liquidationRatio; // Current collateralization ratio
        bool canLiquidate;
    }

    // =============== ENUMS ===============
    enum LoanStatus {
        ACTIVE, // Loan active, borrower received funds
        COMPLETED, // Loan fully repaid
        LIQUIDATED, // Collateral liquidated
        CANCELLED
    }

    enum LoanRequestStatus {
        REQUESTED, // Loan request created, awaiting bids
        FUNDED, // 100% funded, ready for execution
        EXECUTED, // Request has been executed and loan exists
        EXPIRED, // Request expired without funding
        CANCELLED // Cancelled by borrower or by
    }

    enum BidStatus {
        PENDING, // Bid placed, awaiting loan execution
        ACCEPTED, // Bid accepted and loan executed
        REJECTED, // Bid rejected by borrower
        EXPIRED, // Bid expired
        WITHDRAWN // Bid withdrawn by lender
    }

    // =============== EVENTS ===============
    event PriceUpdated(
        address indexed asset,
        uint256 newPrice,
        uint256 timestamp
    );
    event EmergencyPaused(string reason, uint256 timestamp);
    event LoanRequested(
        uint256 indexed loanRequestId,
        address indexed borrower,
        address principalAsset,
        uint256 principalAmount,
        uint256 collateralAmount,
        address collateralAsset
    );

    event CollateralLocked(
        uint256 indexed loanId,
        address collateralAsset,
        address borrower,
        uint256 amount
    );
    event CollateralReleased(
        uint256 indexed loanId,
        address to,
        uint256 amount
    );

    event BidPlaced(
        uint256 indexed bidId,
        uint256 indexed loanRequestId,
        address indexed lender,
        uint256 amount,
        address fundingAsset,
        uint256 interestRate
    );
    event BidBatchProcessed(uint256[] bidIds, uint256 successCount);
    event BidFailed(
        uint256 indexed loanId,
        address indexed lender,
        string reason
    );
    event FundingCollateralReleased(
        uint256 indexed bidId,
        bytes to,
        uint256 amount
    );

    event LoanFunded(
        uint256 indexed loanId,
        uint256 totalAmount,
        uint256 bidCount
    );
    event LoanActivated(
        uint256 indexed loanId,
        uint256 activatedAt,
        uint256 deadline,
        address borrower
    );
    event LoanLiquidated(
        uint256 indexed loanId,
        uint256 liquidationValue,
        string reason
    );

    event WithdrawalInitiated(
        address zrc20Token,
        uint256 amount,
        bytes reciever
    );
    event LoanRetryScheduled(uint256 indexed loanId, uint256 nextAttempt);
    event LoanRepayment(
        uint256 indexed loanId,
        uint256 amount,
        uint256 remainingDebt
    );
    event LoanCompleted(
        uint256 indexed loanId,
        address borrower,
        uint256 completedAt
    );

    // =============== MODIFIERS ===============

    modifier onlyBorrower(uint256 loanRequestId, address initiator) {
        require(
            loanRequests[loanRequestId].borrower == initiator,
            "Only borrower can call this"
        );
        _;
    }

    modifier onlyLender(uint256 BidId, address initiator) {
        require(bids[BidId].lender == initiator, "Only lender can call this");
        _;
    }

    modifier _onlyOwner(address initiator) {
        address _owner = owner();
        if (initiator != _owner) revert Unauthorized();
        _;
    }

    modifier onlyGateway() {
        if (msg.sender != address(gatewayZEVM)) revert Unauthorized();
        _;
    }

    modifier validLoanRequest(uint256 loanRequestId) {
        require(
            loanRequests[loanRequestId].exists,
            "Only a valid loan Request can be executed"
        );
        _;
    }

    modifier validLoan(uint256 loanId) {
        require(
            loans[loanId].exists && loans[loanId].status == LoanStatus.ACTIVE,
            "Only valid loans can be repayed"
        );
        _;
    }

    modifier onlyDebtor(uint256 loanId, address debtor) {
        require(
            loans[loanId].borrower == debtor,
            "Only the debtor can clear the loan"
        );
        _;
    }

    // =============== CONSTRUCTOR ===============

    constructor(
        address initialOwner,
        address _systemContract,
        address payable _gatewayZEVM,
        address payable _uniswapRouter,
        address pythContractZEVM
    ) Ownable(initialOwner) EIP712("P2PLendingProtocol", "1") {
        systemContract = SystemContract(_systemContract);
        gatewayZEVM = GatewayZEVM(_gatewayZEVM);
        uniswapRouter = _uniswapRouter;
        pyth = IPyth(pythContractZEVM);
    }

    // =============== LOAN REQUEST ===============

    /**
     * @dev Create a new loan request and lock collateral.
     * @param principalAsset the address
     */
    function _createLoanRequest(
        address borrower,
        address principalAsset,
        address collateralAsset,
        uint256 principalAmount,
        uint256 collateralAmount,
        bytes memory receivingWallet,
        uint256 maxInterestRate,
        uint256 loanDuration,
        uint256 requestValidDays
    ) internal nonReentrant whenNotPaused {
        // Input validation
        require(principalAmount > 0, "Invalid principal amount");
        require(collateralAmount > 0, "Invalid collateral amount");
        require(
            supportedAssets[principalAsset],
            "Principal asset not supported"
        );
        require(
            supportedAssets[collateralAsset],
            "Collateral asset not supported"
        );
        require(maxInterestRate <= MAX_INTEREST_RATE, "Interest rate too high");
        require(
            loanDuration >= MIN_LOAN_DURATION &&
                loanDuration <= MAX_LOAN_DURATION,
            "Invalid loan duration"
        );
        require(
            requestValidDays > 0 &&
                requestValidDays <= MAX_LOAN_REQUEST_DURATION,
            "Invalid request validity"
        );

        // Calculate collateralization ratio
        uint256 collateralValueUSD = getAssetValueUSD(
            collateralAsset,
            collateralAmount
        );
        uint256 principalValueUSD = getAssetValueUSD(
            principalAsset,
            principalAmount
        );
        uint256 collateralRatio = (collateralValueUSD * 10000) /
            principalValueUSD;

        require(
            collateralRatio >= MIN_COLLATERAL_RATIO,
            "Insufficient collateral ratio"
        );

        // Calculate listing fee
        uint256 listingFee = (collateralValueUSD * LISTING_FEE_BPS) / 10000;
        require(msg.value >= listingFee, "Insufficient listing fee");

        // Create loan request record

        uint256 reqId = ++loanRequestCounter;
        loanRequests[reqId] = LoanRequest({
            id: reqId,
            borrower: borrower,
            principalAsset: principalAsset,
            collateralAsset: collateralAsset,
            principalAmount: principalAmount,
            collateralAmount: collateralAmount,
            receivingWallet: receivingWallet,
            maxInterestRate: maxInterestRate,
            loanDuration: loanDuration,
            requestValidDays: requestValidDays,
            listingFee: listingFee,
            createdAt: block.timestamp,
            loanID: 0,
            bids: _bids,
            exists: true,
            status: LoanRequestStatus.REQUESTED
        });

        if (users[borrower].exists) {
            users[borrower].loanRequests.push(reqId);
        } else {
            User storage u = users[borrower];
            u.userAddress = borrower;
            u.exists = true;
            u.loanRequests.push(reqId);
        }

        // Lock collateral
        _lockCollateral(reqId, borrower, collateralAsset, collateralAmount);
        emit LoanRequested(
            reqId,
            borrower,
            principalAsset,
            principalAmount,
            collateralAmount,
            collateralAsset
        );
    }

    /**
     * @dev Internal function to lock collateral in escrow
     */
    function _lockCollateral(
        uint256 loanRequestId,
        address borrower,
        address collateralAsset,
        uint256 amount
    ) internal {
        // Transfer collateral to escrow
        IZRC20(collateralAsset).transferFrom(borrower, address(this), amount);

        // Create escrow record
        collateralEscrows[loanRequestId] = EscrowInfo({
            asset: collateralAsset,
            balance: uint128(amount),
            escrowType: "collateral",
            owner: borrower,
            initiatorID: loanRequestId,
            isLocked: true,
            canWithdraw: false,
            exists: true
        });

        emit CollateralLocked(loanRequestId, collateralAsset, borrower, amount);
    }

    /**
     * @dev Release loan collateral back to borrower after rejection or discommitment
     * @param initiator ID of initiator of this function
     * @param loanRequestId ID of the loanRequest to release funding for
     * @param to Address to send the funds to
     */
    function _releaseLoanCollateral(
        address initiator,
        uint256 loanRequestId,
        bytes memory to
    ) internal whenNotPaused onlyBorrower(loanRequestId, initiator) {
        EscrowInfo storage escrow = collateralEscrows[loanRequestId];
        LoanRequest storage loanRequest = loanRequests[loanRequestId];

        require(!escrow.isLocked, "Collateral still locked");
        require(escrow.canWithdraw, "Cannot withdraw yet");
        require(escrow.owner == initiator, "Only owner can release");

        if (loanRequest.status == LoanRequestStatus.EXECUTED) {
            Loan storage loan = loans[loanRequest.loanID];
            require(loan.status != LoanStatus.ACTIVE, "Loan is still active");
        }
        require(escrow.balance > 0, "No Collateral Available for withdraw");

        bool withdraw = _withdrawTokens(to, escrow.balance, escrow.asset);

        if (withdraw) {
            emit FundingCollateralReleased(loanRequestId, to, escrow.balance);
        } else {
            revert("Funding release failed");
        }
        escrow.isLocked = false;
    }

    // =============== BIDDING SYSTEM ===============

    /**
     * @dev Place multiple bids using meta-transactions (gas-free for lenders)
     * @param metaBids Array of meta-transaction bid data
     */
    function _placeBidBatch(MetaBid[] memory metaBids) internal whenNotPaused {
        require(metaBids.length <= MAX_BATCH_SIZE, "Batch too large");

        uint256[] memory successfulBids = new uint256[](metaBids.length);
        uint256 successCount = 0;

        for (uint256 i = 0; i < metaBids.length; i++) {
            uint256 bidId = _processSingleBid(metaBids[i]);
            if (bidId > 0) {
                successfulBids[successCount] = bidId;
                successCount++;
            } else {
                emit BidFailed(
                    metaBids[i].loanRequestId,
                    metaBids[i].lender,
                    "Bid Creation Failed"
                );
            }
        }

        // Resize successful bids array
        uint256[] memory finalBids = new uint256[](successCount);
        for (uint256 i = 0; i < successCount; i++) {
            finalBids[i] = successfulBids[i];
        }

        emit BidBatchProcessed(finalBids, successCount);
    }

    /**
     * @dev Process a single meta-transaction bid
     */
    function _processSingleBid(MetaBid memory bid) internal returns (uint256) {
        // Validate bid against loan
        LoanRequest storage loanRequest = loanRequests[bid.loanRequestId];
        require(
            block.timestamp <=
                loanRequest.createdAt + loanRequest.requestValidDays * 1 days, // bug here
            "Loan request expired"
        );
        require(
            bid.interestRate <= loanRequest.maxInterestRate,
            "Interest rate too high"
        );
        require(
            bid.amount > 0 && bid.amount <= loanRequest.principalAmount,
            "Invalid bid amount"
        );
        require(
            supportedAssets[bid.fundingAsset],
            "Funding asset not supported"
        );

        // Create bid record
        uint256 bidId = ++bidCounter;
        bids[bidId] = Bid({
            id: bidId,
            loanRequestId: bid.loanRequestId,
            lender: bid.lender,
            amount: bid.amount,
            amountFilled: 0,
            interestRate: bid.interestRate,
            fundingAsset: bid.fundingAsset,
            requiresSwap: bid.fundingAsset != loanRequest.principalAsset,
            status: BidStatus.PENDING,
            createdAt: block.timestamp,
            gasDeducted: 0,
            exists: true
        });

        if (users[bid.lender].exists) {
            users[bid.lender].bids.push(bidId);
        } else {
            User storage u = users[bid.lender];
            u.userAddress = bid.lender;
            u.exists = true;
            u.bids.push(bidId);
        }

        // Add to loan Requests bids
        loanRequests[bid.loanRequestId].bids.push(bidId);

        // Lock lender funds
        _lockFundingBid(bidId, bid.lender, bid.fundingAsset, bid.amount);

        // Increment nonce
        nonces[bid.lender]++;

        emit BidPlaced(
            bidId,
            bid.loanRequestId,
            bid.lender,
            bid.amount,
            bid.fundingAsset,
            bid.interestRate
        );

        return bidId;
    }

    /**
     * @dev Lock funds for a bidding lender
     */
    function _lockFundingBid(
        uint256 bidId,
        address lender,
        address fundingAsset,
        uint256 amount
    ) internal {
        // Create escrow record
        fundingEscrows[bidId] = EscrowInfo({
            asset: fundingAsset,
            escrowType: "funding",
            owner: lender,
            initiatorID: bidId,
            balance: uint128(amount),
            isLocked: true,
            canWithdraw: true,
            exists: true
        });
    }

    /**
     * @dev Release funding assets back to lender after rejection or discommitment
     * @param bidId ID of the bid to release funding for
     * @param to Address to send the funds to
     */
    function _releaseFundingCollateral(
        address initiator,
        uint256 bidId,
        bytes memory to
    ) internal whenNotPaused onlyLender(bidId, initiator) {
        EscrowInfo storage escrow = fundingEscrows[bidId];
        require(escrow.isLocked, "Funding not locked");
        require(escrow.canWithdraw, "Cannot withdraw yet");
        require(escrow.owner == initiator, "Only owner can release");

        require(escrow.balance > 0, "No funding to withdraw");

        bool withdraw = _withdrawTokens(to, escrow.balance, escrow.asset);

        if (withdraw) {
            emit FundingCollateralReleased(bidId, to, escrow.balance);
        } else {
            revert("Funding release failed");
        }
        escrow.isLocked = false;
    }

    // ==================== LOAN EXECUTION ====================

    /**
     * @dev Execute loan by accepting specific bids (must total 100% of principal)
     * @param initiator address of call initiator
     * @param loanRequestId ID of the loan to execute
     * @param acceptedBids Array of bid IDs to accept
     */
    function _executeLoan(
        address initiator,
        uint256 loanRequestId,
        uint256[] memory acceptedBids
    )
        internal
        nonReentrant
        whenNotPaused
        validLoanRequest(loanRequestId)
        onlyBorrower(loanRequestId, initiator)
    {
        LoanRequest storage loanRequest = loanRequests[loanRequestId];
        require(
            block.timestamp <=
                loanRequest.createdAt + loanRequest.requestValidDays * 1 days,
            "Loan request expired"
        );
        require(acceptedBids.length > 0, "No bids provided");

        uint256 totalFunding = 0;
        uint256 weightedInterestRate = 0;

        for (uint256 i = 0; i < acceptedBids.length; i++) {
            Bid storage bid = bids[acceptedBids[i]];
            require(
                bid.loanRequestId == loanRequestId,
                "Bid not for this loan"
            );
            require(bid.status == BidStatus.PENDING, "Invalid bid status");

            if (totalFunding + bid.amount > loanRequest.principalAmount) {
                uint256 balance = (loanRequest.principalAmount - totalFunding);
                totalFunding += balance;
                bids[acceptedBids[i]].amountFilled = uint128(balance);
                // gas from filled bid is 1.5% of ammountFilled
                bids[acceptedBids[i]].gasDeducted =
                    (uint128(balance) * 15) /
                    1000;
                fundingEscrows[acceptedBids[i]].balance -= uint128(balance); // update the escrow wallet balances
                weightedInterestRate += (balance * bid.interestRate);
            } else {
                totalFunding += bid.amount;
                bids[acceptedBids[i]].amountFilled = bid.amount;
                // gas from filled bid is 1.5% of ammountFilled, should later change to account for earnings
                bids[acceptedBids[i]].gasDeducted = (bid.amount * 15) / 1000;
                fundingEscrows[acceptedBids[i]].balance -= bid.amount; // update the escrow wallet balances
                weightedInterestRate += (bid.amount * bid.interestRate);
            }

            // currently after filling lps cant remove their money, should allow this later but only if the amount withdrawn is less that the balance of the escrow, balance = amount - amountFilled

            users[bid.lender].acceptedBids.push(acceptedBids[i]);
            fundingEscrows[acceptedBids[i]].canWithdraw = false; // protect against withdraw attacks
        }

        weightedInterestRate = weightedInterestRate / totalFunding;

        bool success = _executeAtomicLoanTransfer(loanRequestId, acceptedBids); // very important method

        if (success) {
            uint256 loanId = ++loanCounter;
            loans[loanId] = Loan({
                id: loanId,
                borrower: loanRequest.borrower,
                principalAmount: loanRequest.principalAmount,
                interestRate: uint64(weightedInterestRate),
                loanDuration: loanRequest.loanDuration,
                status: LoanStatus.ACTIVE,
                collateralAsset: loanRequest.collateralAsset,
                collateralAmount: loanRequest.collateralAmount,
                principalAsset: loanRequest.principalAsset,
                receivingWallet: loanRequest.receivingWallet,
                loanRequestID: loanRequest.id,
                bids: acceptedBids,
                totalRepaid: 0,
                createdAt: block.timestamp,
                repaymentDeadline: block.timestamp +
                    loanRequest.loanDuration *
                    1 days,
                exists: true
            });

            if (users[initiator].exists) {
                users[initiator].loans.push(loanId);
            } else {
                User storage u = users[initiator];
                u.loans.push(loanId);
                u.exists = true;
                u.userAddress = initiator;
            }

            activeLoanIds.push(loanId);
            uint256 index = activeLoanIds.length - 1;
            activeLoanIndex[loanId] = index;

            loanRequests[loanRequest.id].loanID = loanId;
            for (uint256 i = 0; i < acceptedBids.length; i++) {
                bids[acceptedBids[i]].status = BidStatus.ACCEPTED;
            }

            emit LoanFunded(loanId, totalFunding, acceptedBids.length);
            emit LoanActivated(
                loanId,
                block.timestamp,
                loans[loanId].repaymentDeadline,
                loanRequest.borrower
            );

            lastPriceCheck[loanId] = block.timestamp;
        } else {
            // Schedule retry
            _scheduleRetryExecution(loanRequestId, acceptedBids);
        }
    }

    /**
     * @dev Execute atomic loan transfer with potential swaps
     */
    function _executeAtomicLoanTransfer(
        uint256 loanRequestId,
        uint256[] memory acceptedBids
    ) internal returns (bool) {
        LoanRequest storage loanreq = loanRequests[loanRequestId];

        // Process swaps if needed - disable this on front-end for now
        for (uint256 i = 0; i < acceptedBids.length; i++) {
            Bid storage bid = bids[acceptedBids[i]];
            if (bid.requiresSwap) {
                // bool swapSuccess = _executeSwap(acceptedBids[i], bid.fundingAsset, loanreq.principalAsset, bid.amountFilled);
                // require(swapSuccess, "Swap failed");
            }
        }
        bool transfered = _transferToBorrower(loanRequestId);
        require(transfered, "Transfer To Borrower Failed");
    }

    /**
     * @dev Transfer funds to borrower's receiving wallet
     */
    function _transferToBorrower(
        uint256 loanRequestId
    ) internal returns (bool) {
        LoanRequest storage loanreq = loanRequests[loanRequestId];
        uint256 totalAmount = loanreq.principalAmount;

        bool withdraw = _withdrawTokens(
            loanreq.receivingWallet,
            totalAmount,
            loanreq.principalAsset
        );
        require(withdraw, "Withdraw Failed");
        return withdraw;
    }

    /**
     * @dev Schedule retry execution for failed loan
     */
    function _scheduleRetryExecution(
        uint256 loanRequestId,
        uint256[] memory acceptedBids
    ) internal {
        uint256 attempts = retryAttempts[loanRequestId];

        if (attempts >= RETRY_ATTEMPTS) {
            // Mark loan as failed and return funds
            _cancelLoanAndReturnFunds(loanRequestId, acceptedBids);
            return;
        }

        retryAttempts[loanRequestId] = attempts + 1;
        nextRetryTime[loanRequestId] =
            block.timestamp +
            (1 hours * (2 ** attempts));

        emit LoanRetryScheduled(loanRequestId, nextRetryTime[loanRequestId]);
    }

    /**
     * @dev Cancel loan and return all funds
     */
    function _cancelLoanAndReturnFunds(
        uint256 loanRequestId,
        uint256[] memory acceptedBids
    ) internal {
        LoanRequest storage loanreq = loanRequests[loanRequestId];

        // Return collateral to borrower
        EscrowInfo storage collateralEscrow = collateralEscrows[loanRequestId];

        collateralEscrow.canWithdraw = true;
        collateralEscrow.isLocked = false;

        for (uint256 i = 0; i < acceptedBids.length; i++) {
            Bid storage bid = bids[acceptedBids[i]];
            EscrowInfo storage fundingEscrow = fundingEscrows[acceptedBids[i]];
            fundingEscrow.canWithdraw = true; // allow user to request for withdraw
            fundingEscrow.balance += bid.amountFilled; // return escrow balance to before loan execution
        }

        loanreq.status = LoanRequestStatus.CANCELLED;
    }

    // ==================== LOAN REPAYMENT ====================

    /**
     * @dev Repay loan (partial or full)
     * @param initiator address of initiator of this function
     * @param loanId ID of loan to repay
     * @param amount Amount to repay
     */
    function _repayLoan(
        address initiator,
        uint256 loanId,
        uint256 amount
    )
        internal
        nonReentrant
        whenNotPaused
        validLoan(loanId)
        onlyDebtor(loanId, initiator)
    {
        Loan storage loan = loans[loanId];
        require(
            block.timestamp <= loan.repaymentDeadline,
            "Loan deadline passed"
        );

        uint256 totalOwed = _calculateTotalOwed(loanId);
        require(amount > 0 && amount <= totalOwed, "Invalid repayment amount");

        // Update loan balance
        loan.totalRepaid += uint128(amount);

        // Distribute repayment to lenders pro-rata
        _distributeLoanRepayment(loanId, amount);

        emit LoanRepayment(loanId, amount, totalOwed - amount);

        // Check if loan fully repaid
        if (loan.totalRepaid >= totalOwed) {
            _completeLoan(loanId);
        }
    }

    /**
     * @dev Complete loan and release collateral
     */
    function _completeLoan(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        loan.status = LoanStatus.COMPLETED;

        _removeLoanFromActive(loanId);

        // Release collateral to borrower
        collateralEscrows[loan.loanRequestID].canWithdraw = true;
        collateralEscrows[loan.loanRequestID].isLocked = false;

        emit LoanCompleted(loanId, loan.borrower, block.timestamp);
    }

    /**
     * @dev Distribute loan repayment to lenders based on their funding share
     */
    function _distributeLoanRepayment(
        uint256 loanId,
        uint256 repaymentAmount
    ) internal {
        Loan storage loan = loans[loanId];
        uint256[] storage bidIds = loan.bids;
        uint256 principal = loan.principalAmount;

        for (uint256 i = 0; i < bidIds.length; i++) {
            Bid storage bid = bids[bidIds[i]];
            if (bid.status == BidStatus.ACCEPTED) {
                uint256 lenderShare = (repaymentAmount * bid.amountFilled) /
                    principal;
                // add lender's share to their funding escrow
                fundingEscrows[bidIds[i]].balance += uint128(lenderShare);
            }
        }
    }

    // ==================== LIQUIDATION SYSTEM ====================

    /**
     * @dev Check if a loan should be liquidated
     */
    function singleLoanLiquidation(
        uint256 loanId,
        address initiator
    ) external validLoan(loanId) _onlyOwner(initiator) {
        Loan storage loan = loans[loanId];

        _liquidateLoan(
            loanId,
            block.timestamp > loan.repaymentDeadline
                ? "Deadline passed"
                : "Insufficient collateral"
        );

        lastPriceCheck[loanId] = block.timestamp;
    }

    /**
     * @dev Execute loan liquidation
     */
    function _liquidateLoan(uint256 loanId, string memory reason) internal {
        Loan storage loan = loans[loanId];
        loan.status = LoanStatus.LIQUIDATED;

        _removeLoanFromActive(loanId);

        // Calculate amounts owed to lenders
        uint256 totalOwed = _calculateTotalOwed(loanId);
        uint256 collateralAmount = loan.collateralAmount;

        // Swap collateral to principal asset and distribute to lenders
        bool swapSuccess = _executeSwap(
            loan.collateralAsset,
            loan.principalAsset,
            collateralAmount
        );

        if (swapSuccess) {
            // Distribute liquidation proceeds to lenders
            _distributeLiquidationProceeds(loanId, totalOwed);
        }

        emit LoanLiquidated(loanId, collateralAmount, reason);
    }

    /**
     * @dev Distribute liquidation proceeds to lenders
     */
    function _distributeLiquidationProceeds(
        uint256 loanId,
        uint256 totalOwed
    ) internal {
        Loan storage loan = loans[loanId];
        uint256[] storage bidIds = loan.bids;
        uint256 principal = loan.principalAmount;

        for (uint256 i = 0; i < bidIds.length; i++) {
            Bid storage bid = bids[bidIds[i]];
            if (bid.status == BidStatus.ACCEPTED) {
                // Calculate lender's share of liquidation proceeds
                uint256 totalShare = (totalOwed * bid.amountFilled) / principal;
                fundingEscrows[bidIds[i]].balance += uint128(totalShare);
                fundingEscrows[bidIds[i]].canWithdraw = true;
                fundingEscrows[bidIds[i]].isLocked = false;
            }
        }
    }

    // =============== UTILITY FUNCTIONS ===============

    /**
     * @dev Calculate total amount owed for a loan (principal + interest)
     */
    function _calculateTotalOwed(
        uint256 loanId
    ) internal view returns (uint256) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.ACTIVE) return 0;

        uint256 timeElapsed = block.timestamp - loan.createdAt;
        uint256 principal = loan.principalAmount;

        // Calculate weighted average interest rate
        uint256 weightedRate = 0;
        uint256[] storage bidIds = loan.bids;

        for (uint256 i = 0; i < bidIds.length; i++) {
            Bid storage bid = bids[bidIds[i]];
            if (bid.status == BidStatus.ACCEPTED) {
                weightedRate += (bid.amount * bid.interestRate);
            }
        }
        weightedRate = weightedRate / principal;

        uint256 minimumInterestPeriod = (loan.loanDuration * 35) / 100; // minimumInterestPeriod is 35% of loanDuration

        uint256 outstandingPrincipal = principal - loan.totalRepaid;

        if (timeElapsed < minimumInterestPeriod) {
            // interest is calculated based on entire principal regardless of totalRepaid
            uint256 interest = (principal *
                weightedRate *
                minimumInterestPeriod) / (365 days * 10000);
            return outstandingPrincipal + interest;
        }

        // intrest is calculated based on what is actually owed
        uint256 interest = (outstandingPrincipal * weightedRate * timeElapsed) /
            (365 days * 10000);

        return outstandingPrincipal + interest;
    }

    function _withdrawTokens(
        bytes memory receiver,
        uint256 amount,
        address zrc20Token
    ) private returns (bool) {
        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20Token)
            .withdrawGasFee();

        require(gasFee > amount, "Insufficient Funds to Withdraw");

        IZRC20(zrc20Token).approve(address(gatewayZEVM), amount - gasFee);

        RevertOptions memory revertOptions = RevertOptions({
            revertAddress: address(this),
            callOnRevert: true,
            abortAddress: address(0),
            revertMessage: bytes(""),
            onRevertGasLimit: 300000
        });
        emit WithdrawalInitiated(zrc20Token, amount, receiver);

        try gatewayZEVM.withdraw(receiver, amount, zrc20Token, revertOptions) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @dev Get USD value of an asset amount
     */
    function getAssetValueUSD(
        address asset,
        uint256 amount
    ) internal view returns (uint256) {
        uint256 price = assetPrices[asset];
        require(price > 0, "Asset price not available");

        // Assuming 18 decimals for both price and amount
        return (amount * price) / 1e18;
    }

    // Private implementation for token swap
    function _executeSwap(
        address inputToken,
        address outputToken,
        uint256 amount
    ) private returns (bool) {
        IZRC20(inputToken).approve(uniswapRouter, amount);

        // calculate the minimum amount of outputToken that would be returned by the inputAmount swap
        uint256 minOutAmount = SwapHelperLib.getMinOutAmount(
            uniswapRouter,
            inputToken,
            outputToken,
            amount
        );

        // Get initial output token balance to calculate actual swap output
        uint256 initialBalance = IZRC20(outputToken).balanceOf(address(this));
        uint256 gasBefore = gasleft();
        // Execute the swap using SwapHelperLib
        uint256 _amount = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            inputToken,
            amount,
            outputToken,
            minOutAmount
        );
        uint256 gasAfter = gasleft();

        // find a way of charging this to the initiator
        uint256 gasUsed = gasBefore - gasAfter;

        if (_amount <= 0) return false;

        // Calculate the actual output amount
        uint256 finalBalance = IZRC20(outputToken).balanceOf(address(this));
        uint256 outputAmount = finalBalance - initialBalance;

        // Verify minimum output was received, idk about this
        if (outputAmount < minOutAmount) return false;

        return true;
    }

    function _removeLoanFromActive(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        require(loan.status != LoanStatus.ACTIVE, "Loan still active");

        uint256 idx = activeLoanIndex[loanId];
        uint256 lastId = activeLoanIds[activeLoanIds.length - 1];

        // swap
        activeLoanIds[idx] = lastId;
        activeLoanIndex[lastId] = idx;

        // pop
        activeLoanIds.pop();
        delete activeLoanIndex[loanId];
    }

    /**
     *@dev Get asset last price
     *@param assets ZRC20 token address
     *@return lastPrice List of price map to assetsOut
     *@return assetsOut List of asset addresses for the price list
     */
    function _getAssetLastPrice(
        address[] memory assets,
        bytes[] calldata pythUpdateData
    )
        internal
        returns (uint128[] memory lastPrice, address[] memory assetsOut)
    {
        uint256 updateFee = pyth.getUpdateFee(pythUpdateData);
        pyth.updatePriceFeeds{value: updateFee}(pythUpdateData);

        lastPrice = new uint128[](assets.length);
        assetsOut = assets;

        for (uint256 i = 0; i < assets.length; i++) {
            require(supportedAssets[assets[i]], "Asset not supported");

            bytes32 assetID = pythPriceIds[assets[i]];

            PythStructs.Price memory assetPrice = pyth.getPriceNoOlderThan(
                assetID,
                60
            );

            uint256 basePrice = PythUtils.convertToUint(
                assetPrice.price,
                assetPrice.expo,
                18
            );

            require(basePrice > 0, "Invalid price from feed");

            lastPrice[i] = uint128(basePrice);
        }
    }

    // =============== GETTERS ===============

    /**
     * @dev Get the list of supported assets
     * @return Array of supported asset addresses
     */
    function getSupportedAssets() public view returns (address[] memory) {
        return supportedAssetsList;
    }

    /**
     * @dev Returns user's data
     * @param user User's address
     */
    function getUserData(
        address user
    )
        public
        view
        returns (
            Loan[] memory loansOut,
            Bid[] memory bidsOut,
            LoanRequest[] memory loanRequestsOut,
            Bid[] memory acceptedBidsOut
        )
    {
        User storage u = users[user];

        loansOut = new Loan[](u.loans.length);
        bidsOut = new Bid[](u.bids.length);
        loanRequestsOut = new LoanRequest[](u.loanRequests.length);
        acceptedBidsOut = new Bid[](u.acceptedBids.length);

        for (uint256 i = 0; i < u.loans.length; i++) {
            loansOut[i] = loans[u.loans[i]];
        }

        for (uint256 i = 0; i < u.bids.length; i++) {
            bidsOut[i] = bids[u.bids[i]];
        }

        for (uint256 i = 0; i < u.loanRequests.length; i++) {
            loanRequestsOut[i] = loanRequests[u.loanRequests[i]];
        }

        for (uint256 i = 0; i < u.acceptedBids.length; i++) {
            acceptedBidsOut[i] = bids[u.acceptedBids[i]];
        }
    }
    /**
     *@dev returns the loan and total owed on the loan
     *@param loanId ID of required loan
     */
    function getLoan(
        uint256 loanId
    )
        external
        view
        returns (
            Loan memory loan,
            uint256 totalOwed,
            bytes32[] memory pairFeedIds // [principalFeedId, collateralFeedId]
        )
    {
        loan = loans[loanId];
        totalOwed = _calculateTotalOwed(loanId);
        pairFeedIds = new bytes32[](2);
        pairFeedIds[0]= pythPriceIds[loan.principalAsset];
        pairFeedIds[1]= pythPriceIds[loan.collateralAsset];

    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        (string memory action, address initiator, bytes memory data) = abi
            .decode(message, (string, address, bytes));

        bytes32 actionHash = keccak256(bytes(action));

        if (actionHash == keccak256("CREATE_LOAN_REQUEST")) {
            // Create a new loan request
            (
                address principalAsset,
                uint256 principalAmount,
                bytes memory receivingWallet,
                uint256 maxInterestRate,
                uint256 loanDuration,
                uint256 requestValidDays
            ) = abi.decode(
                    data,
                    (address, uint256, bytes, uint256, uint256, uint256)
                );

            _createLoanRequest(
                initiator,
                principalAsset,
                zrc20,
                principalAmount,
                amount,
                receivingWallet,
                maxInterestRate,
                loanDuration,
                requestValidDays
            );
        } else if (actionHash == keccak256("EXECUTE_LOAN")) {
            (uint256 loanRequestId, uint256[] memory acceptedBids) = abi.decode(
                data,
                (uint256, uint256[])
            );

            // Execute Loan
            _executeLoan(initiator, loanRequestId, acceptedBids);
        } else if (actionHash == keccak256("RECOVER_LOAN_COLLATERAL")) {
            (uint256 loanRequestId, bytes memory to) = abi.decode(
                data,
                (uint256, bytes)
            );
            _releaseLoanCollateral(initiator, loanRequestId, to);
        } else if (actionHash == keccak256("PLACE_LOAN_REQUEST_BID")) {
            // Place a bid on a loan request
            MetaBid[] memory metaBids = abi.decode(data, (MetaBid[]));
            _placeBidBatch(metaBids);
        } else if (actionHash == keccak256("RECOVER_BID_FUNDING")) {
            // Recover funding collateral from a bid
            uint256 bidId = abi.decode(data, (uint256));
            bytes memory bytesInitiator = abi.encodePacked(initiator);
            _releaseFundingCollateral(initiator, bidId, bytesInitiator);
        } else if (actionHash == keccak256("REPAY_LOAN")) {
            // Repay a loan
            (uint256 loanId, uint256 amount) = abi.decode(
                data,
                (uint256, uint256)
            );
            require(amount > 0, "No amount recieved");
            _repayLoan(initiator, loanId, amount);
        } else if (actionHash == keccak256("ADD_SUPPORTED_ASSETS")) {
            // Add supported assets
            (address[] memory assets, bytes32[] memory feedIDs) = abi.decode(
                data,
                (address[], bytes32[])
            );
            _addSupportedAssets(initiator, assets, feedIDs);
        } else if (actionHash == keccak256("EMERGENCY_PAUSE")) {
            // Emergency pause the protocol
            _emergencyPause(initiator, string(data));
        } else if (actionHash == keccak256("UNPAUSE")) {
            // Unpause the protocol
            __unpause(initiator);
        } else {
            // Handle other actions
            revert("Invalid action");
        }
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Add supported assets
     * @param assets Array of ZRC20 token addresses
     * @param feedIds Array of pyth price feed ids
     */
    function _addSupportedAssets(
        address initiator,
        address[] memory assets,
        bytes32[] memory feedIds
    ) internal _onlyOwner(initiator) {
        require(assets.length == feedIds.length, "Mismatched arrays");
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            bytes32 feedId = feedIds[i];

            require(asset != address(0), "Invalid asset address");
            require(!supportedAssets[asset], "Asset already supported");

            supportedAssets[asset] = true;
            supportedAssetsList.push(asset);

            pythPriceIds[asset] = feedId;
        }
    }

    /**
     * @dev Emergency pause
     * @param reason Reason for pausing
     */
    function _emergencyPause(
        address initiator,
        string memory reason
    ) internal _onlyOwner(initiator) {
        _pause();
        emit EmergencyPaused(reason, block.timestamp);
    }

    /**
     * @dev Resume operations
     */
    function __unpause(address initiator) internal _onlyOwner(initiator) {
        _unpause();
    }
}
