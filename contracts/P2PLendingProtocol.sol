// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

import {UniversalContract} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";

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
    GatewayZEVM public immutable gatewayZEVM;
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
    uint256 public constant RETRY_ATTEMPTS = 3;
    uint256[] public _bids;
    string[] public SUPPORTED_ACTIONS = [
        "CREATE_LOAN_REQUEST",
        "PLACE_LOAN_REQUEST_BID",
        "RECOVER_BID_FUNDING",
        "EXECUTE_LOAN",
        "REPAY_LOAN",
        "RECOVER_LOAN_COLLATERAL",
        "GET_SUPPORTED_ACTIONS",
        "GET_SUPPORTED_ASSETS",
        // ADMIN ACTIONS
        "ADD_SUPPORTED_ASSETS",
        "UPDATE_ASSET_PRICE",
        "EMERGENCY_PAUSE",
        "UNPAUSE"
    ];

    error Unauthorized();

    // =============== MAPPINGS ===============

    mapping(address => bool) public supportedAssets; // ZRC20 asset support
    mapping(uint256 => LoanRequest) public loanRequests; // Loan Request ID to Loan Request details
    mapping(address => uint256) public assetPrices; // Asset prices in USD (18 decimals)
    mapping(address => ChainLinkPriceFeed) public chainLinkFeeds; // Chainlink price feeds for assets
    mapping(uint256 => EscrowInfo) public collateralEscrows; // Loan ID to collateral escrow info
    mapping(uint256 => Loan) public loans; // Loan ID to Loan details
    mapping(uint256 => Bid) public bids;
    mapping(address => uint256) public nonces;
    mapping(uint256 => EscrowInfo) public fundingEscrows;
    mapping(uint256 => uint256) public lastPriceCheck;
    mapping(uint256 => uint256) public retryAttempts;
    mapping(uint256 => uint256) public nextRetryTime;

    // =============== VARIABLES ===============

    address[] public supportedAssetsList; // List of supported assets for iteration

    // =============== STRUCTS ===============

    struct ChainLinkPriceFeed {
        AggregatorV3Interface priceFeed;
        uint8 decimals; // Number of decimals in the price feed
        uint64 lastUpdated; // Timestamp of the last price update
        uint128 lastPrice; // Last price fetched from the Chainlink feed
    }

    /**
     * @dev A loan request is where a borrowers submits intent to acquire a loan, this sets the initial step for the loan funding auction to begin. This locks the collateral and the listing fee is unrefundable.
     * @param id Unique identifier for the loan request.
     * @param borrower Address of the borrower.
     * @param principalAsset Asset the borrower wants (ZRC20).
     * @param collateralAsset Asset the borrower provides as collateral (ZRC20).
     * @param principalAmount Amount the borrower wants.
     * @param collateralAmount Amount of collateral locked.
     * @param receivingWallet Where the borrower wants the principal sent.
     * @param maxInterestRate Maximum interest rate acceptable (basis points).
     * @param loanDuration Loan duration in days.
     * @param requestValidDays loan request validity in days.
     * @param listingFee Protocol fee paid by borrower.
     */
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

    /**
     * @dev A loan is created when a borrower accepts the funding offers available from creditors
     * @param id Unique identifier for the loan.
     * @param borrower Address of the borrower.
     * @param principalAsset Asset the borrower wants (ZRC20).
     * @param collateralAsset Asset the borrower provides as collateral (ZRC20).
     * @param principalAmount Amount the borrower wants.
     * @param collateralAmount Amount of collateral locked.
     * @param receivingWallet Where the borrower wants the principal sent.
     * @param loanDuration Loan duration in seconds.
     * @param repaymentDeadline When the loan must be repaid (set when activated).
     * @param requestExpiry When the loan request expires.
     * @param listingFee Protocol fee paid by borrower.
     * @param status Current status of the loan.
     * @param createdAt Timestamp when the loan was created.
     * @param activatedAt Timestamp when the loan was activated.
     * @param totalRepaid Total amount repaid so far.
     *@param loanRequest The request that was filled to create the loan
     */
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
    event ChainLinkPriceFeedAdded(
        address indexed asset,
        address aggregator,
        uint256 timestamp
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
        uint256 deadline
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
    event LoanCompleted(uint256 indexed loanId, uint256 completedAt);

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
        address payable _systemContract,
        address payable _gatewayZEVM
    ) Ownable(initialOwner) EIP712("P2PLendingProtocol", "1") {
        systemContract = SystemContract(_systemContract);
        gatewayZEVM = GatewayZEVM(_gatewayZEVM);
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
            loanID:0,
            bids: _bids,
            exists: true,
            status: LoanRequestStatus.REQUESTED
        });

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

        if(loanRequest.status == LoanRequestStatus.EXECUTED){
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

        // Validate total funding
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

            fundingEscrows[acceptedBids[i]].canWithdraw = false; // protect against withdraw attacks
        }

        weightedInterestRate = weightedInterestRate / totalFunding;

        // Execute all operations atomically
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

            loanRequests[loanRequest.id].loanID =  loanId;
            // Mark accepted bids
            for (uint256 i = 0; i < acceptedBids.length; i++) {
                bids[acceptedBids[i]].status = BidStatus.ACCEPTED;
            }

            emit LoanFunded(loanId, totalFunding, acceptedBids.length);
            emit LoanActivated(
                loanId,
                block.timestamp,
                loans[loanId].repaymentDeadline
            );

            // Start monitoring for liquidation
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
     * @dev Execute swap from funding asset to principal asset this is not currently available ill work on it last
     */
    // function _executeSwap(
    //     uint256 bidId,
    //     address tokenIn,
    //     address tokenOut,
    //     uint256 amountIn
    // ) internal returns (bool) {
    //     // This would integrate with ZetaChain's built-in DEX or external DEX
    //     // For now, simplified implementation

    //     SwapParams memory params = SwapParams({
    //         tokenIn: tokenIn,
    //         tokenOut: tokenOut,
    //         amountIn: amountIn,
    //         minAmountOut: _calculateMinAmountOut(tokenIn, tokenOut, amountIn),
    //         slippageBps: 500 // 5% default slippage
    //     });

    //     // Execute swap through ZetaChain's swap functionality
    //     // This is a simplified version - in production, you'd use actual DEX integration
    //     try systemContract.uniswapv2PairFor(IZRC20(tokenIn), IZRC20(tokenOut)) returns (address pair) {
    //         if (pair != address(0)) {
    //             // Execute swap logic here
    //             return true;
    //         }
    //     } catch {
    //         return false;
    //     }

    //     return false;
    // }

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

        // Release collateral to borrower
        collateralEscrows[loan.loanRequestID].canWithdraw = true;
        collateralEscrows[loan.loanRequestID].isLocked = false;

        emit LoanCompleted(loanId, block.timestamp);
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

        try gatewayZEVM.withdraw(receiver, amount, zrc20Token, revertOptions) {
            return true;
        } catch {
            return false;
        }

        emit WithdrawalInitiated(zrc20Token, amount, receiver);
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

    /**
     * @dev Generate deterministic escrow address
     */
    function _generateEscrowAddress(
        uint256 id,
        string memory escrowType
    ) internal pure returns (address) {
        return
            address(
                uint160(uint256(keccak256(abi.encodePacked(id, escrowType))))
            );
    }

    // =============== GETTERS ===============

    /**
     *@dev Get asset last price from Chainlink feed
     *@param asset ZRC20 token address
     *@return lastPrice Last price fetched from Chainlink feed
     *@return lastUpdated Timestamp of the last price update
     *@return decimals Number of decimals in the price feed
     */
    function _getAssetLastPrice(
        address asset
    )
        internal
        view
        returns (uint128 lastPrice, uint64 lastUpdated, uint8 decimals)
    {
        require(supportedAssets[asset], "Asset not supported");

        ChainLinkPriceFeed storage feed = chainLinkFeeds[asset];
        (
            uint80 roundID,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.priceFeed.latestRoundData();
        uint8 _decimals = feed.priceFeed.decimals();
        require(_decimals > 0, "Unsupported decimals");
        require(answer > 0, "Invalid price from Chainlink feed");
        require(updatedAt > feed.lastUpdated, "Price not updated"); // may fail on initial fetch
        require(
            updatedAt > 0 && updatedAt <= block.timestamp,
            "Invalid update timestamp"
        );
        return (
            lastPrice = uint128(uint256(answer)),
            uint64(updatedAt),
            decimals
        );
    }

    /**
     * @dev Get the Chainlink price feed for an asset
     * @param asset ZRC20 token address
     * @return ChainLinkPriceFeed struct containing the price feed details
     */
    function _getChainLinkPriceFeed(
        address asset
    ) internal view returns (ChainLinkPriceFeed memory) {
        require(supportedAssets[asset], "Asset not supported");
        return chainLinkFeeds[asset];
    }

    /**
     * @dev Get the list of supported assets
     * @return Array of supported asset addresses
     */
    function _getSupportedAssets() internal view returns (address[] memory) {
        return supportedAssetsList;
    }

    // =============== ENTRY POINT ===============

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
            (
                uint256 loanRequestId,
                uint256[] memory acceptedBids
            ) = abi.decode(
                    data,
                    (uint256, uint256[])
                );

            // Execute Loan
            _executeLoan(
                initiator,
                loanRequestId,
                acceptedBids
            );

        } else if (
            actionHash == keccak256("RECOVER_LOAN_COLLATERAL")
        ) {
            (uint256 loanRequestId, bytes memory to) = abi.decode(data, (uint256, bytes));
            _releaseLoanCollateral(
                initiator,
                loanRequestId,
                to
            );
            
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
            (uint256 loanId, uint256 amount ) = abi.decode(data, (uint256, uint256));

            _repayLoan(initiator, loanId, amount);
        } else if (actionHash == keccak256("ADD_SUPPORTED_ASSETS")) {
            // Add supported assets
            (address[] memory assets, address[] memory aggregators) = abi
                .decode(data, (address[], address[]));
            _addSupportedAssets(initiator, assets, aggregators);
            for (uint256 i = 0; i < assets.length; i++) {
                emit ChainLinkPriceFeedAdded(
                    assets[i],
                    aggregators[i],
                    block.timestamp
                );
            }
        } else if (actionHash == keccak256("UPDATE_ASSET_PRICE")) {
            // Update asset prices
            _updateAssetPrice(initiator);
        } else if (actionHash == keccak256("EMERGENCY_PAUSE")) {
            // Emergency pause the protocol
            _emergencyPause(initiator, string(data));
        } else if (actionHash == keccak256("UNPAUSE")) {
            // Unpause the protocol
            __unpause(initiator);
        } else if (actionHash == keccak256("GET_SUPPORTED_ASSETS")) {
            // Get supported assets
            address[] memory assets = _getSupportedAssets();
            // Encode the response
            bytes memory response = abi.encode(assets);
            // Send the response back to the caller
            // systemContract.sendResponse(context, response);
        } else if (actionHash == keccak256("GET_SUPPORTED_ACTIONS")) {
            // Get supported actions
            bytes memory response = abi.encode(SUPPORTED_ACTIONS);
            // Send the response back to the caller
            // systemContract.sendResponse(context, response);
        } else {
            // Handle other actions
            revert("Invalid action");
        }
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Add supported assets
     * @param assets Array of ZRC20 token addresses
     * @param aggregators Array of Chainlink aggregator addresses
     */
    function _addSupportedAssets(
        address initiator,
        address[] memory assets,
        address[] memory aggregators
    ) internal _onlyOwner(initiator) {
        require(assets.length == aggregators.length, "Mismatched arrays");
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = assets[i];
            address aggregator = aggregators[i];

            require(asset != address(0), "Invalid asset address");
            require(aggregator != address(0), "Invalid aggregator address");
            require(!supportedAssets[asset], "Asset already supported");

            supportedAssets[asset] = true;
            supportedAssetsList.push(asset);

            // Initialize Chainlink price feed
            chainLinkFeeds[asset] = ChainLinkPriceFeed({
                priceFeed: AggregatorV3Interface(aggregator),
                decimals: 0,
                lastUpdated: 0,
                lastPrice: 0
            });
        }
    }

    /**
     * @dev Update asset price
     */
    function _updateAssetPrice(
        address initiator
    ) internal _onlyOwner(initiator) {
        require(supportedAssetsList.length > 0, "No supported assets");

        // Iterate through all supported assets and update their prices
        for (uint256 i = 0; i < supportedAssetsList.length; i++) {
            address asset = supportedAssetsList[i];
            ChainLinkPriceFeed storage feed = chainLinkFeeds[asset];

            (
                uint128 lastPrice,
                uint64 lastUpdated,
                uint8 decimals
            ) = _getAssetLastPrice(asset);

            uint128 currentPrice = feed.lastPrice;

            uint128 priceChange = lastPrice > currentPrice
                ? ((lastPrice - currentPrice) * 10000) / currentPrice
                : ((currentPrice - lastPrice) * 10000) / currentPrice;

            if (currentPrice != 0) {
                // initial price in system is zero
                require(priceChange <= 5000, "Price change too extreme"); // 50% max change
            }

            // Update the price and metadata
            feed.lastPrice = lastPrice;
            feed.lastUpdated = lastUpdated;
            feed.decimals = decimals;

            chainLinkFeeds[asset] = feed;
            assetPrices[asset] = lastPrice * (10 ** (18 - decimals));
            emit PriceUpdated(asset, assetPrices[asset], block.timestamp);
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
