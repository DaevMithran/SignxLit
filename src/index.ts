import { SignProtocolClient, SpMode, EvmChains } from "@daevm/ethsign-sp-sdk"
import { privateKeyToAccount } from "viem/accounts"
import { config } from "dotenv"
import { ethers } from "ethers"
import { LIT_RPC } from "@lit-protocol/constants"
import { createWalletClient, http } from "viem"

config()

const run = async () => {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY!)
  const etherWallet = new ethers.Wallet(
    process.env.PRIVATE_KEY!,
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
  )

  console.log("Creating signing client")
  const walletClient = createWalletClient({
    account,
    transport: http(),
  })
  const client = new SignProtocolClient(SpMode.OnChain, {
    chain: EvmChains.polygonAmoy,
    account,
    walletClient,
    wallet: etherWallet,
  })
  console.log(client)

  // Lit
  //   const litProtocol = new LitProtocol(etherWallet)
  //   console.log(litProtocol.client)

  // Create schema
  //   const schemaName = "TestBioDM1"
  //   console.log("Creating schema", schemaName)

  //   const createSchemaRes = await client.createSchema({
  //     name: schemaName,
  //     data: [{ name: "string", type: "string" }],
  //   })
  //   console.log(createSchemaRes)

  // Create attestation
  //   console.log("Creating attestation")
  //   const createAttestationRes = await client.createAttestation(
  //     {
  //       schemaId: "0x98",
  //       data: { name: "T1-NAME-1" },
  //       indexingValue: "xxx",
  //     },
  //     {
  //       gated: true,
  //     }
  //   )
  //   console.log(createAttestationRes)

  // Delegated create attestation
  //   const attestationInfo = await delegateSignAttestation(
  //     {
  //       schemaId: "0x1",
  //       data: { name: "a" },
  //       indexingValue: "xxx",
  //     },
  //     {
  //       chain: EvmChains.polygonMumbai,
  //       delegationAccount: privateKeyToAccount(delegationPrivateKey),
  //     }
  //   )

  //   const delegationCreateAttestationRes = await client.createAttestation(
  //     attestationInfo.attestation,
  //     {
  //       delegationSignature: attestationInfo.delegationSignature,
  //     }
  //   )

  // Revoke attestation
  //   const revokeAttestationRes = await client.revokeAttestation(
  //     createAttestationRes.attestationId,
  //     {
  //       reason: "test",
  //     }
  //   )

  // Delegated revoke attestation
  //   const info = await delegateSignRevokeAttestation(attestationId, {
  //     chain: EvmChains.polygonMumbai,
  //     reason: "test",
  //     delegationAccount: privateKeyToAccount(delegationPrivateKey),
  //   })
  //   const delegationRevokeAttestationRes = await client.revokeAttestation(
  //     info.attestationId,
  //     {
  //       reason: info.reason,
  //       delegationSignature: info.delegationSignature,
  //     }
  //   )
}

run()
