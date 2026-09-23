// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library Events {
    event LoanRequested(
        uint256 indexed loanId,
        address indexed borrower
    );

    event LoanFunded(
        uint256 indexed loanId,
        address indexed lender,
        uint256 amount,
        uint256 chainId
    );

    event CollateralLocked(
        uint256 indexed loanId,
        address indexed asset,
        uint256 amount,
        uint256 chainId
    );

    event RemoteExecutionRequested(
        uint256 indexed loanId,
        uint256 indexed destinationChainId,
        bytes payload
    );

    event RemoteExecutionCompleted(
        uint256 indexed loanId,
        uint256 indexed sourceChainId
    );
}