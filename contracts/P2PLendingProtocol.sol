// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {
    IZRC20
} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {
    RevertContext,
    RevertOptions
} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {
    UniversalContract
} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import {PythUtils} from "@pythnetwork/pyth-sdk-solidity/PythUtils.sol";

import {Types} from "./libraries/Types.sol";
import {LoanUtils} from "./libraries/LoanUtils.sol";
import {LoanManagement} from "./libraries/LoanManagement.sol";
import {StorageLib} from "./libraries/Storage.sol";
import {BidManagement} from "./libraries/BidManagement.sol"

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
    uint256 public loanRequestCounter = 1;
    uint256 public loanCounter = 1;
    uint256 public bidCounter = 1;

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
    string[] public supportedActions = [
        "CREATE_LOAN_REQUEST",
        "PLACE_LOAN_REQUEST_BID",
        "RECOVER_BID_FUNDING",
        "EXECUTE_LOAN",
        "REPAY_LOAN",
        "RECOVER_LOAN_COLLATERAL"
    ];

    error Unauthorized();

    // =============== MAPPINGS ===============

    StorageLib.LendingStorage internal store;

    mapping(address => bool) public supportedAssets; // ZRC20 asset support
    mapping(address => uint256) public assetPrices; // Asset prices in USD (18 decimals)
    mapping(address => bytes32) public pythPriceIds;
    mapping(address => uint256) public nonces;
    mapping(uint256 => uint256) public lastPriceCheck; //  LoadID => (last price timestamp)
    mapping(uint256 => uint256) public retryAttempts;
    mapping(uint256 => uint256) public nextRetryTime;

    // =============== VARIABLES ===============
    address[] public supportedAssetsList; // List of supported assets for iteration
    
    using LoanManagement for StorageLib.LendingStorage;
    using BidManagement for StorageLib.LendingStorage;

    //=============== MODIFIERS ================

    modifier onlyBorrower(uint256 loanRequestId, address initiator) {
        require(
            store.loanRequests[loanRequestId].borrower == initiator,
            "Only borrower can call this"
        );
        _;
    }

    modifier onlyLender(uint256 BidId, address initiator) {
        require(store.bids[BidId].lender == initiator, "Only lender can call this");
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
            store.loanRequests[loanRequestId].exists,
            "Only a valid loan Request can be executed"
        );
        _;
    }

    modifier validLoan(uint256 loanId) {
        require(
            store.loans[loanId].exists &&
                store.loans[loanId].status == Types.LoanStatus.ACTIVE,
            "Only valid loans can be repayed"
        );
        _;
    }

    modifier onlyDebtor(uint256 loanId, address debtor) {
        require(
            store.loans[loanId].borrower == debtor,
            "Only the debtor can clear the loan"
        );
        _;
    }

    // ======================= Constructor ========================
    constructor(
        address initialOwner,
        address _systemContract,
        address payable _gatewayZEVM,
        address _uniswapRouter,
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
        // Calculate values
        uint256 collateralValueUSD = LoanUtils.getAssetValueUSD(
            collateralAsset,
            collateralAmount,
            assetPrices[collateralAsset]
        );
        uint256 principalValueUSD = LoanUtils.getAssetValueUSD(
            principalAsset,
            principalAmount,
            assetPrices[principalAsset]
        );

        require(
            (collateralValueUSD * 10000) / principalValueUSD >=
                MIN_COLLATERAL_RATIO,
            "Insufficient collateral"
        );

        uint256 listingFee = (collateralValueUSD * LISTING_FEE_BPS) / 10000;
        require(msg.value >= listingFee, "Insufficient fee");

        // Use library for storage operations
        uint256 reqId = store.createLoanRequest(
            borrower,
            principalAsset,
            collateralAsset,
            principalAmount,
            collateralAmount,
            receivingWallet,
            maxInterestRate,
            loanDuration,
            requestValidDays,
            listingFee
        );

        // Create escrow record
        store.createEscrow(reqId, borrower, collateralAsset, collateralAmount, 1);

        emit Types.CollateralLocked(
            reqId,
            borrower,
            collateralAsset,
            collateralAmount
        );

        emit Types.LoanRequested(
            reqId,
            borrower,
            principalAsset,
            principalAmount,
            collateralAmount,
            collateralAsset
        );
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
        Types.LoanRequest storage loan_request = store.loanRequests[loanRequestId];
        Types.EscrowInfo storage escrow = store.escrows[
            keccak256(abi.encode(loan_request.id, loan_request.borrower, 1))
        ];

        require(!escrow.isLocked, "Collateral still locked");
        require(escrow.canWithdraw, "Cannot withdraw yet");
        require(escrow.owner == initiator, "Only owner can release");

        if (loan_request.status == Types.LoanRequestStatus.EXECUTED) {
            Types.Loan storage loan = store.loans[loan_request.loanID];
            require(
                loan.status != Types.LoanStatus.ACTIVE,
                "Loan is still active"
            );
        }
        require(e.balance > 0, "No Collateral Available for withdraw");

        bool withdraw = _withdrawTokens(to, escrow.balance, escrow.asset);

        if (withdraw) {
            emit Types.FundingCollateralReleased(loanRequestId, to, escrow.balance);
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
    function _placeBidBatch(
        Types.MetaBid[] memory metaBids
    ) internal whenNotPaused {
        require(metaBids.length <= MAX_BATCH_SIZE, "Batch too large");

        uint256[] memory successfulBids = new uint256[](metaBids.length);
        uint256 successCount = 0;

        for (uint256 i = 0; i < metaBids.length; i++) {
            uint256 bidId = _processSingleBid(metaBids[i]);
            if (bidId > 0) {
                successfulBids[successCount++] = bidId;
            } else {
                emit Types.BidFailed(
                    metaBids[i].loanRequestId,
                    metaBids[i].lender,
                    "Failed"
                );
            }
        }

        assembly {
            mstore(successfulBids, successCount)
        }
        emit Types.BidBatchProcessed(successfulBids, successCount);
    }

    /**
     * @dev Process a single meta-transaction bid
     */
    function _processSingleBid(
        Types.MetaBid memory bid
    ) internal returns (uint256) {
        // Validate bid against loan
        Types.LoanRequest storage loan_request = s.loanRequests[bid.loanRequestId];
        require(
            block.timestamp <=
                loan_request.createdAt + loan_request.requestValidDays * 1 days, // bug here
            "Loan request expired"
        );
        require(
            bid.interestRate <= loan_request.maxInterestRate,
            "Interest rate too high"
        );
        require(
            bid.amount > 0 && bid.amount <= loan_request.principalAmount,
            "Invalid bid amount"
        );
        require(
            supportedAssets[bid.fundingAsset],
            "Funding asset not supported"
        );

        // Create bid record
         Types.Bid storage _bid = store.createBid(
            bid.loanRequestId,
             bid.lender,
             bid.amount,
             bid.interestRate,
             bid.fundingAsset,
             Types.BidStatus.PENDING
        );

        // Lock lender funds
         store.createEscrow(_bid.id, _bid.lender, _bid.fundingAsset, _bid.amount, 2);

        // Increment nonce
        nonces[_bid.lender]++;

        emit Types.BidPlaced(
            _bid.id,
            _bid.loanRequestId,
            _bid.lender,
            _bid.amount,
            _bid.fundingAsset,
            _bid.interestRate
        );

        return _bid.id;
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
        Types.EscrowInfo storage escrow = store.escrows[keccak256(abi.encode(bidId,initiator,2))];
        require(escrow.isLocked, "Funding not locked");
        require(escrow.canWithdraw, "Cannot withdraw yet");
        require(escrow.owner == initiator, "Only owner can release");

        require(escrow.balance > 0, "No funding to withdraw");

        bool withdraw = _withdrawTokens(to, escrow.balance, escrow.asset);

        if (withdraw) {
            emit Types.FundingCollateralReleased(bidId, to, escrow.balance);
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
        Types.LoanRequest storage loan_request = store.loanRequests[loanRequestId];
        require(
            block.timestamp <=
                loan_request.createdAt + loan_request.requestValidDays * 1 days,
            "Loan request expired"
        );
        require(acceptedBids.length > 0, "No bids provided");

        uint256 totalFunding = 0;
        uint256 weightedInterestRate = 0;

        // handle accepted bids and any swaps here as well
        for (uint256 i = 0; i < acceptedBids.length; i++) {
            Types.Bid storage bid = store.bids[acceptedBids[i]];
            require(
                bid.loanRequestId == loanRequestId,
                "Bid not for this loan"
            );
            require(
                bid.status == Types.BidStatus.PENDING,
                "Invalid bid status"
            );

            if (totalFunding + bid.amount > loan_request.principalAmount) {
                uint256 balance = (loan_request.principalAmount - totalFunding);
                totalFunding += balance;
                store.bids[acceptedBids[i]].amountFilled = uint128(balance);

                // gas from filled bid is 1.5% of ammountFilled
                store.bids[acceptedBids[i]].gasDeducted =
                    (uint128(balance) * 15) /
                    1000;
                store.escrows[keccak256(abi.encode(bid.id,bid.lender,2))].balance -= uint128(balance); // update the escrow wallet balances
                weightedInterestRate += (balance * bid.interestRate);
            } else {
                totalFunding += bid.amount;
                store.bids[acceptedBids[i]].amountFilled = uint128(bid.amount);
                // gas from filled bid is 1.5% of ammountFilled, should later change to account for earnings
                store.bids[acceptedBids[i]].gasDeducted =
                    (uint128(bid.amount) * 15) /
                    1000;
                store.escrows[keccak256(abi.encode(bid.id,bid.lender,2))].balance -= uint128(bid.amount); // update the escrow wallet balances
                weightedInterestRate += (bid.amount * bid.interestRate);
            }

            // currently after filling lps cant remove their money, should allow this later but only if the amount withdrawn is less that the balance of the escrow, balance = amount - amountFilled

            store.users[bid.lender].acceptedBids.push(acceptedBids[i]);
            store.escrows[keccak256(abi.encode(bid.id,bid.lender,2))].canWithdraw = false;
        }

        weightedInterestRate = weightedInterestRate / totalFunding;

         bool success = _withdrawTokens(
            loan_request.receivingWallet,
            totalFunding,
            loan_request.principalAsset
        );
        
        if (success) {
            
            Types.Loan memory loan = store.createLoan(
                                                loan_request.borrower,
                                                loan_request.principalAsset,
                                                loan_request.collateralAsset,
                                                loan_request.principalAmount, 
                                                loan_request.collateralAmount,
                                                loan_request.receivingWallet, 
                                                loan_request.loanDuration, 
                                                uint64(weightedInterestRate),
                                                loan_request.id, 0);

            

            emit Types.LoanFunded(loan.id, totalFunding, acceptedBids.length);
            emit Types.LoanActivated(
                loan.id,
                block.timestamp,
                loan.repaymentDeadline,
                loan_request.borrower
            );

            lastPriceCheck[loan.id] = block.timestamp;
        } else {
            // Schedule retry
            _scheduleRetryExecution(loanRequestId, acceptedBids);
        }
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
            store.cancelLoanAndReturnFunds(loanRequestId, acceptedBids);
            return;
        }

        retryAttempts[loanRequestId] = attempts + 1;
        nextRetryTime[loanRequestId] =
            block.timestamp +
            (1 hours * (2 ** attempts));

        emit Types.LoanRetryScheduled(
            loanRequestId,
            nextRetryTime[loanRequestId]
        );
    }


    

    // ====================== UTILS ========================================
    
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
        emit Types.WithdrawalInitiated(zrc20Token, amount, receiver);

        try gatewayZEVM.withdraw(receiver, amount, zrc20Token, revertOptions) {
            return true;
        } catch {
            return false;
        }
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
        } else if (actionHash == keccak256("PLACE_LOAN_REQUEST_BID")) {
            // Place a bid on a loan request
            Types.MetaBid[] memory metaBids = abi.decode(data, (Types.MetaBid[]));
            _placeBidBatch(metaBids);
        } else if (actionHash == keccak256("EXECUTE_LOAN")) {
            (uint256 loanRequestId, uint256[] memory acceptedBids) = abi.decode(
                data,
                (uint256, uint256[])
            );

            // Execute Loan
            _executeLoan(initiator, loanRequestId, acceptedBids);
        }
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Add supported assets
     * @param assets Array of ZRC20 token addresses
     * @param feedIds Array of pyth price feed ids
     */
    function addSupportedAssets(
        address[] memory assets,
        bytes32[] memory feedIds
    ) external _onlyOwner(msg.sender) {
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
    function emergencyPause(
        string memory reason
    ) external _onlyOwner(msg.sender) {
        _pause();
        emit Types.EmergencyPaused(reason, block.timestamp);
    }

    /**
     * @dev Resume operations
     */
    function unpause() external _onlyOwner(msg.sender) {
        _unpause();
    }
}
