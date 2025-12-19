// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/P2PLendingProtocol.sol";

contract SeedP2PLendingProtocol is Script {
    function run() external {
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        address admin = vm.envOr("ADMIN_ADDRESS", address(0));

        console.log("Seeding P2PLendingProtocol at:", contractAddress);

        P2PLendingProtocol loan_engine = P2PLendingProtocol(contractAddress);

        vm.startBroadcast();

        address[] memory assets = new address[](5);
        assets[0] = 0x05BA149A7bd6dC1F937fA9046A9e05C05f3b18b0; // eth - sepolia
        assets[1] = 0xD45F47412073b75B7c70728aD9A45Dee0ee01bac; // usdt - sepolia
        assets[2] = 0xcC683A782f4B30c138787CB5576a86AF66fdc31d; // usdc - sepolia
        assets[3] = 0xdbfF6471a79E5374d771922F2194eccc42210B9F; // tBTC - signet Bitcoin
        assets[4] = 0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891; // BNB - BSC testnet

        bytes32[] memory feedIds = new bytes32[](5);
        feedIds[0] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace; // usd/eth - sepolia
        feedIds[1] = 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b; // usd/usdt - sepolia
        feedIds[2] = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a; // usd/usdc - sepolia
        feedIds[3] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43; // usd/btc - signet btc
        feedIds[4] = 0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f; // usd/bnb - bsc testnet
        
        loan_engine.addSupportedAssets(assets, feedIds);

        // Verify the contract is working
        console.log("Current owner:", loan_engine.owner());

        vm.stopBroadcast();

        console.log("Seeding complete!");
    }

    function addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
