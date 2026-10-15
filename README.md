<div align="center" width="80%">

<img src="./frontend/app/public/logos/zetaconfluence_logo_primary.png" alt="ZetaConfluence Logo" width="200"/>

# ZetaConfluence

### Cross-Chain P2P Lending Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built on ZetaChain](https://img.shields.io/badge/Built%20on-ZetaChain-7C3AED)](https://www.zetachain.com/)
[![Powered by Pyth](https://img.shields.io/badge/Powered%20by-Pyth-6C5CE7)](https://pyth.network/)

*Borrow and lend across blockchains with competitive rates and automated security*

[Documentation](#) • [Discord](#) • [Twitter](#) • [Website](https://zetaconfluence.speedballmag.com/)

</div>

---

## 🌐 What is ZetaConfluence?

ZetaConfluence is a decentralized lending platform that solves a key problem in DeFi: accessing liquidity across different blockchain networks. Unlike traditional lending protocols that limit you to assets on a single chain, ZetaConfluence lets you use Bitcoin as collateral to borrow Ethereum, or lock up Solana tokens to receive USDC on Polygon—all through a single, unified protocol.

The platform uses a competitive bidding mechanism where lenders propose their own interest rates, creating a dynamic marketplace that benefits both borrowers seeking the best rates and lenders looking for attractive returns.

<div align="center">

```mermaid
graph LR
    A[🪙 Bitcoin] -->|Collateral| B[ZetaConfluence]
    C[💎 Ethereum] -->|Collateral| B
    D[⚡ Solana] -->|Collateral| B
    B -->|Borrow| E[💵 USDC]
    B -->|Borrow| F[💎 ETH]
    B -->|Borrow| G[🪙 BTC]
    style B fill:#7C3AED,stroke:#5B21B6,stroke-width:3px,color:#fff
```

</div>

## 🔄 How It Works

<table>
<tr>
<td width="50%">

### 👤 For Borrowers

1. **📝 Create a Loan Request**  
   Specify collateral asset, desired asset, and loan duration

2. **👀 Review Bids**  
   Lenders compete with different interest rates and amounts

3. **✅ Accept Bids**  
   Choose one or multiple bids that meet your needs

4. **💰 Receive Funds**  
   Get borrowed assets instantly, collateral held securely

5. **🔄 Repay**  
   Return principal + interest to reclaim collateral

</td>
<td width="50%">

### 💼 For Lenders

1. **🔍 Browse Loan Requests**  
   See opportunities across different assets and chains

2. **📊 Submit Bids**  
   Propose your interest rate and lending amount

3. **📈 Earn Interest**  
   Receive returns when borrowers repay

4. **🛡️ Protected Capital**  
   Automated liquidation protects against collateral drops

</td>
</tr>
</table>

## ✨ Key Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🌉 **Cross-Chain Flexibility** | Use assets from Bitcoin, Ethereum, Solana, Polygon, and more as collateral or principal |
| 💹 **Competitive Bidding** | Market-driven interest rates through lender competition |
| 🤖 **Automated Risk Management** | Continuous monitoring and auto-liquidation of under-collateralized loans |
| 🤝 **Multi-Lender Support** | Aggregate funding from multiple lenders for flexible loan structuring |
| 🔒 **Transparent & Secure** | On-chain records with smart contract automation—no intermediaries |

</div>

## 💡 Use Cases

<div align="center">

```mermaid
mindmap
  root((ZetaConfluence))
    Cross-Chain Liquidity
      Hold BTC, Borrow USDC
      Access DeFi opportunities
      No selling required
    Yield Generation
      Deploy idle capital
      Earn competitive interest
      Multi-chain diversification
    Leverage Trading
      Maintain asset exposure
      Access liquidity
      Trading opportunities
    Arbitrage
      Cross-chain capital access
      Market opportunities
      No complex bridging
```

</div>

### 🔗 Cross-Chain Liquidity Access
Hold Bitcoin but need USDC for a DeFi opportunity on Ethereum? Use your BTC as collateral to borrow USDC without selling your Bitcoin position.

### 📊 Yield Generation
Lenders can deploy idle capital across multiple chains and asset types, earning interest by funding loan requests that match their risk appetite.

### 💎 Leverage Without Selling
Maintain exposure to your favorite assets while accessing liquidity for other opportunities, trading, or expenses.

### ⚡ Arbitrage and Trading
Traders can access capital in specific assets on specific chains to take advantage of market opportunities without complex bridging.

## 🏗️ Project Structure

<div align="center">

```mermaid
graph TB
    subgraph "🎨 Client Layer"
        WEB[Web Frontend<br/>React + TypeScript]
        WALLET[Wallet Connectors<br/>MetaMask, Phantom, WalletConnect]
    end
    
    subgraph "⛓️ On-Chain Layer - ZetaChain"
        PROTOCOL[P2PLendingProtocol<br/>Main Entry Point]
        LOAN_MGT[LoanManagement<br/>Lifecycle Operations]
        STORAGE[Storage<br/>State Persistence]
        UTILS[LoanUtils<br/>Calculations & Validation]
        TYPES[Types<br/>Shared Definitions]
    end
    
    subgraph "🤖 Off-Chain Services"
        BOT[Liquidation Bot<br/>TypeScript]
        DB[(PostgreSQL<br/>State & History)]
    end
    
    subgraph "🌐 External Services"
        PYTH[Pyth Network<br/>Price Feeds]
        ZETA[ZetaChain<br/>Omni-Chain Bridge]
    end
    
    WEB --> WALLET
    WALLET --> PROTOCOL
    WEB --> DB
    
    BOT --> DB
    BOT --> PROTOCOL
    BOT --> PYTH
    
    PROTOCOL --> LOAN_MGT
    PROTOCOL --> STORAGE
    PROTOCOL --> UTILS
    LOAN_MGT --> STORAGE
    LOAN_MGT --> UTILS
    UTILS --> TYPES
    STORAGE --> TYPES
    
    PROTOCOL --> PYTH
    PROTOCOL --> ZETA
    LOAN_MGT --> ZETA
    
    style PROTOCOL fill:#7C3AED,stroke:#5B21B6,stroke-width:2px,color:#fff
    style LOAN_MGT fill:#7C3AED,stroke:#5B21B6,stroke-width:2px,color:#fff
    style STORAGE fill:#7C3AED,stroke:#5B21B6,stroke-width:2px,color:#fff
    style BOT fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
    style WEB fill:#3B82F6,stroke:#2563EB,stroke-width:2px,color:#fff
```

</div>

### ⛓️ On-Chain Smart Contracts
The core protocol logic deployed on ZetaChain:

- **P2PLendingProtocol**: Main entry point for user interactions
- **LoanManagement**: Handles loan lifecycle operations
- **Storage**: Centralized data storage (upgradeable architecture)
- **LoanUtils**: Utility functions for calculations and validations
- **Types**: Shared type definitions and enums

### 🤖 Off-Chain Services
Automated monitoring and execution:

- **Liquidation Bot**: Monitors loans and triggers liquidations
- **PostgreSQL Database**: Persists state, prices, and history
- **Price Feed Integration**: Queries Pyth Network for real-time prices

### 🎨 Client Applications
User-facing interfaces:

- **Web Frontend**: React-based application for all user interactions
- **Wallet Integration**: MetaMask, Phantom, WalletConnect support
- **Asset Metadata Service**: Cross-chain asset information management

## 🛠️ Technology Stack

<div align="center">

### Blockchain & Smart Contracts

[![ZetaChain](https://img.shields.io/badge/ZetaChain-Omni--Chain-7C3AED?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=)](https://www.zetachain.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Foundry-Testing-000000?style=for-the-badge)](https://getfoundry.sh/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Tooling-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)](https://hardhat.org/)

### Price Oracles

[![Pyth Network](https://img.shields.io/badge/Pyth_Network-Price_Feeds-6C5CE7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkw0IDhWMTZMMTIgMjJMMjAgMTZWOEwxMiAyWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=)](https://pyth.network/)

### Backend Services

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

### Frontend

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![ethers.js](https://img.shields.io/badge/ethers.js-6.0-2535A0?style=for-the-badge)](https://docs.ethers.org/)
[![Wagmi](https://img.shields.io/badge/Wagmi-Wallet-000000?style=for-the-badge)](https://wagmi.sh/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-Data-FF4154?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query)

### Infrastructure

[![Docker](https://img.shields.io/badge/Docker-Container-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Hosting-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

## 🏛️ Architecture Overview

<div align="center">

```mermaid
sequenceDiagram
    participant 👤 Borrower
    participant 🎨 Frontend
    participant ⛓️ Protocol
    participant 💼 Lender
    participant 🤖 Bot
    participant 📊 Pyth
    
    👤 Borrower->>🎨 Frontend: Create Loan Request
    🎨 Frontend->>⛓️ Protocol: Submit with Collateral
    ⛓️ Protocol->>⛓️ Protocol: Lock Collateral in Escrow
    ⛓️ Protocol-->>👤 Borrower: Request ID
    
    💼 Lender->>🎨 Frontend: Browse Requests
    💼 Lender->>⛓️ Protocol: Submit Bid (Amount + Rate)
    ⛓️ Protocol-->>💼 Lender: Bid ID
    
    👤 Borrower->>⛓️ Protocol: Accept Bid(s)
    ⛓️ Protocol->>💼 Lender: Transfer Principal
    ⛓️ Protocol->>👤 Borrower: Receive Principal
    ⛓️ Protocol->>⛓️ Protocol: Activate Loan
    
    loop Continuous Monitoring
        🤖 Bot->>📊 Pyth: Get Asset Prices
        📊 Pyth-->>🤖 Bot: Current Prices
        🤖 Bot->>🤖 Bot: Calculate Health Ratio
        alt Under-collateralized
            🤖 Bot->>⛓️ Protocol: Trigger Liquidation
            ⛓️ Protocol->>💼 Lender: Transfer Collateral
        end
    end
    
    👤 Borrower->>⛓️ Protocol: Repay Loan + Interest
    ⛓️ Protocol->>💼 Lender: Transfer Payment
    ⛓️ Protocol->>👤 Borrower: Return Collateral
```

</div>

## 🚀 Getting Started

### Prerequisites

<div align="center">

| Tool | Version | Purpose |
|------|---------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white) | v18+ | Runtime environment |
| ![Yarn](https://img.shields.io/badge/Yarn-1.22+-2C8EBB?style=flat-square&logo=yarn&logoColor=white) | Latest | Package manager |
| ![Foundry](https://img.shields.io/badge/Foundry-Latest-000000?style=flat-square) | Latest | Smart contract development |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white) | v15+ | Database for liquidation bot |

</div>

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zetaconfluence.git
cd zetaconfluence

# Install dependencies
yarn install

# Install frontend dependencies
cd frontend
yarn install
cd ..
```

### ⛓️ Smart Contract Development

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with coverage
forge coverage

# Deploy to testnet
yarn deploy:testnet
```

### 🎨 Running the Frontend

```bash
cd frontend
yarn dev
```

The application will be available at `http://localhost:5173` 🌐

### 🤖 Running the Liquidation Bot

```bash
# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
yarn migrate

# Start the bot
yarn start:bot
```

## 🔐 Security

<div align="center">

```mermaid
graph TD
    A[🔐 Security Layers] --> B[Smart Contract Audits]
    A --> C[Automated Liquidations]
    A --> D[Access Controls]
    A --> E[Reentrancy Protection]
    A --> F[Oracle Security]
    
    B --> B1[Thorough Testing]
    B --> B2[Professional Audits]
    
    C --> C1[24/7 Monitoring]
    C --> C2[Auto-Liquidation]
    
    D --> D1[Role-Based Permissions]
    D --> D2[Owner Restrictions]
    
    E --> E1[ReentrancyGuard]
    E --> E2[Checks-Effects-Interactions]
    
    F --> F1[Pyth Price Feeds]
    F --> F2[Staleness Checks]
    
    style A fill:#7C3AED,stroke:#5B21B6,stroke-width:3px,color:#fff
    style B fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
    style C fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
    style D fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
    style E fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
    style F fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
```

</div>

ZetaConfluence implements multiple layers of security:

- 🛡️ **Smart Contract Audits**: All contracts undergo thorough testing and auditing
- 🤖 **Automated Liquidations**: Protect lender capital from collateral value drops
- 🔒 **Access Controls**: Strict permissions ensure only authorized actions
- 🚫 **Reentrancy Protection**: Guards against common attack vectors
- 📊 **Oracle Security**: Uses Pyth Network's secure price feeds with staleness checks

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, we appreciate your help in making ZetaConfluence better.

<div align="center">

[![Contributors](https://img.shields.io/github/contributors/francis-Paul-code/zetaconfluence?style=for-the-badge)](https://github.com/francis-Paul-code/zetaconfluence/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/francis-Paul-code/zetaconfluence?style=for-the-badge)](https://github.com/francis-Paul-code/zetaconfluence/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/francis-Paul-code/zetaconfluence?style=for-the-badge)](https://github.com/francis-Paul-code/zetaconfluence/pulls)

</div>

Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links & Community

<div align="center">

[![Documentation](https://img.shields.io/badge/📚_Documentation-Coming_Soon-7C3AED?style=for-the-badge)](https://docs.zetaconfluence.io)
[![Discord](https://img.shields.io/badge/💬_Discord-Join_Us-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/zetaconfluence)
[![Twitter](https://img.shields.io/badge/🐦_Twitter-Follow-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/zetaconfluence)
[![Website](https://img.shields.io/badge/🌐_Website-Visit-7C3AED?style=for-the-badge)](https://zetaconfluence.speedballmag.com)

</div>

## 🙏 Acknowledgments

Built with support from:

<div align="center">

| Partner | Contribution |
|---------|-------------|
| ![ZetaChain](https://img.shields.io/badge/ZetaChain-7C3AED?style=flat-square) | Omni-chain infrastructure |
| ![Pyth Network](https://img.shields.io/badge/Pyth_Network-6C5CE7?style=flat-square) | Reliable price feeds |
| ![DeFi Community](https://img.shields.io/badge/DeFi_Community-10B981?style=flat-square) | Inspiration and feedback |

</div>

---

<div align="center">

### ⚠️ Disclaimer

**ZetaConfluence is experimental software. Use at your own risk.**

Always do your own research before participating in DeFi protocols.  
Never invest more than you can afford to lose.

---

Made with 💜 by [Francis Musango](https://github.com/francis-Paul-code)

[![Star on GitHub](https://img.shields.io/github/stars/francis-Paul-code/zetaconfluence?style=social)](https://github.com/francis-Paul-code/zetaconfluence)
[![Follow on Twitter](https://img.shields.io/twitter/follow/zetaconfluence?style=social)](https://twitter.com/zetaconfluence)

</div>
