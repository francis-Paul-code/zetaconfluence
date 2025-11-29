// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/P2PLendingProtocol.sol";

contract DeployP2PLendingProtocol is Script {
    function run() external {
        // Get admin address from environment or use deployer
        address admin = vm.envOr("ADMIN_ADDRESS", msg.sender);
        address systemContract = vm.envOr("SYSTEM_CONTRACT", address(0));
        address gatewayContract = vm.envOr("ZEVM_GATEWAY_CONTRACT", address(0));
        address uniswapRouter = vm.envOr("UNISWAP_ROUTER", address(0));
        address pythContract = vm.envOr("PYTH_CONTRACT", address(0));

        console.log("Deploying P2PLendingProtocol..");
        console.log("Admin address:", admin);
        console.log("System contract address:", systemContract);
        console.log("Gateway contract address:", gatewayContract);
        console.log("Uniswap Router address:", uniswapRouter);
        console.log("pyth contract address:", pythContract);
        console.log("Deployer address:", msg.sender);
        console.log("Chain ID:", block.chainid);

        // Validate required addresses
        require(admin != address(0), "Admin address cannot be zero");
        require(systemContract != address(0), "System contract address cannot be zero");
        require(gatewayContract != address(0), "Gateway contract address cannot be zero");
        require(uniswapRouter != address(0), "Uniswap router address cannot be zero");
        require(pythContract != address(0), "Pyth contract address cannot be zero");

        vm.startBroadcast();

        // Deploy the contract
        P2PLendingProtocol loan_engine = new P2PLendingProtocol(
            admin,
            systemContract,
            payable(gatewayContract),
            uniswapRouter,
            pythContract
        );

        vm.stopBroadcast();

        console.log("P2PLendingProtocol deployed at:", address(loan_engine));

        // Log deployment info for frontend integration
        console.log("\n=== DEPLOYMENT INFO ===");
        console.log("Contract Address:", address(loan_engine));
        console.log("Admin Address:", admin);
        console.log("Network:", block.chainid);
        console.log("Block Number:", block.number);
        console.log("========================\n");

        // Verify contract is working
        console.log("Verifying deployment...");

        // Check initial state
        console.log("Loan Requests Counter:", loan_engine.loanRequestCounter());
        console.log("Bid Counter:", loan_engine.bidCounter());
        console.log("Loan Counter:", loan_engine.loanCounter());

        console.log("Owner:", loan_engine.owner());

        // Test basic functionality
        console.log("Testing basic functionality...");

        vm.startPrank(admin);

        // Try to pause/unpause (admin function)
        loan_engine.emergencyPause("Testing pausability ");
        console.log("Paused successfully");

        loan_engine.unpause();
        console.log("Unpaused successfully");

        vm.stopPrank();

        console.log("Deployment verification complete!");

        // // Save deployment info to file (if running locally)
        string memory deploymentInfo = string(
            abi.encodePacked(
                "{\n",
                '  "contractAddress": "',
                vm.toString(address(loan_engine)),
                '",\n',
                '  "adminAddress": "',
                vm.toString(admin),
                '",\n',
                '  "deployer": "',
                vm.toString(msg.sender),
                '",\n',
                '  "chainId": ',
                vm.toString(block.chainid),
                ",\n",
                '  "blockNumber": ',
                vm.toString(block.number),
                ",\n",
                '  "deployedAt": "',
                vm.toString(block.timestamp),
                '"\n',
                "}"
            )
        );

        string memory path = string.concat("out/deployment_info_", vm.toString(block.chainid), ".json");
        vm.writeFile(path, deploymentInfo);

        console.log("Deployment info saved to deployment_info.json");
    }
}

/**
 * @title Setup P2PLendingProtocol
 * Usage: forge script script/Deploy.s.sol:SetupWalkScapeCore --rpc-url <rpc_url> --private-key <private_key> --broadcast
 */
