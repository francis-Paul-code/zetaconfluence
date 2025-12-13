module.exports = {
  settings: {
    optimizer: {
      enabled: false,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "": ["ast"],
        "*": [
          "abi",
          "metadata",
          "devdoc",
          "userdoc",
          "storageLayout",
          "evm.legacyAssembly",
          "evm.bytecode",
          "evm.deployedBytecode",
          "evm.methodIdentifiers",
          "evm.gasEstimates",
          "evm.assembly",
        ],
      },
    },
    viaIR: true,
  },
  solidity: "0.8.26",
};
