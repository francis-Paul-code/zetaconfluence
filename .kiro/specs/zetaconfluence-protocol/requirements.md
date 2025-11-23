# Requirements Document

## Introduction

ZetaConfluence is a cross-chain, decentralized peer-to-peer lending protocol deployed on ZetaChain. The system enables borrowers to request loans using one asset as collateral and receive another asset as principal, while lenders fund loan requests through a flexible bidding mechanism. The protocol consists of three primary layers: on-chain smart contracts for core lending logic, off-chain services for automated liquidation monitoring, and client-side applications for user interaction.

## Glossary

- **Protocol**: The ZetaConfluence smart contract system deployed on ZetaChain
- **Borrower**: A user who submits a loan request with collateral
- **Lender**: A user who funds loan requests by submitting bids
- **Loan Request**: A borrower's proposal specifying collateral asset, principal asset, amount, and terms
- **Bid**: A lender's offer to fund a loan request with specified amount and interest rate
- **Collateral**: The asset locked by the borrower to secure the loan
- **Principal**: The asset provided by the lender to the borrower
- **Escrow**: A temporary holding state for collateral before loan execution
- **Liquidation Bot**: An off-chain service that monitors and triggers liquidations
- **Liquidation Threshold**: The collateral-to-principal ratio below which liquidation occurs
- **Active Loan**: A loan in the ACTIVE status with outstanding principal
- **Pyth Price Feed**: External oracle service providing cross-chain asset price data
- **ZetaChain**: The blockchain network hosting the protocol's smart contracts

## Requirements

### Requirement 1: Loan Request Creation

**User Story:** As a borrower, I want to create a loan request with my chosen collateral and principal assets, so that lenders can review and bid on my loan terms.

#### Acceptance Criteria

1. WHEN a borrower submits a loan request, THE Protocol SHALL create an escrow entry for the specified collateral amount
2. WHEN a borrower submits a loan request, THE Protocol SHALL record the collateral asset type, principal asset type, requested amount, and loan duration
3. WHEN a borrower submits a loan request, THE Protocol SHALL validate that the collateral amount is greater than zero
4. WHEN a borrower submits a loan request, THE Protocol SHALL validate that the principal amount is greater than zero
5. WHEN a borrower submits a loan request, THE Protocol SHALL assign a unique identifier to the loan request

### Requirement 2: Bid Submission

**User Story:** As a lender, I want to submit bids on loan requests with my proposed interest rate and funding amount, so that I can participate in lending opportunities.

#### Acceptance Criteria

1. WHEN a lender submits a bid, THE Protocol SHALL record the bid amount, interest rate, and lender address
2. WHEN a lender submits a bid, THE Protocol SHALL validate that the bid amount is greater than zero
3. WHEN a lender submits a bid, THE Protocol SHALL validate that the interest rate is greater than or equal to zero
4. WHEN a lender submits a bid, THE Protocol SHALL associate the bid with the corresponding loan request identifier
5. WHEN a lender submits a bid, THE Protocol SHALL set the bid status to PENDING

### Requirement 3: Bid Acceptance

**User Story:** As a borrower, I want to accept one or multiple bids on my loan request, so that I can receive the principal funds I need.

#### Acceptance Criteria

1. WHEN a borrower accepts a bid, THE Protocol SHALL validate that the borrower is the owner of the loan request
2. WHEN a borrower accepts a bid, THE Protocol SHALL validate that the bid status is PENDING
3. WHEN a borrower accepts a bid, THE Protocol SHALL transfer the principal amount from the lender to the borrower
4. WHEN a borrower accepts a bid, THE Protocol SHALL create an active loan record with the accepted bid terms
5. WHEN a borrower accepts a bid, THE Protocol SHALL update the bid status to ACCEPTED

### Requirement 4: Loan Execution

**User Story:** As a borrower, I want my loan to become active after accepting bids, so that I can use the principal funds while my collateral remains secured.

#### Acceptance Criteria

