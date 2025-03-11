export const ReverseRegistrarOld1 = [
  {
    constant: false,
    inputs: [
      { name: "owner", type: "address" },
      { name: "resolver", type: "address" }
    ],
    name: "claimWithResolver",
    outputs: [{ name: "node", type: "bytes32" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "owner", type: "address" }],
    name: "claim",
    outputs: [{ name: "node", type: "bytes32" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "ens",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "defaultResolver",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "addr", type: "address" }],
    name: "node",
    outputs: [{ name: "ret", type: "bytes32" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "name", type: "string" }],
    name: "setName",
    outputs: [{ name: "node", type: "bytes32" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "ensAddr", type: "address" },
      { name: "resolverAddr", type: "address" }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  }
] as const;
