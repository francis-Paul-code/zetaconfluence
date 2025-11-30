#!/bin/bash
set -exo pipefail

# --- CONFIG ---
DEPLOY_SCRIPT="scripts/DeployLoanEngine.s.sol:DeployP2PLendingProtocol"
SETUP_SCRIPT="scripts/DeployLoanEngine.s.sol:SetupP2PLendingProtocol"
VERIFY_SCRIPT="scripts/DeployLoanEngine.s.sol:VerifyDeployment"

# Load private key from .env
if [ -f .env ]; then
  echo "📑 Loading environment variables from .env..."
  export $(grep -v '^#' .env | sed 's/#.*$//' | xargs)
fi

REQUIRED_VARS=("PRIVATE_KEY" "SYSTEM_CONTRACT" "ZEVM_GATEWAY_CONTRACT" "UNISWAP_ROUTER" "PYTH_CONTRACT")
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Missing required env var: $VAR"
    exit 1
  fi
done


# --- BUILD ---
echo "📦 Building contracts..."
forge soldeer update
forge clean
forge build --via-ir --sizes


# --- DEPLOY ---
echo "🚀 Deploying LoanEngine..."
forge script $DEPLOY_SCRIPT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --chain-id $CHAIN_ID \
    --via-ir \
    -vvvv


DEPLOY_JSON="broadcast/DeployLoanEngine.s.sol/$CHAIN_ID/run-latest.json"
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

# --- SETUP ---
echo "⚙️ Running setup..."
forge script $SETUP_SCRIPT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --chain-id $CHAIN_ID

# --- VERIFY ---
echo "🔍 Verifying deployment..."
forge script $VERIFY_SCRIPT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --chain-id $CHAIN_ID

echo "✅ All steps completed!"
