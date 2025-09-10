export const iPriceOracleEmergencyConfigureActionsAbi = [
  {
    type: "function",
    name: "setPriceFeed",
    inputs: [
      {
        name: "token",
        type: "address",
        internalType: "address",
      },
      {
        name: "priceFeed",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
