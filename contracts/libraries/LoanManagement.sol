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

    function createLoan(
        StorageLib.LendingStorage storage store,
        address borrower,
        address principalAsset,
        address collateralAsset,
        uint256 principalAmount,
        uint256 collateralAmount,
        bytes receivingWallet,
        uint256 loanDuration,
        uint64 interestRate,
        uint256 loanRequestID,
        uint128 totalRepaid,
        Types.Bid[] memory bids
    ) internal returns (Types.Loan memory loan) {
        Types.LoanRequest loan_request = store.loanRequests[loanRequestID];

        uint256 loanID = ++store.loanCounter;

        loan = Types.Loan({
            id: loanID,
            borrower: borrower,
            principalAsset: principalAsset,
            collateralAsset: collateralAsset,
            principalAmount: principalAmount,
            collateralAmount: collateralAmount,
            recievingWallet: recievingWallet,
            interestRate: interestRate,
            loanDuration: loanDuration,
            repaymentDeadline: block.timestamp +
                    loan_request.loanDuration *
                    1 days,
            status: Types.LoanStatus.ACTIVE,
            loanRequestID: loanRequestID,
            bids: bids,
            totalRepaid: 0,
            createdAt: block.timestamp,
            exists: true
        });
        if (store.users[borrower].exists) {
            store.users[borrower].loans.push(loanId);
        } else {
            Types.User storage user = store.users[borrower];
            user.loans.push(loanID);
            user.exists = true;
            user.userAddress = borrower;
        }

        store.activeLoanIds.push(loanID);
        uint256 index = store.activeLoanIds.length - 1;
        store.activeLoanIndex[loanID] = index;

        store.loanRequests[loan_request.id].loanID = loanID;
        for (uint256 i = 0; i < bids.length; i++) {
            store.bids[bids[i].id].status = Types.BidStatus.ACCEPTED;
        }

    }


    /**
     * @dev Cancel loan and return all funds
     */
    function cancelLoanAndReturnFunds(
        StorageLib.LendingStorage storage store,
        uint256 loanRequestId,
        uint256[] memory acceptedBids
    ) internal {
        Types.LoanRequest storage loan_request = store.loanRequests[loanRequestId];

        // Return collateral to borrower
        Types.EscrowInfo storage collateral_escrow = store.escrows[keccak256(abi.encode(loanRequestId,loan_request.borrower,1))];

        collateral_escrow.canWithdraw = true;
        collateral_escrow.isLocked = false;

        for (uint256 i = 0; i < acceptedBids.length; i++) {
            Types.Bid storage bid = store.bids[acceptedBids[i]];
            Types.EscrowInfo storage funding_escrow =  store.escrows[keccak256(abi.encode(bid.id,bid.lender,2))];
            funding_escrow.canWithdraw = true; // allow user to request for withdraw
            funding_escrow.balance += bid.amountFilled; // return escrow balance to before loan execution
        }

        loan_request.status = Types.LoanRequestStatus.CANCELLED;
    }
}
