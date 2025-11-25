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

    StorageLib.LendingStorage internal s;

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

    //=============== MODIFIERS ================

    modifier onlyBorrower(uint256 loanRequestId, address initiator) {
        require(
            s.loanRequests[loanRequestId].borrower == initiator,
            "Only borrower can call this"
        );
        _;
    }

    modifier onlyLender(uint256 BidId, address initiator) {
        require(s.bids[BidId].lender == initiator, "Only lender can call this");
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
            s.loanRequests[loanRequestId].exists,
            "Only a valid loan Request can be executed"
        );
        _;
    }

    modifier validLoan(uint256 loanId) {
        require(
            s.loans[loanId].exists &&
                s.loans[loanId].status == Types.LoanStatus.ACTIVE,
            "Only valid loans can be repayed"
        );
        _;
    }

    modifier onlyDebtor(uint256 loanId, address debtor) {
        require(
            s.loans[loanId].borrower == debtor,
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
        uint256 reqId = s.createLoanRequest(
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
        s.createEscrow(reqId, borrower, collateralAsset, collateralAmount, 1);

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
        Types.LoanRequest storage lr = s.loanRequests[loanRequestId];
        Types.EscrowInfo storage e = s.escrows[
            keccak256(abi.encode(lr.id, lr.borrower, 1))
        ];

        require(!e.isLocked, "Collateral still locked");
        require(e.canWithdraw, "Cannot withdraw yet");
        require(e.owner == initiator, "Only owner can release");

        if (lr.status == Types.LoanRequestStatus.EXECUTED) {
            Types.Loan storage loan = s.loans[lr.loanID];
            require(
                loan.status != Types.LoanStatus.ACTIVE,
                "Loan is still active"
            );
        }
        require(e.balance > 0, "No Collateral Available for withdraw");

        bool withdraw = _withdrawTokens(to, e.balance, e.asset);

        if (withdraw) {
            emit Types.FundingCollateralReleased(loanRequestId, to, e.balance);
        } else {
            revert("Funding release failed");
        }
        e.isLocked = false;
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
