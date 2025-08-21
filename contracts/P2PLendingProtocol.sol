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
    uint256[] public _bids;
    string[] public SUPPORTED_ACTIONS = [
        "CREATE_LOAN_REQUEST",
        "PLACE_LOAN_REQUEST_BID",
        "RECOVER_BID_FUNDING",
        "REPAY_LOAN",
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
        address receivingWallet;
        uint256 maxInterestRate;
        uint256 loanDuration;
        uint256 requestValidDays;
        uint256 listingFee;
        uint256[] bids;
        uint256 createdAt;
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
     * @param maxInterestRate Maximum interest rate acceptable (basis points).
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
        address receivingWallet;
        uint256 maxInterestRate;
        uint256 loanDuration;
        uint256 repaymentDeadline;
        uint256 requestExpiry;
        uint256 listingFee;
        LoanStatus status;
        uint256 createdAt;
        LoanRequest loanRequest;
        uint256 activatedAt;
        uint256 totalRepaid;
    }

    struct EscrowInfo {
        address asset; // ZRC20 token address
        uint128 amount;
        bytes32 escrowType;
        address owner;
        uint256 initiatorID; // ID of the initiator (loan request ID or Bid ID)
        bool isLocked;
        bool canWithdraw;
    }

    struct MetaBid {
        uint256 loanRequestId;
        address lender;
        uint128 amount;
        uint64 interestRate;
        address fundingAsset;
        uint256 nonce;
        uint64 deadline;
    }

    struct Bid {
        uint256 id;
        uint256 loanRequestId;
        address lender;
        uint128 amount; // Amount lender willing to provide
        uint64 interestRate; // Interest rate lender wants (basis points)
        address fundingAsset; // Asset lender has (ZRC20)
        bool requiresSwap; // Whether lender asset needs swap to principal
        BidStatus status;
        uint256 createdAt;
        uint128 gasDeducted; // Gas costs deducted from this bid
    }

    // =============== ENUMS ===============
    enum LoanStatus {
        REQUESTED, // Loan request created, awaiting bids
        FUNDED, // 100% funded, ready for execution
        ACTIVE, // Loan active, borrower received funds
        COMPLETED, // Loan fully repaid
        LIQUIDATED, // Collateral liquidated
        EXPIRED, // Request expired without funding
        CANCELLED // Cancelled by borrower
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
        address to,
        uint256 amount
    );
    // =============== MODIFIERS ===============

    modifier onlyBorrower(uint256 loanId) {
        require(
            loans[loanId].borrower == msg.sender,
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
        address receivingWallet,
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
        require(receivingWallet != address(0), "Invalid receiving wallet");

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
            createdAt:block.timestamp,
            bids:_bids
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
            amount: uint128(amount),
            escrowType: "collateral",
            owner: borrower,
            initiatorID: loanRequestId,
            isLocked: true,
            canWithdraw: false
        });

        emit CollateralLocked(loanRequestId, collateralAsset, borrower, amount);
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
            if(bidId > 0 ){
                successfulBids[successCount] = bidId;
                successCount++;
            }else{
                emit BidFailed(metaBids[i].loanRequestId, metaBids[i].lender, "Bid Creation Failed");
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
    function _processSingleBid(
        MetaBid memory bid
    ) internal returns (uint256) {
        // Validate bid against loan
        LoanRequest storage loanRequest = loanRequests[bid.loanRequestId];
        require(
            block.timestamp <= loanRequest.createdAt + loanRequest.requestValidDays * 1 days, // bug here
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
            interestRate: bid.interestRate,
            fundingAsset: bid.fundingAsset,
            requiresSwap: bid.fundingAsset != loanRequest.principalAsset,
            status: BidStatus.PENDING,
            createdAt: block.timestamp,
            gasDeducted: 0
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
            amount: uint128(amount),
            isLocked: true,
            canWithdraw: true
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
        address to
    ) internal whenNotPaused onlyLender(bidId, initiator) {
        EscrowInfo storage escrow = fundingEscrows[bidId];
        require(escrow.isLocked, "Funding not locked");
        require(escrow.canWithdraw, "Cannot withdraw yet");
        require(escrow.owner == initiator, "Only owner can release");
        uint256 gasFee = escrow.amount / 100; // Deduct 1% for gas fee
        // Transfer funds to recipient
        IZRC20(escrow.asset).approve(address(gatewayZEVM), gasFee); // currently making this gas free

        IZRC20(escrow.asset).transfer(to, escrow.amount - gasFee);
        escrow.isLocked = false;

        emit FundingCollateralReleased(bidId, to, escrow.amount);
    }

    // =============== UTILITY FUNCTIONS ===============

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
                address receivingWallet,
                uint256 maxInterestRate,
                uint256 loanDuration,
                uint256 requestValidDays
            ) = abi.decode(
                    data,
                    (address, uint256, address, uint256, uint256, uint256)
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
            MetaBid[] memory metaBids = abi.decode(data, (MetaBid[]));
            _placeBidBatch(metaBids);
        } else if (actionHash == keccak256("RECOVER_BID_FUNDING")) {
            // Recover funding collateral from a bid
            uint256 bidId = abi.decode(data, (uint256));
            _releaseFundingCollateral(initiator, bidId, initiator);
        } else if (actionHash == keccak256("REPAY_LOAN")) {
            // Repay a loan
            uint256 loanId = abi.decode(data, (uint256));
            // _repayLoan(loanId, initiator);
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
