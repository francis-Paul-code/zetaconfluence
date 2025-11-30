#!/bin/bash

set -exo pipefail


# --- CONFIG ---
DEPLOY_SCRIPT="scripts/DeployLoanEngine.s.sol:DeployP2PLendingProtocol"
SETUP_SCRIPT="scripts/DeployLoanEngine.s.sol:SetupP2PLendingProtocol"
VERIFY_SCRIPT="scripts/DeployLoanEngine.s.sol:VerifyDeployment"


echo "🔍 Checking ZetaChain localnet registry..."

while [ ! -f "$HOME/.zetachain/localnet/registry.json" ]; do sleep 1; done

echo "✅ Registry found"
echo ""

CHAIN_ID="31337"  # ZetaChain localnet chain ID
GATEWAY_ETHEREUM=$(jq -r '.["11155112"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) 
ZEVM_GATEWAY_CONTRACT=$(jq -r '.["31337"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json)
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json) 
ADMIN_ADDRESS=$(jq -r '.available_accounts[0]' ~/.zetachain/localnet/anvil.json) 
UNISWAP_ROUTER=$(jq -r '.["31337"].contracts[] | select(.contractType == "uniswapV3Router") | .address' ~/.zetachain/localnet/registry.json)
SYSTEM_CONTRACT=$(jq -r '.["31337"].contracts[] | select(.contractType == "systemContract") | .address' ~/.zetachain/localnet/registry.json)
CORE_REGISTRY=$(jq -r '.["31337"].contracts[] | select(.contractType == "coreRegistry") | .address' ~/.zetachain/localnet/registry.json)
PYTH_CONTRACT="0x0708325268dF9F66270F1401206434524814508b" 
RPC_URL="http://localhost:8545" 

echo "CHAIN_ID: $CHAIN_ID"
echo "ADMIN_ADDRESS: $ADMIN_ADDRESS"
echo "SYSTEM_CONTRACT: $SYSTEM_CONTRACT"
echo "ZEVM_GATEWAY_CONTRACT: $ZEVM_GATEWAY_CONTRACT"
echo "UNISWAP_ROUTER: $UNISWAP_ROUTER"
echo "PYTH_CONTRACT: $PYTH_CONTRACT"
echo "CORE_REGISTRY: $CORE_REGISTRY"
echo ""

# Check if any address is empty
if [ -z "$ZEVM_GATEWAY_CONTRACT" ] || [ -z "$SYSTEM_CONTRACT" ] || [ -z "$UNISWAP_ROUTER" ] || [ -z "$CORE_REGISTRY" ]; then
    echo "❌ One or more contract addresses are empty!"
    echo "This usually means the localnet hasn't fully initialized."
    exit 1
fi

echo "✅ All addresses found"
echo ""

export CHAIN_ID
export ADMIN_ADDRESS
export UNISWAP_ROUTER
export SYSTEM_CONTRACT
export PYTH_CONTRACT
export ZEVM_GATEWAY_CONTRACT
export GATEWAY_ETHEREUM
export CORE_REGISTRY
export PRIVATE_KEY


# --- BUILD ---
echo "📦 Building contracts..."
forge soldeer update
forge clean
forge build --via-ir --sizes 2>&1 | tail -50 


# --- DEPLOY ---
echo "🚀 Deploying contracts..."


forge script $DEPLOY_SCRIPT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --evm-version cancun \
    --chain-id $CHAIN_ID \
    --broadcast \
    --skip-simulation \
    -vvvv



DEPLOY_JSON="broadcast/DeployLoanEngine.s.sol/$CHAIN_ID/run-latest.json"

if [ -f "$DEPLOY_JSON" ]; then
    CONTRACT_ADDRESS=$(jq -r '.transactions[] | select(.transactionType == "CREATE") | .contractAddress' $DEPLOY_JSON | tail -1)
    echo "📌 Exporting CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
    export CONTRACT_ADDRESS
    echo "Contract Address: $CONTRACT_ADDRESS"
else
    echo "❌ Deployment JSON not found at $DEPLOY_JSON"
    exit 1
fi

# # --- VERIFY ---
# echo "🔍 Verifying deployment..."
# forge script $VERIFY_SCRIPT \
#     --rpc-url $RPC_URL \
#     --private-key $PRIVATE_KEY \
#     --broadcast \
#     --chain-id $CHAIN_ID


# yarn zetachain evm call \
#   --gateway "$GATEWAY_ETHEREUM" \
#   --receiver "$UNIVERSAL" \
#   --rpc http://localhost:8545 \
#   --types string \
#   --values alice \
#   --yes \
#   --no-analytics \
#   --private-key "$PRIVATE_KEY"

# yarn zetachain localnet check --no-analytics

# yarn zetachain localnet stop --no-analytics