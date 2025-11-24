// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IZRC20} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
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
}