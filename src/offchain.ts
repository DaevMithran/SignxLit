// import {
//   SignProtocolClient,
//   SpMode,
//   //   EvmChains,
//   OffChainSignType,
// } from "@ethsign/sp-sdk"
// import { privateKeyToAccount } from "viem/accounts"
// const privateKey = "0xabc" // Optional
// const client = new SignProtocolClient(SpMode.OffChain, {
//   signType: OffChainSignType.EvmEip712,
//   account: privateKeyToAccount(privateKey), // Optional
// })

// const run = async () => {
//   // Create schema
//   const schemaInfo = await client.createSchema({
//     name: "xxx",
//     data: [{ name: "name", type: "string" }],
//   })
//   console.log(schemaInfo)

//   // Create attestation
//   const attestationInfo = await client.createAttestation({
//     schemaId: schemaInfo.schemaId, // `schemaInfo.schemaId` or other `schemaId`
//     data: { name: "a" },
//     indexingValue: "xxx",
//   })
//   console.log(attestationInfo)

//   // Revoke attestation
//   //   const attestationId = "xxx"
//   //   const revokeAttestationRes = await client.revokeAttestation(attestationId, {
//   //     reason: "test",
//   //   })
// }

// run()
