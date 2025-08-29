// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {Types} from "./Types.sol";

contract CoreStorage is Ownable {
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
    mapping(uint256 => Types.LoanRequest) private loanRequests; // Loan Request ID to Loan Request details
    mapping(address => uint256) public assetPrices; // Asset prices in USD (18 decimals)
    mapping(address => bytes32) public pythPriceIds;
    mapping(uint256 => Types.EscrowInfo) public collateralEscrows; // Loan ID to collateral escrow info
    mapping(uint256 => Types.Loan) public loans; // Loan ID to Loan details
    mapping(uint256 => Types.Bid) public bids;
    mapping(address => uint256) public nonces;
    mapping(uint256 => Types.EscrowInfo) public fundingEscrows;
    mapping(uint256 => uint256) public lastPriceCheck; //  LoadID => (last price timestamp)
    mapping(uint256 => uint256) public retryAttempts;
    mapping(uint256 => uint256) public nextRetryTime;
    mapping(uint256 => uint256) private activeLoanIndex; // loanId -> index in activeLoanIds
    mapping(address => Types.User) private users; // user address => all user information

    // =============== VARIABLES ===============

    address[] public supportedAssetsList; // List of supported assets for iteration
    uint256[] public activeLoanIds; // iterable list of active loans

    constructor(address initialOwner) Ownable(initialOwner) {}

    // =============== GETTERS =================

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
            Types.Loan[] memory loansOut,
            Types.Bid[] memory bidsOut,
            Types.LoanRequest[] memory loanRequestsOut,
            Types.Bid[] memory acceptedBidsOut
        )
    {
        Types.User storage u = users[user];

        loansOut = new Types.Loan[](u.loans.length);
        bidsOut = new Types.Bid[](u.bids.length);
        loanRequestsOut = new Types.LoanRequest[](u.loanRequests.length);
        acceptedBidsOut = new Types.Bid[](u.acceptedBids.length);

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
            Types.Loan memory loan,
            uint256 totalOwed,
            bytes32[] memory pairFeedIds // [principalFeedId, collateralFeedId]
        )
    {
        loan = loans[loanId];
        totalOwed = _calculateTotalOwed(loanId);
        pairFeedIds = new bytes32[](2);
        pairFeedIds[0] = pythPriceIds[loan.principalAsset];
        pairFeedIds[1] = pythPriceIds[loan.collateralAsset];
    }
}
