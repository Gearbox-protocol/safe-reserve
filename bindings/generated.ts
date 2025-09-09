//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Safe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const safeAbi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  { type: "fallback", stateMutability: "nonpayable" },
  { type: "receive", stateMutability: "payable" },
  {
    type: "function",
    inputs: [],
    name: "VERSION",
    outputs: [{ name: "", internalType: "string", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "_threshold", internalType: "uint256", type: "uint256" },
    ],
    name: "addOwnerWithThreshold",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "hashToApprove", internalType: "bytes32", type: "bytes32" },
    ],
    name: "approveHash",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "", internalType: "address", type: "address" },
      { name: "", internalType: "bytes32", type: "bytes32" },
    ],
    name: "approvedHashes",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "_threshold", internalType: "uint256", type: "uint256" }],
    name: "changeThreshold",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "dataHash", internalType: "bytes32", type: "bytes32" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "signatures", internalType: "bytes", type: "bytes" },
      { name: "requiredSignatures", internalType: "uint256", type: "uint256" },
    ],
    name: "checkNSignatures",
    outputs: [],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "dataHash", internalType: "bytes32", type: "bytes32" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "signatures", internalType: "bytes", type: "bytes" },
    ],
    name: "checkSignatures",
    outputs: [],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "prevModule", internalType: "address", type: "address" },
      { name: "module", internalType: "address", type: "address" },
    ],
    name: "disableModule",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "domainSeparator",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "module", internalType: "address", type: "address" }],
    name: "enableModule",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "operation", internalType: "enum Enum.Operation", type: "uint8" },
      { name: "safeTxGas", internalType: "uint256", type: "uint256" },
      { name: "baseGas", internalType: "uint256", type: "uint256" },
      { name: "gasPrice", internalType: "uint256", type: "uint256" },
      { name: "gasToken", internalType: "address", type: "address" },
      { name: "refundReceiver", internalType: "address", type: "address" },
      { name: "_nonce", internalType: "uint256", type: "uint256" },
    ],
    name: "encodeTransactionData",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "operation", internalType: "enum Enum.Operation", type: "uint8" },
      { name: "safeTxGas", internalType: "uint256", type: "uint256" },
      { name: "baseGas", internalType: "uint256", type: "uint256" },
      { name: "gasPrice", internalType: "uint256", type: "uint256" },
      { name: "gasToken", internalType: "address", type: "address" },
      {
        name: "refundReceiver",
        internalType: "address payable",
        type: "address",
      },
      { name: "signatures", internalType: "bytes", type: "bytes" },
    ],
    name: "execTransaction",
    outputs: [{ name: "success", internalType: "bool", type: "bool" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "operation", internalType: "enum Enum.Operation", type: "uint8" },
    ],
    name: "execTransactionFromModule",
    outputs: [{ name: "success", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "operation", internalType: "enum Enum.Operation", type: "uint8" },
    ],
    name: "execTransactionFromModuleReturnData",
    outputs: [
      { name: "success", internalType: "bool", type: "bool" },
      { name: "returnData", internalType: "bytes", type: "bytes" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "getChainId",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "start", internalType: "address", type: "address" },
      { name: "pageSize", internalType: "uint256", type: "uint256" },
    ],
    name: "getModulesPaginated",
    outputs: [
      { name: "array", internalType: "address[]", type: "address[]" },
      { name: "next", internalType: "address", type: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getOwners",
    outputs: [{ name: "", internalType: "address[]", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "offset", internalType: "uint256", type: "uint256" },
      { name: "length", internalType: "uint256", type: "uint256" },
    ],
    name: "getStorageAt",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "getThreshold",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "operation", internalType: "enum Enum.Operation", type: "uint8" },
      { name: "safeTxGas", internalType: "uint256", type: "uint256" },
      { name: "baseGas", internalType: "uint256", type: "uint256" },
      { name: "gasPrice", internalType: "uint256", type: "uint256" },
      { name: "gasToken", internalType: "address", type: "address" },
      { name: "refundReceiver", internalType: "address", type: "address" },
      { name: "_nonce", internalType: "uint256", type: "uint256" },
    ],
    name: "getTransactionHash",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "module", internalType: "address", type: "address" }],
    name: "isModuleEnabled",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "owner", internalType: "address", type: "address" }],
    name: "isOwner",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "nonce",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "prevOwner", internalType: "address", type: "address" },
      { name: "owner", internalType: "address", type: "address" },
      { name: "_threshold", internalType: "uint256", type: "uint256" },
    ],
    name: "removeOwner",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "handler", internalType: "address", type: "address" }],
    name: "setFallbackHandler",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "guard", internalType: "address", type: "address" }],
    name: "setGuard",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "_owners", internalType: "address[]", type: "address[]" },
      { name: "_threshold", internalType: "uint256", type: "uint256" },
      { name: "to", internalType: "address", type: "address" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "fallbackHandler", internalType: "address", type: "address" },
      { name: "paymentToken", internalType: "address", type: "address" },
      { name: "payment", internalType: "uint256", type: "uint256" },
      {
        name: "paymentReceiver",
        internalType: "address payable",
        type: "address",
      },
    ],
    name: "setup",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "signedMessages",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "targetContract", internalType: "address", type: "address" },
      { name: "calldataPayload", internalType: "bytes", type: "bytes" },
    ],
    name: "simulateAndRevert",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "prevOwner", internalType: "address", type: "address" },
      { name: "oldOwner", internalType: "address", type: "address" },
      { name: "newOwner", internalType: "address", type: "address" },
    ],
    name: "swapOwner",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "AddedOwner",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "approvedHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "ApproveHash",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "handler",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "ChangedFallbackHandler",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "guard",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "ChangedGuard",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "threshold",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "ChangedThreshold",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "module",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "DisabledModule",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "module",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "EnabledModule",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "txHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "payment",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "ExecutionFailure",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "module",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "ExecutionFromModuleFailure",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "module",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "ExecutionFromModuleSuccess",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "txHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "payment",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "ExecutionSuccess",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "RemovedOwner",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "sender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "value",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "SafeReceived",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "initiator",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "owners",
        internalType: "address[]",
        type: "address[]",
        indexed: false,
      },
      {
        name: "threshold",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "initializer",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      {
        name: "fallbackHandler",
        internalType: "address",
        type: "address",
        indexed: false,
      },
    ],
    name: "SafeSetup",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "msgHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
    ],
    name: "SignMsg",
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SafeStorage
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const safeStorageAbi = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    inputs: [{ name: "guard", internalType: "address", type: "address" }],
    name: "addCustomGuard",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "customGuards",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "defaultGuards",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "safe", internalType: "address payable", type: "address" },
      { name: "hash", internalType: "bytes32", type: "bytes32" },
    ],
    name: "executeTx",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "safe", internalType: "address", type: "address" }],
    name: "getGuards",
    outputs: [{ name: "", internalType: "address[]", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "safe", internalType: "address payable", type: "address" },
    ],
    name: "getQueuedTxs",
    outputs: [
      {
        name: "result",
        internalType: "struct SafeTxExtended[]",
        type: "tuple[]",
        components: [
          { name: "hash", internalType: "bytes32", type: "bytes32" },
          { name: "signedBy", internalType: "address[]", type: "address[]" },
          { name: "to", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "data", internalType: "bytes", type: "bytes" },
          {
            name: "operation",
            internalType: "enum Enum.Operation",
            type: "uint8",
          },
          { name: "safeTxGas", internalType: "uint256", type: "uint256" },
          { name: "baseGas", internalType: "uint256", type: "uint256" },
          { name: "gasPrice", internalType: "uint256", type: "uint256" },
          { name: "gasToken", internalType: "address", type: "address" },
          { name: "refundReceiver", internalType: "address", type: "address" },
          { name: "nonce", internalType: "uint256", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "safe", internalType: "address payable", type: "address" },
      { name: "hash", internalType: "bytes32", type: "bytes32" },
    ],
    name: "getSignedBy",
    outputs: [{ name: "result", internalType: "address[]", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "address", type: "address" }],
    name: "maxNonces",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "safe", internalType: "address payable", type: "address" },
      {
        name: "safeTx",
        internalType: "struct SignedTx",
        type: "tuple",
        components: [
          { name: "to", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "data", internalType: "bytes", type: "bytes" },
          {
            name: "operation",
            internalType: "enum Enum.Operation",
            type: "uint8",
          },
          { name: "safeTxGas", internalType: "uint256", type: "uint256" },
          { name: "baseGas", internalType: "uint256", type: "uint256" },
          { name: "gasPrice", internalType: "uint256", type: "uint256" },
          { name: "gasToken", internalType: "address", type: "address" },
          { name: "refundReceiver", internalType: "address", type: "address" },
          { name: "nonce", internalType: "uint256", type: "uint256" },
        ],
      },
    ],
    name: "registerTx",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "guard", internalType: "address", type: "address" }],
    name: "removeCustomGuard",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "txs",
    outputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "operation", internalType: "enum Enum.Operation", type: "uint8" },
      { name: "safeTxGas", internalType: "uint256", type: "uint256" },
      { name: "baseGas", internalType: "uint256", type: "uint256" },
      { name: "gasPrice", internalType: "uint256", type: "uint256" },
      { name: "gasToken", internalType: "address", type: "address" },
      { name: "refundReceiver", internalType: "address", type: "address" },
      { name: "nonce", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "safe", internalType: "address", type: "address", indexed: true },
      {
        name: "guard",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "GuardAdded",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "safe", internalType: "address", type: "address", indexed: true },
      {
        name: "guard",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "GuardRemoved",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "safe", internalType: "address", type: "address", indexed: true },
      {
        name: "txHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
    ],
    name: "TransactionExecuted",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "safe", internalType: "address", type: "address", indexed: true },
      {
        name: "txHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "nonce",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "TransactionRegistered",
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Governor
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const governorAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_timeLock", internalType: "address", type: "address" },
      { name: "_queueAdmin", internalType: "address", type: "address" },
      { name: "_vetoAdmin", internalType: "address", type: "address" },
      {
        name: "_allowExecutionByContracts",
        internalType: "bool",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "admin", internalType: "address", type: "address" }],
    name: "addQueueAdmin",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "allowExecutionByContracts",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    name: "batchInfo",
    outputs: [
      { name: "initiator", internalType: "address", type: "address" },
      { name: "length", internalType: "uint16", type: "uint16" },
      { name: "eta", internalType: "uint80", type: "uint80" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "batchedTxInfo",
    outputs: [
      { name: "batchBlock", internalType: "uint64", type: "uint64" },
      { name: "index", internalType: "uint16", type: "uint16" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "txs",
        internalType: "struct IGovernor.TxParams[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "signature", internalType: "string", type: "string" },
          { name: "data", internalType: "bytes", type: "bytes" },
          { name: "eta", internalType: "uint256", type: "uint256" },
        ],
      },
    ],
    name: "cancelBatch",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "target", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "signature", internalType: "string", type: "string" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "eta", internalType: "uint256", type: "uint256" },
    ],
    name: "cancelTransaction",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "claimTimeLockOwnership",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "txs",
        internalType: "struct IGovernor.TxParams[]",
        type: "tuple[]",
        components: [
          { name: "target", internalType: "address", type: "address" },
          { name: "value", internalType: "uint256", type: "uint256" },
          { name: "signature", internalType: "string", type: "string" },
          { name: "data", internalType: "bytes", type: "bytes" },
          { name: "eta", internalType: "uint256", type: "uint256" },
        ],
      },
    ],
    name: "executeBatch",
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [
      { name: "target", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "signature", internalType: "string", type: "string" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "eta", internalType: "uint256", type: "uint256" },
    ],
    name: "executeTransaction",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [],
    name: "forbidExecutionByContracts",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "isExecutionByContractsAllowed",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "queueAdmins",
    outputs: [{ name: "", internalType: "address[]", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "target", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "signature", internalType: "string", type: "string" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "eta", internalType: "uint256", type: "uint256" },
    ],
    name: "queueTransaction",
    outputs: [{ name: "txHash", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "admin", internalType: "address", type: "address" }],
    name: "removeQueueAdmin",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "eta", internalType: "uint80", type: "uint80" }],
    name: "startBatch",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "timeLock",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "admin", internalType: "address", type: "address" }],
    name: "updateVetoAdmin",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "vetoAdmin",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "admin",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "AddQueueAdmin",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [],
    name: "AllowExecutionByContracts",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "caller",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "batchBlock",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "CancelBatch",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "caller",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "batchBlock",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "ExecuteBatch",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [],
    name: "ForbidExecutionByContracts",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "caller",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "batchBlock",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "QueueBatch",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "admin",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "RemoveQueueAdmin",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "admin",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "UpdateVetoAdmin",
  },
  { type: "error", inputs: [], name: "AdminCantBeZeroAddressException" },
  { type: "error", inputs: [], name: "BatchAlreadyStartedException" },
  { type: "error", inputs: [], name: "CallerMustNotBeContractException" },
  { type: "error", inputs: [], name: "CallerNotBatchInitiatorException" },
  { type: "error", inputs: [], name: "CallerNotQueueAdminException" },
  { type: "error", inputs: [], name: "CallerNotTimelockException" },
  { type: "error", inputs: [], name: "CallerNotVetoAdminException" },
  { type: "error", inputs: [], name: "CantPerformActionOutsideBatchException" },
  { type: "error", inputs: [], name: "CantRemoveLastQueueAdminException" },
  { type: "error", inputs: [], name: "ETAMistmatchException" },
  { type: "error", inputs: [], name: "IncorrectBatchException" },
  { type: "error", inputs: [], name: "TransactionAlreadyQueuedException" },
  {
    type: "error",
    inputs: [{ name: "txHash", internalType: "bytes32", type: "bytes32" }],
    name: "UnexpectedTransactionException",
  },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Timelock
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const timelockAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "admin_", internalType: "address", type: "address" },
      { name: "delay_", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "fallback", stateMutability: "payable" },
  {
    type: "function",
    inputs: [],
    name: "GRACE_PERIOD",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "MAXIMUM_DELAY",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "MINIMUM_DELAY",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "acceptAdmin",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "admin",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "target", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "signature", internalType: "string", type: "string" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "eta", internalType: "uint256", type: "uint256" },
    ],
    name: "cancelTransaction",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "delay",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "target", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "signature", internalType: "string", type: "string" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "eta", internalType: "uint256", type: "uint256" },
    ],
    name: "executeTransaction",
    outputs: [{ name: "", internalType: "bytes", type: "bytes" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [],
    name: "pendingAdmin",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "target", internalType: "address", type: "address" },
      { name: "value", internalType: "uint256", type: "uint256" },
      { name: "signature", internalType: "string", type: "string" },
      { name: "data", internalType: "bytes", type: "bytes" },
      { name: "eta", internalType: "uint256", type: "uint256" },
    ],
    name: "queueTransaction",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    name: "queuedTransactions",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "delay_", internalType: "uint256", type: "uint256" }],
    name: "setDelay",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "pendingAdmin_", internalType: "address", type: "address" },
    ],
    name: "setPendingAdmin",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "txHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "target",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "value",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "signature",
        internalType: "string",
        type: "string",
        indexed: false,
      },
      { name: "data", internalType: "bytes", type: "bytes", indexed: false },
      { name: "eta", internalType: "uint256", type: "uint256", indexed: false },
    ],
    name: "CancelTransaction",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "txHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "target",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "value",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "signature",
        internalType: "string",
        type: "string",
        indexed: false,
      },
      { name: "data", internalType: "bytes", type: "bytes", indexed: false },
      { name: "eta", internalType: "uint256", type: "uint256", indexed: false },
    ],
    name: "ExecuteTransaction",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "newAdmin",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "NewAdmin",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "newDelay",
        internalType: "uint256",
        type: "uint256",
        indexed: true,
      },
    ],
    name: "NewDelay",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "newPendingAdmin",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "NewPendingAdmin",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "txHash",
        internalType: "bytes32",
        type: "bytes32",
        indexed: true,
      },
      {
        name: "target",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "value",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "signature",
        internalType: "string",
        type: "string",
        indexed: false,
      },
      { name: "data", internalType: "bytes", type: "bytes", indexed: false },
      { name: "eta", internalType: "uint256", type: "uint256", indexed: false },
    ],
    name: "QueueTransaction",
  },
] as const;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SimulateTxAccessor
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const simulateTxAccessorAbi = [
  {
     "inputs":[],
     "stateMutability":"nonpayable",
     "type":"constructor"
  },
  {
     "inputs":[
        {
           "internalType":"address",
           "name":"to",
           "type":"address"
        },
        {
           "internalType":"uint256",
           "name":"value",
           "type":"uint256"
        },
        {
           "internalType":"bytes",
           "name":"data",
           "type":"bytes"
        },
        {
           "internalType":"enum Enum.Operation",
           "name":"operation",
           "type":"uint8"
        }
     ],
     "name":"simulate",
     "outputs":[
        {
           "internalType":"uint256",
           "name":"estimate",
           "type":"uint256"
        },
        {
           "internalType":"bool",
           "name":"success",
           "type":"bool"
        },
        {
           "internalType":"bytes",
           "name":"returnData",
           "type":"bytes"
        }
     ],
     "stateMutability":"nonpayable",
     "type":"function"
  }
] as const;