1. WHEN a bid is accepted, THE Protocol SHALL transfer collateral from escrow to the active loan
2. WHEN a bid is accepted, THE Protocol SHALL set the loan status to ACTIVE
3. WHEN a bid is accepted, THE Protocol SHALL record the loan start timestamp
4. WHEN a bid is accepted, THE Protocol SHALL calculate and record the loan maturity date based on the requested duration
5. WHEN a bid is accepted, THE Protocol SHALL record the total principal owed including interest

### Requirement 5: Loan Repayment

**User Story:** As a borrower, I want to repay my loan with interest, so that I can reclaim my collateral and complete the loan agreement.

#### Acceptance Criteria

1. WHEN a borrower submits a repayment, THE Protocol SHALL validate that the loan status is ACTIVE
2. WHEN a borrower submits a repayment, THE Protocol SHALL validate that the repayment amount equals the principal plus accrued interest
3. WHEN a borrower submits a full repayment, THE Protocol SHALL transfer the principal plus interest to the lender
4. WHEN a borrower submits a full repayment, THE Protocol SHALL return the collateral to the borrower
5. WHEN a borrower submits a full repayment, THE Protocol SHALL update the loan status to COMPLETED

### Requirement 6: Collateral Valuation

**User Story:** As a protocol user, I want collateral values to be calculated using real-time price feeds, so that loan health is accurately assessed.

#### Acceptance Criteria

1. WHEN collateral valuation is requested, THE Protocol SHALL query the Pyth Price Feed for the collateral asset price
2. WHEN collateral valuation is requested, THE Protocol SHALL query the Pyth Price Feed for the principal asset price
3. WHEN collateral valuation is requested, THE Protocol SHALL calculate the collateral value in terms of the principal asset
4. WHEN collateral valuation is requested, THE Protocol SHALL apply the appropriate decimal normalization for both assets
5. WHEN the Pyth Price Feed is unavailable, THE Protocol SHALL revert the transaction with an error message

### Requirement 7: Liquidation Detection

**User Story:** As a lender, I want under-collateralized loans to be automatically detected, so that my principal is protected from collateral value drops.

#### Acceptance Criteria

1. WHILE a loan is in ACTIVE status, THE Liquidation Bot SHALL monitor the collateral-to-principal ratio
2. WHILE a loan is in ACTIVE status, THE Liquidation Bot SHALL query price feeds at regular intervals not exceeding 60 seconds
3. WHEN the collateral value falls below the principal owed multiplied by the liquidation threshold, THE Liquidation Bot SHALL identify the loan as under-collateralized
4. WHEN a loan is identified as under-collateralized, THE Liquidation Bot SHALL record the detection event in its database
5. WHEN a loan is identified as under-collateralized, THE Liquidation Bot SHALL prepare a liquidation transaction

### Requirement 8: Liquidation Execution

**User Story:** As a lender, I want under-collateralized loans to be liquidated automatically, so that I can recover value from the collateral.

#### Acceptance Criteria

1. WHEN the Liquidation Bot submits a liquidation transaction, THE Protocol SHALL validate that the collateral value is below the liquidation threshold
2. WHEN the Protocol validates liquidation conditions, THE Protocol SHALL transfer the collateral to the lender
3. WHEN the Protocol validates liquidation conditions, THE Protocol SHALL update the loan status to LIQUIDATED
4. WHEN the Protocol validates liquidation conditions, THE Protocol SHALL emit a liquidation event with the loan identifier and collateral amount
5. IF a liquidation transaction fails, THEN THE Liquidation Bot SHALL retry the transaction up to three times with exponential backoff

### Requirement 9: Liquidation Bot Persistence

**User Story:** As a protocol operator, I want the liquidation bot to maintain state across restarts, so that loan monitoring continues reliably.

#### Acceptance Criteria

1. WHEN the Liquidation Bot starts, THE Liquidation Bot SHALL restore all active loan watches from the PostgreSQL database
2. WHEN the Liquidation Bot detects a new active loan, THE Liquidation Bot SHALL persist the loan identifier to the database
3. WHEN the Liquidation Bot processes a liquidation, THE Liquidation Bot SHALL record the liquidation attempt in the database
4. WHEN a loan is completed or liquidated, THE Liquidation Bot SHALL remove the loan from active monitoring
5. WHEN the Liquidation Bot queries price data, THE Liquidation Bot SHALL store the price snapshot with timestamp in the database