contract SetupP2PLendingProtocol is Script {
    function run() external {
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        address admin = vm.envOr("ADMIN_ADDRESS", address(0));

        console.log("Setting up P2PLendingProtocol at:", contractAddress);

        P2PLendingProtocol loan_engine = P2PLendingProtocol(contractAddress);

        vm.startBroadcast();

        address[] memory assets = new address[](0);
        bytes32[] memory feedIds = new bytes32[](0);

        loan_engine.addSupportedAssets(assets, feedIds);

        // Verify the contract is working
        console.log("Current owner:", loan_engine.owner());

        vm.stopBroadcast();

        console.log("Setup complete!");
    }
}

/**
 * @title Verify Deployment
 * Usage: forge script script/Deploy.s.sol:VerifyDeployment --rpc-url <rpc_url>
 */
contract VerifyDeployment is Script {
    function run() external {
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");

        console.log(
            "Verifying P2PLendingProtocol deployment at:",
            contractAddress
        );

        P2PLendingProtocol loan_engine = P2PLendingProtocol(contractAddress);

        // Check contract state

        console.log("========== CONTRACT STATE =================");
        // --- Counters ---
        console.log("Loan Requests Counter", loan_engine.loanRequestCounter());
        console.log("Loan Counter", loan_engine.loanCounter());
        console.log("Bid Counter", loan_engine.bidCounter());

        // --- Constants ---
        console.log("MIN_COLLATERAL_RATIO", loan_engine.MIN_COLLATERAL_RATIO());
        console.log(
            "LIQUIDATION_THRESHOLD",
            loan_engine.LIQUIDATION_THRESHOLD()
        );
        console.log("MAX_INTEREST_RATE", loan_engine.MAX_INTEREST_RATE());
        console.log("MIN_LOAN_DURATION", loan_engine.MIN_LOAN_DURATION());
        console.log("MAX_LOAN_DURATION", loan_engine.MAX_LOAN_DURATION());
        console.log(
            "MAX_LOAN_REQUEST_DURATION",
            loan_engine.MAX_LOAN_REQUEST_DURATION()
        );
        console.log("LISTING_FEE_BPS", loan_engine.LISTING_FEE_BPS());
        console.log("MAX_BATCH_SIZE", loan_engine.MAX_BATCH_SIZE());
        console.log("PRICE_CHECK_INTERVAL", loan_engine.PRICE_CHECK_INTERVAL());
        console.log("RETRY_ATTEMPTS", loan_engine.RETRY_ATTEMPTS());

        // --- Arrays ---
        // uint256 actionsLen = loan_engine.supportedActions().length;
        // console.log("Supported Actions length", actionsLen);
        // for (uint256 i; i < actionsLen; i++) {
        //     console2.log("  Action", i, loan_engine.supportedActions(i));
        // }

        // uint256 bidsLen = loan_engine._bids().length;
        // console.log("_bids length", bidsLen);
        // for (uint256 i; i < bidsLen; i++) {
        //     console.log("  bid", i, loan_engine._bids(i));
        // }

        // uint256 assetsLen = loan_engine.supportedAssetsList().length;
        // console.log("Supported Assets length", assetsLen);
        // for (uint256 i; i < assetsLen; i++) {
        //     address asset = loan_engine.supportedAssetsList(i);
        //     console.log("  asset", i, asset);
        //     console.log("    supported?", loan_engine.supportedAssets(asset));
        //     console.log("    assetPrice", loan_engine.assetPrices(asset));
        //     console.logBytes32(loan_engine.pythPriceIds(asset));
        // }

        // uint256 activeLoansLen = loan_engine.activeLoanIds().length;
        // console2.log("Active Loan IDs length", activeLoansLen);
        // for (uint256 i; i < activeLoansLen; i++) {
        //     uint256 loanId = loan_engine.activeLoanIds(i);
        //     console2.log("  activeLoanIds", i, loanId);
        //     console2.log(
        //         "    activeLoanIndex",
        //         loan_engine.activeLoanIndex(loanId)
        //     );
        // }

        console2.log("======================");

        // Test read functions (these don't require transactions)
        try loan_engine.getLoan(20) {
            console.log("ERROR: Should have reverted for unregistered loan");
        } catch {
            console.log("Correctly reverts for unregistered loan");
        }

        console.log("Contract verification complete - all systems operational");
    }
}
