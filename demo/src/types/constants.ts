export const accessControlConditions: {
  name: string
  condition: any
}[] = [
  {
    name: "Proof of Humanity",
    condition: {
      conditionType: "evmBasic",
      contractAddress: "0xC5E9dDebb09Cd64DfaCab4011A0D5cEDaf7c9BDb",
      standardContractType: "ProofOfHumanity",
      chain: "ethereum",
      method: "isRegistered",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: "=",
        value: "true",
      },
    },
  },
  {
    name: "Burning Man 2021 POAP",
    condition: {
      conditionType: "evmBasic",
      contractAddress: "0x22C1f6050E56d2876009903609a2cC3fEf83B415",
      standardContractType: "POAP",
      chain: "xdai",
      method: "tokenURI",
      parameters: [],
      returnValueTest: {
        comparator: "contains",
        value: "Burning Man 2021",
      },
    },
  },
  {
    name: "Token Holder",
    condition: {
      contractAddress: "",
      standardContractType: "",
      conditionType: "evmBasic",
      chain: "amoy",
      method: "eth_getBalance",
      parameters: [":userAddress"],
      returnValueTest: {
        comparator: ">=",
        value: "0",
      },
    },
  },
]