### Requirement 10: Multi-Bid Acceptance

**User Story:** As a borrower, I want to accept multiple bids to fully fund my loan request, so that I can aggregate principal from multiple lenders.

#### Acceptance Criteria

1. WHEN a borrower accepts multiple bids, THE Protocol SHALL validate that the total bid amounts do not exceed the requested principal
2. WHEN a borrower accepts multiple bids, THE Protocol SHALL create separate loan records for each accepted bid
3. WHEN a borrower accepts multiple bids, THE Protocol SHALL proportionally allocate collateral to each loan based on bid amounts
4. WHEN a borrower accepts multiple bids, THE Protocol SHALL execute all loan activations atomically
5. IF any loan activation fails, THEN THE Protocol SHALL revert all bid acceptances in the transaction

### Requirement 11: Cross-Chain Asset Support

**User Story:** As a borrower, I want to use assets from different blockchains as collateral and principal, so that I can access liquidity across chains.

#### Acceptance Criteria

1. WHEN a loan request specifies cross-chain assets, THE Protocol SHALL validate asset compatibility through ZetaChain omni-chain capabilities
2. WHEN a loan request specifies cross-chain assets, THE Protocol SHALL record the source chain identifier for both collateral and principal
3. WHEN collateral is locked, THE Protocol SHALL initiate cross-chain transfer if the collateral originates from a different chain
4. WHEN principal is distributed, THE Protocol SHALL initiate cross-chain transfer to the borrower's specified destination chain
5. WHEN repayment occurs, THE Protocol SHALL return collateral to the borrower's original chain

### Requirement 12: Interest Calculation

**User Story:** As a lender, I want interest to be calculated accurately based on the agreed rate and loan duration, so that I receive fair compensation.

#### Acceptance Criteria

1. WHEN a loan becomes active, THE Protocol SHALL calculate the total interest as principal multiplied by interest rate multiplied by duration
2. WHEN a loan becomes active, THE Protocol SHALL record the total amount owed as principal plus calculated interest
3. WHEN repayment is submitted, THE Protocol SHALL validate that the payment includes the full principal plus interest
4. WHEN interest is calculated, THE Protocol SHALL use fixed-point arithmetic to prevent rounding errors
5. WHEN interest is calculated, THE Protocol SHALL support interest rates with precision up to four decimal places

### Requirement 13: Loan Cancellation

**User Story:** As a borrower, I want to cancel my loan request before any bids are accepted, so that I can retrieve my collateral if I change my mind.

#### Acceptance Criteria

1. WHEN a borrower requests cancellation, THE Protocol SHALL validate that no bids have been accepted for the loan request
2. WHEN a borrower requests cancellation, THE Protocol SHALL validate that the borrower is the owner of the loan request
3. WHEN cancellation is validated, THE Protocol SHALL return the collateral from escrow to the borrower
4. WHEN cancellation is validated, THE Protocol SHALL update the loan request status to CANCELLED
5. WHEN cancellation is validated, THE Protocol SHALL reject all pending bids for the loan request

### Requirement 14: Web Frontend Display

**User Story:** As a protocol user, I want to view all loan requests, active loans, and bids through a web interface, so that I can easily interact with the protocol.

#### Acceptance Criteria

1. WHEN a user accesses the web frontend, THE Web Frontend SHALL display all active loan requests with collateral and principal details
2. WHEN a user accesses the web frontend, THE Web Frontend SHALL display all active loans with repayment status and maturity dates
3. WHEN a user accesses the web frontend, THE Web Frontend SHALL display all bids associated with each loan request
4. WHEN a user accesses the web frontend, THE Web Frontend SHALL normalize asset decimals for consistent display
5. WHEN a user accesses the web frontend, THE Web Frontend SHALL display asset icons and metadata from the supported-assets configuration

### Requirement 15: Wallet Integration

**User Story:** As a protocol user, I want to connect my wallet to interact with the protocol, so that I can submit transactions securely.

#### Acceptance Criteria

