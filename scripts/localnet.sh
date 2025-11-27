#!/bin/bash

set -exo pipefail


# --- CONFIG ---
DEPLOY_SCRIPT="scripts/DeployLoanEngine.s.sol:DeployP2PLendingProtocol"
SETUP_SCRIPT="scripts/DeployLoanEngine.s.sol:SetupP2PLendingProtocol"
VERIFY_SCRIPT="scripts/DeployLoanEngine.s.sol:VerifyDeployment"

yarn zetachain localnet start --force-kill --exit-on-error --no-analytics &

# --- BUILD ---
echo "📦 Building contracts..."
forge soldeer update
forge clean
forge build --via-ir --sizes


# --- DEPLOY ---
echo "🚀 Deploying contracts..."


UNIVERSAL=$(forge script $DEPLOY_SCRIPT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
  --evm-version paris \
  --broadcast ) && echo $UNIVERSAL

CONTRACT_ADDRESS=$(jq -r '.transactions[-1].contractAddress' $DEPLOY_JSON)

echo "📌 Exporting CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
export CONTRACT_ADDRESS

echo "Contract Address", CONTRACT_ADDRESS
# --- VERIFY ---
echo "🔍 Verifying deployment..."
forge script $VERIFY_SCRIPT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --chain-id $CHAIN_ID


yarn zetachain evm call \
  --gateway "$GATEWAY_ETHEREUM" \
  --receiver "$UNIVERSAL" \
  --rpc http://localhost:8545 \
  --types string \
  --values alice \
  --yes \
  --no-analytics \
  --private-key "$PRIVATE_KEY"

yarn zetachain localnet check --no-analytics

yarn zetachain localnet stop --no-analytics