// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

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

    // =============== CONSTANTS ===============

    uint256 public constant MIN_COLLATERAL_RATIO = 11000; // 110% (basis points)
    uint256 public constant LIQUIDATION_THRESHOLD = 10500; // 105%
    uint256 public constant MAX_INTEREST_RATE = 3000; // 30% APR
    uint256 public constant MIN_LOAN_DURATION = 7 days;
    uint256 public constant MAX_LOAN_DURATION = 365 days;
    uint256 public constant MAX_LOAN_REQUEST_DURATION = 30 days;
    uint256 public constant LISTING_FEE_BPS = 50; // 0.5%

    // =============== MAPPINGS ===============

    mapping(address => bool) public supportedAssets; // ZRC20 asset support
    mapping(uint256 => LoanRequest) public loanRequests; // Loan Request ID to Loan Request details
    mapping(address => uint256) public assetPrices; // Asset prices in USD (18 decimals)

    // =============== STRUCTS ===============

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

    // =============== CONSTRUCTOR ===============
    /**
     * @dev Initializes the P2P Lending Protocol contract.
     * @param systemContract_ Address of the SystemContract.
     * @param gatewayZEVM_ Address of the GatewayZEVM.
     */
    constructor(
        address payable _systemContract,
        address payable _gatewayZEVM
    ) EIP712("P2PLendingProtocol", "1") {
        systemContract = SystemContract(_systemContract);
        gatewayZEVM = GatewayZEVM(_gatewayZEVM);
        _transferOwnership(msg.sender);
    }

    // =============== LOAN REQUEST ===============

    /**
     * @dev Create a new loan request and lock collateral.
     * @param loanRequest The loan request details.
     */
    function createLoanRequest(
        address principalAsset,
        address collateralAsset,
        uint256 principalAmount,
        uint256 collateralAmount,
        address receivingWallet,
        uint256 maxInterestRate,
        uint256 loanDuration,
        uint256 requestValidDays
    ) external payable nonReentrant whenNotPaused {
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
        require(
            receivingWallet != address(0), // recieving wallet may be a non evm wallet, will this still work?
            "Invalid receiving wallet"
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
            borrower: msg.sender,
            principalAsset: principalAsset,
            collateralAsset: collateralAsset,
            principalAmount: principalAmount,
            collateralAmount: collateralAmount,
            receivingWallet: receivingWallet,
            maxInterestRate: maxInterestRate,
            loanDuration: loanDuration,
            requestValidDays: requestValidDays,
            listingFee: listingFee
        });

        // Lock collateral

        emit LoanRequested(
            loanId,
            msg.sender,
            principalAsset,
            principalAmount,
            collateralAmount
        );
    }

    // =============== UTILITY FUNCTIONS ===============

    /**
     * @dev Get USD value of an asset amount
     */
    function getAssetValueUSD(
        address asset,
        uint256 amount
    ) public view returns (uint256) {
        uint256 price = assetPrices[asset];
        require(price > 0, "Asset price not available");

        // Assuming 18 decimals for both price and amount
        return (amount * price) / 1e18;
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Add supported asset
     * @param asset ZRC20 token address
     * @param initialPrice Initial USD price with 18 decimals
     */
    function addSupportedAsset(
        address asset,
        uint256 initialPrice
    ) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(initialPrice > 0, "Invalid price");

        supportedAssets[asset] = true;
        assetPrices[asset] = initialPrice;

        emit PriceUpdated(asset, initialPrice, block.timestamp);
    }

    /**
     * @dev Update asset price
     * @param asset Asset address
     * @param newPrice New price in USD with 18 decimals
     */
    function updateAssetPrice(
        address asset,
        uint256 newPrice
    ) external onlyOwner {
        require(supportedAssets[asset], "Asset not supported");
        require(newPrice > 0, "Invalid price");

        // Prevent extreme price changes (>50% in one update)
        uint256 currentPrice = assetPrices[asset];
        uint256 priceChange = newPrice > currentPrice
            ? ((newPrice - currentPrice) * 10000) / currentPrice
            : ((currentPrice - newPrice) * 10000) / currentPrice;

        require(priceChange <= 5000, "Price change too extreme"); // 50% max change

        assetPrices[asset] = newPrice;
        emit PriceUpdated(asset, newPrice, block.timestamp);
    }

    /**
     * @dev Emergency pause
     * @param reason Reason for pausing
     */
    function emergencyPause(string calldata reason) external onlyOwner {
        _pause();
        emit EmergencyPaused(reason, block.timestamp);
    }

    /**
     * @dev Resume operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
