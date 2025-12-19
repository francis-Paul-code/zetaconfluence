#!/bin/bash
set -exo pipefail

SEED_SCRIPT="scripts/SeedProtocol.Testnet.s.sol:SeedP2PLendingProtocol"
ADMIN_ADDRESS="0x<YOUR_ADMIN_ADDRESS>"
RPC_URL="https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
CHAIN_ID=7001
CONTRACT_ADDRESS="0xbdfdc2b8f4808047a5ceeb56870a2a555ce7cecf"
PRIVATE_KEY="0x<YOUR_PRIVATE_KEY>"

export RPC_URL
export CHAIN_ID
export PRIVATE_KEY
export ADMIN_ADDRESS
export CONTRACT_ADDRESS

forge script $SEED_SCRIPT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --chain-id $CHAIN_ID \
    -vvvv