1. WHEN a user connects a wallet, THE Web Frontend SHALL support MetaMask for EVM-compatible chains
2. WHEN a user connects a wallet, THE Web Frontend SHALL support Phantom for Solana-based assets
3. WHEN a user connects a wallet, THE Web Frontend SHALL support WalletConnect for multi-chain compatibility
4. WHEN a user submits a transaction, THE Web Frontend SHALL request signature approval through the connected wallet
5. WHEN a wallet connection is established, THE Web Frontend SHALL display the user's address and connected network

### Requirement 16: Storage Modularity

**User Story:** As a protocol developer, I want all state stored in a separate Storage contract, so that the protocol can be upgraded without data migration.

#### Acceptance Criteria

1. WHEN the Protocol stores data, THE Protocol SHALL write all loan requests to the Storage contract
2. WHEN the Protocol stores data, THE Protocol SHALL write all loans to the Storage contract
3. WHEN the Protocol stores data, THE Protocol SHALL write all bids to the Storage contract
4. WHEN the Protocol stores data, THE Protocol SHALL write all escrows to the Storage contract
5. WHEN the Protocol retrieves data, THE Protocol SHALL read from the Storage contract using standardized getter functions

### Requirement 17: Type Safety

**User Story:** As a protocol developer, I want consistent type definitions across all contracts, so that data structures remain compatible and maintainable.

#### Acceptance Criteria

1. WHEN contracts define data structures, THE Protocol SHALL use struct definitions from the Types contract
2. WHEN contracts define status values, THE Protocol SHALL use enum definitions from the Types contract
3. WHEN contracts pass data between functions, THE Protocol SHALL use Types contract definitions for parameters
4. WHEN contracts emit events, THE Protocol SHALL use Types contract definitions for event parameters
5. WHEN new types are needed, THE Protocol SHALL add definitions to the Types contract before implementation

### Requirement 18: Liquidation Bot Retry Logic

**User Story:** As a protocol operator, I want the liquidation bot to retry failed transactions intelligently, so that temporary network issues do not prevent liquidations.

#### Acceptance Criteria

1. WHEN a liquidation transaction fails, THE Liquidation Bot SHALL wait 5 seconds before the first retry
2. WHEN a liquidation transaction fails, THE Liquidation Bot SHALL wait 15 seconds before the second retry
3. WHEN a liquidation transaction fails, THE Liquidation Bot SHALL wait 45 seconds before the third retry
4. WHEN a liquidation transaction fails three times, THE Liquidation Bot SHALL log the failure and alert the operator
5. WHEN a liquidation transaction succeeds, THE Liquidation Bot SHALL mark the loan as liquidated in the database to prevent duplicate attempts

### Requirement 19: Collateral-Principal Ratio Validation

**User Story:** As a lender, I want loan requests to meet minimum collateral requirements, so that my principal is adequately secured.

#### Acceptance Criteria

1. WHEN a loan request is created, THE Protocol SHALL calculate the collateral-to-principal ratio using current prices
2. WHEN a loan request is created, THE Protocol SHALL validate that the ratio meets the minimum threshold of 1.5
3. WHEN a bid is accepted, THE Protocol SHALL revalidate the collateral-to-principal ratio
4. IF the collateral ratio falls below the minimum, THEN THE Protocol SHALL reject the loan request creation
5. IF the collateral ratio falls below the minimum during bid acceptance, THEN THE Protocol SHALL revert the transaction

### Requirement 20: Event Emission

**User Story:** As a protocol integrator, I want all state changes to emit events, so that I can track protocol activity off-chain.

#### Acceptance Criteria

1. WHEN a loan request is created, THE Protocol SHALL emit a LoanRequestCreated event with request details
2. WHEN a bid is submitted, THE Protocol SHALL emit a BidSubmitted event with bid details
3. WHEN a bid is accepted, THE Protocol SHALL emit a BidAccepted event with loan identifier
4. WHEN a loan is repaid, THE Protocol SHALL emit a LoanRepaid event with repayment amount
5. WHEN a loan is liquidated, THE Protocol SHALL emit a LoanLiquidated event with collateral transfer details
