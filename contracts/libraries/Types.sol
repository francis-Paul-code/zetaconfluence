// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library Types {
    struct User {
        address userAddress;
        uint256[] bids;
        uint256[] loans;
        uint256[] loanRequests;
        uint256[] acceptedBids;
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

    struct LiquidationInfo {
        uint256 collateralValue; // USD value of collateral
        uint256 loanValue; // USD value of loan + interest
        uint256 liquidationRatio; // Current collateralization ratio
        bool canLiquidate;
    }

    struct MetaLoanRequest {
        address borrower;
        address principalAsset;
        address collateralAsset;
        uint256 principalAmount;
        uint256 collateralAmount;
        bytes receivingWallet;
        uint256 maxInterestRate;
        uint256 loanDuration;
        uint256 requestValidDays;
    }

    // loans
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

    // bids
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
        uint128 createdAt;
        uint256 acceptedAt;
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

    // loans
    event LoanRequested(
        uint256 indexed loanRequestId,
        address indexed borrower,
        address principalAsset,
        uint256 principalAmount,
        uint256 collateralAmount,
        address collateralAsset
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
    //collateral
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

    // bids
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

    //core

    event EmergencyPaused(string reason, uint256 timestamp);

    event PriceUpdated(
        address indexed asset,
        uint256 newPrice,
        uint256 timestamp
    );
}
