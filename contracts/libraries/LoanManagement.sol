// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Types.sol";
import "./Storage.sol";

library LoanManagement {
    function createLoanRequest(
        StorageLib.LendingStorage storage s,
        address borrower,
        address principalAsset,
        address collateralAsset,
        uint256 principalAmount,
        uint256 collateralAmount,
        bytes memory receivingWallet,
        uint256 maxInterestRate,
        uint256 loanDuration,
        uint256 requestValidDays,
        uint256 listingFee
    ) external returns (uint256) {
        uint256 reqId = ++s.loanRequestCounter;
        uint256[] memory _bids;

        s.loanRequests[reqId] = Types.LoanRequest({
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
            status: Types.LoanRequestStatus.REQUESTED
        });

        if (s.users[borrower].exists) {
            s.users[borrower].loanRequests.push(reqId);
        } else {
            s.users[borrower].userAddress = borrower;
            s.users[borrower].exists = true;
            s.users[borrower].loanRequests.push(reqId);
        }

        return reqId;
    }

    function createEscrow(
        StorageLib.LendingStorage storage s,
        uint256 itemId,
        address owner,
        address asset,
        uint256 amount,
        uint8 escrowType // 1 = collateral, 2 = funding
    ) external returns (bytes32) {
        s.escrows[keccak256(abi.encode(itemId, owner, escrowType))] = Types
            .EscrowInfo({
                asset: asset,
                balance: uint128(amount),
                escrowType: escrowType == 1
                    ? keccak256("collateral")
                    : keccak256("funding"),
                owner: owner,
                initiatorID: itemId,
                isLocked: escrowType == 1 ? true : false,
                canWithdraw: escrowType == 1 ? false : true,
                exists: true
            });

        return keccak256(abi.encode(itemId, owner, escrowType));
    }

    function removeLoanFromActive(
        StorageLib.LendingStorage storage s,
        uint256 loanId
    ) external {
        Types.Loan storage loan = s.loans[loanId];
        require(loan.status != Types.LoanStatus.ACTIVE, "Loan still active");

        uint256 idx = s.activeLoanIndex[loanId];
        uint256 lastId = s.activeLoanIds[s.activeLoanIds.length - 1];

        // swap
        s.activeLoanIds[idx] = lastId;
        s.activeLoanIndex[lastId] = idx;

        // pop
        s.activeLoanIds.pop();
        delete s.activeLoanIndex[loanId];
    }

    function distributeLoanRewards(
        StorageLib.LendingStorage storage s,
        uint256 loanId,
        uint256 amount
    ) external {
        Types.Loan storage loan = s.loans[loanId];
        uint256[] storage bidIds = loan.bids;

        for (uint256 i = 0; i < bidIds.length; i++) {
            Types.Bid storage bid = s.bids[bidIds[i]];
            if (bid.status == Types.BidStatus.ACCEPTED) {
                uint256 lenderShare = (amount * bid.amountFilled) /
                    loan.principalAmount;
                // add lender's share to their funding escrow
                s
                    .escrows[keccak256(abi.encode(bid.id, bid.lender, 2))]
                    .balance += uint128(lenderShare);
            }
        }
    }

    /**
     * @dev Calculate total amount owed for a loan (principal + interest)
     */
    function calculateTotalOwed(
        StorageLib.LendingStorage storage s,
        uint256 loanId
    ) external view returns (uint256) {
        Types.Loan storage loan = s.loans[loanId];
        if (loan.status != Types.LoanStatus.ACTIVE) return 0;

        uint256 timeElapsed = block.timestamp - loan.createdAt;

        uint256 minimumInterestPeriod = (loan.loanDuration * 35) / 100; // minimumInterestPeriod is 35% of loanDuration

        uint256 outstandingPrincipal = loan.principalAmount - loan.totalRepaid;

        if (timeElapsed < minimumInterestPeriod) {
            // interest is calculated based on entire principal regardless of totalRepaid
            uint256 minimumInterest = (loan.principalAmount *
                loan.interestRate *
                minimumInterestPeriod) / (365 days * 10000);
            return outstandingPrincipal + minimumInterest;
        }

        // intrest is calculated based on what is actually owed
        uint256 interest = (outstandingPrincipal *
            loan.interestRate *
            timeElapsed) / (365 days * 10000);

        return outstandingPrincipal + interest;
    }
}
