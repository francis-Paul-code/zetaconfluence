#!/bin/bash

set -exo pipefail

yarn zetachain localnet start --force-kill --exit-on-error --no-analytics &

while [ ! -f "$HOME/.zetachain/localnet/registry.json" ]; do sleep 1; done


GATEWAY_ETHEREUM=$(jq -r '.["11155112"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ETHEREUM
ZEVM_GATEWAY_CONTRACT=$(jq -r '.["31337"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $ZEVM_GATEWAY_CONTRACT
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json) && echo $PRIVATE_KEY
UNISWAP_ROUTER=$(jq -r '.["31337"].contracts[] | select(.contractType == "uniswapV3Router") | .address' ~/.zetachain/localnet/registry.json) && echo $UNISWAP_ROUTER
SYSTEM_CONTRACT=$(jq -r '.["31337"].contracts[] | select(.contractType == "systemContract") | .address' ~/.zetachain/localnet/registry.json) && echo $SYSTEM_CONTRACT
PYTH_CONTRACT="0x0708325268dF9F66270F1401206434524814508b" && echo $PYTH_CONTRACT
RPC_URL="http://localhost:8545" && echo $RPC_URL