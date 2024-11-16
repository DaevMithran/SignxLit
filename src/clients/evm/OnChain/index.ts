import {
  PrivateKeyAccount,
  PublicClient,
  ReadContractReturnType,
  WalletClient,
  WriteContractReturnType,
  decodeAbiParameters,
  decodeEventLog,
  encodeAbiParameters,
  http,
  numberToHex,
  createPublicClient,
  createWalletClient,
  custom,
  isAddress,
} from "viem"
import {
  Attestation,
  AttestationResult,
  ContractInfo,
  CreateAttestationOnChainOptions,
  DataLocationOnChain,
  GetAttestationChainOptions,
  OnChainAttestation,
  OnChainClientOptions,
  OnChainSchema,
  RecipientEncodingType,
  RevokeAttestationResult,
  Schema,
  SchemaItem,
  SchemaResult,
} from "../../../types/index.js"
import {
  decodeOnChainData,
  decodeOnChainEncryptedData,
  encodeOnChainData,
  encodeOnChainEncryptedData,
  validateObject,
} from "../../../utils/index.js"
import { SignProtocolClientBase } from "../../../interface/SignProtocolClientBase.js"
import { EvmChains } from "../types.js"
import { ContractInfoMap } from "../constants.js"
import abiJson from "./abi/SignProtocal.json" assert { type: "json" }
import { getDataFromStorage } from "../../../services.js"
import { ethers } from "ethers"
import { LitProtocol } from "../../../LitprotocolClient.js"
import {
  uint8arrayFromString,
  uint8arrayToString,
} from "@lit-protocol/uint8arrays"

export class OnChainClient implements SignProtocolClientBase {
  public walletClient: WalletClient
  public publicClient!: PublicClient
  public contractInfo!: ContractInfo
  public privateKeyAccount?: PrivateKeyAccount
  public chain: any
  public account!: { address: `0x${string}` }
  public wallet: ethers.Wallet

  constructor({
    chain: chainType,
    rpcUrl: rpc,
    account: privateKeyAccount,
    walletClient,
    wallet,
  }: OnChainClientOptions) {
    this.contractInfo = chainType
      ? ContractInfoMap[chainType]
      : ContractInfoMap[EvmChains.sepolia]
    const chain = {
      ...this.contractInfo?.chain,
      rpcUrls: rpc
        ? {
            default: {
              http: [rpc],
            },
          }
        : this.contractInfo?.chain.rpcUrls,
    }
    this.chain = chain
    this.wallet = wallet
    // @ts-ignore
    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    })
    this.walletClient =
      walletClient ||
      createWalletClient({
        chain,
        transport: privateKeyAccount
          ? http()
          : window.ethereum
            ? custom(window.ethereum)
            : http(),
      })
    this.privateKeyAccount = privateKeyAccount
  }

  public async signMessage(message: string): Promise<`0x${string}`> {
    const account = await this.getAccount()
    return await this.walletClient.signMessage({
      account: this.privateKeyAccount ? account : account.address,
      message: { raw: message as any },
    })
  }
  public async swithChain() {
    const walletChainId = await this.walletClient.getChainId()
    if (walletChainId !== this.chain.id) {
      try {
        await this.walletClient.switchChain({
          id: this.chain.id,
        })
      } catch (error: any) {
        if (error?.code !== 4001) {
          await this.walletClient.addChain({
            chain: this.chain,
          })
          await this.walletClient.switchChain({
            id: this.chain.id,
          })
        }
      }
    }
  }
  public async getAccount() {
    let account
    if (this.privateKeyAccount) {
      account = this.privateKeyAccount
    } else {
      const accounts = await this.walletClient.getAddresses()
      account = { address: accounts[0] } as PrivateKeyAccount
    }
    return account
  }

  public async invokeContractRead(
    functionName: string,
    args: any[] = []
  ): Promise<ReadContractReturnType> {
    try {
      return this.publicClient.readContract({
        address: this.contractInfo.address,
        abi: abiJson.abi,
        functionName,
        args,
      })
    } catch (error: any) {
      console.error(error.message)
      throw error
    }
  }

  public async invokeContractWrite(
    functionName: string,
    args: any[] = [],
    value?: bigint,
    abi?: any
  ): Promise<WriteContractReturnType> {
    try {
      const account = await this.getAccount()
      await this.swithChain()
      const data = {
        account: this.privateKeyAccount ? account : account.address,
        address: this.contractInfo.address,
        abi: abi || abiJson.abi,
        functionName,
        args,
        value,
        chain: this.chain,
      }
      const { request } = await this.publicClient.simulateContract(data)
      return this.walletClient.writeContract(request as any)
    } catch (error: any) {
      console.error(error.message)
      throw error
    }
  }

  async createSchema(
    schema: OnChainSchema,
    options?: {
      delegationSignature?: string
      getTxHash?: (txHash: `0x${string}`) => void
    }
  ): Promise<SchemaResult> {
    const {
      revocable,
      maxValidFor,
      resolver,
      hook,
      data,
      name,
      description,
      registrant,
    } = schema
    const account = await this.getAccount()
    const dataLocation = schema.dataLocation || DataLocationOnChain.ONCHAIN
    const { delegationSignature, getTxHash } = options || {}
    const txHash = await this.invokeContractWrite("register", [
      {
        registrant: registrant || account.address,
        revocable: revocable === undefined ? true : revocable,
        dataLocation: dataLocation,
        maxValidFor: maxValidFor || 0,
        hook: hook || resolver || "0x0000000000000000000000000000000000000000",
        timestamp: 0,
        data:
          dataLocation === DataLocationOnChain.ONCHAIN
            ? JSON.stringify({ name, description, data })
            : data,
      },
      delegationSignature || "",
    ])
    getTxHash && getTxHash(txHash)
    const res = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    })

    const decodedLog: any = decodeEventLog<any, any, any, any>({
      abi: abiJson.abi,
      topics: res.logs[0].topics,
      data: res.logs[0].data,
    })

    const schemaId = numberToHex(decodedLog.args.schemaId)
    return { schemaId, txHash }
  }

  async getSchema(schemaId: string): Promise<Schema> {
    const res: any = await this.invokeContractRead("getSchema", [schemaId])
    if (res.data === "") {
      throw new Error("schema not found")
    }
    const {
      revocable,
      dataLocation,
      maxValidFor,
      resolver,
      hook,
      data,
      timestamp,
    } = res
    const isOnChain = dataLocation === DataLocationOnChain.ONCHAIN
    let dataObj: any
    if (isOnChain) {
      dataObj = JSON.parse(data)
    } else if (
      dataLocation === DataLocationOnChain.ARWEAVE ||
      dataLocation === DataLocationOnChain.IPFS
    ) {
      const res = await getDataFromStorage({ dataId: data, dataLocation })
      dataObj = res.data
    }
    const result: Schema = {
      name: dataObj.name,
      description: dataObj.description,
      revocable,
      dataLocation,
      timestamp: Number(timestamp),
      maxValidFor: Number(maxValidFor),
      hook: hook || resolver,
      data: dataObj.data,
      registrant: res.registrant,
    }
    return result
  }

  async revokeAttestation(
    attestationId: string,
    options?: {
      reason?: string
      delegationSignature?: string
      getTxHash?: (txHash: `0x${string}`) => void
    }
  ): Promise<RevokeAttestationResult> {
    const { reason, delegationSignature, getTxHash } = options || {}
    const txHash = await this.invokeContractWrite("revoke", [
      attestationId,
      reason || "",
      delegationSignature || "",
      "",
    ])
    getTxHash && getTxHash(txHash)
    const res = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    })

    const decodedLog: any = decodeEventLog<any, any, any, any>({
      abi: abiJson.abi,
      topics: res.logs[0].topics,
      data: res.logs[0].data,
    })
    const id = numberToHex(decodedLog.args.attestationId)
    return { attestationId: id, txHash, reason: decodedLog.args.reason }
  }
  async createAttestation(
    attestation: OnChainAttestation,
    options?: CreateAttestationOnChainOptions
  ): Promise<AttestationResult> {
    const {
      schemaId,
      linkedAttestationId,
      data,
      validUntil,
      revoked,
      recipients,
      indexingValue,
      attester,
      attestTimestamp,
      revokeTimestamp,
    } = attestation
    const {
      delegationSignature,
      getTxHash,
      resolverFeesETH,
      recipientEncodingType,
      extraData,
      gated,
    } = options || {}
    const dataLocation = attestation.dataLocation || DataLocationOnChain.ONCHAIN
    let attestationData
    if (delegationSignature) {
      attestationData = {
        schemaId,
        linkedAttestationId,
        data,
        validUntil: BigInt(validUntil || 0),
        revoked,
        recipients,
        attester,
        dataLocation,
        attestTimestamp,
        revokeTimestamp,
      }
    } else {
      const account = await this.getAccount()
      if (!attestation.schemaId) {
        throw new Error("schemaId is required")
      }

      const schema = await this.getSchema(attestation.schemaId)
      const schemaData = schema?.data
      if (!schema) {
        throw new Error("schema not found")
      }
      if (
        schema.dataLocation === DataLocationOnChain.ONCHAIN &&
        dataLocation === DataLocationOnChain.ONCHAIN &&
        !validateObject(data, schemaData as SchemaItem[])
      ) {
        throw new Error("data is not valid")
      }

      // validate schema and encode data
      let encodedData: string

      // if gated encrypt the data and encode it
      if (gated) {
        const litprotocol = new LitProtocol(this.wallet)
        await litprotocol.connect()
        const { encryptedString: encryptedData, stringHash } =
          await litprotocol.encrypt(uint8arrayFromString(JSON.stringify(data)))
        encodedData = encodeOnChainEncryptedData(encryptedData, stringHash)
      } else {
        encodedData = encodeOnChainData(
          data,
          dataLocation as DataLocationOnChain,
          schemaData as SchemaItem[]
        )
      }

      attestationData = {
        schemaId,
        linkedAttestationId: linkedAttestationId || "",
        attester: attester || account.address,
        validUntil: BigInt(validUntil || 0),
        revoked: revoked || false,
        dataLocation,
        attestTimestamp: 0,
        revokeTimestamp: 0,
        recipients:
          recipients?.map((item: string) => {
            const isRecipientAddress = isAddress(item)
            return encodeAbiParameters<any>(
              [
                {
                  name: "data",
                  type:
                    isRecipientAddress &&
                    recipientEncodingType === RecipientEncodingType.Address
                      ? RecipientEncodingType.Address
                      : RecipientEncodingType.String,
                },
              ],
              [item]
            )
          }) || [],
        data: encodedData,
      }
    }
    const params: any = [
      attestationData,
      indexingValue || "",
      delegationSignature || "",
      extraData || "",
    ]
    const attestAbis: any = abiJson.abi.filter(
      (item: any) => item.name === "attest"
    )
    let attestAbi = [attestAbis[0]]
    if (resolverFeesETH) {
      params.splice(1, 0, resolverFeesETH)
      attestAbi = [attestAbis[2]]
    }
    const txHash = await this.invokeContractWrite(
      "attest",
      params,
      resolverFeesETH as bigint,
      [...attestAbi, ...abiJson.abi]
    )
    getTxHash && getTxHash(txHash)
    const res = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    })

    const decodedLog: any = decodeEventLog<any, any, any, any>({
      abi: abiJson.abi,
      topics: res.logs[0].topics,
      data: res.logs[0].data,
    })
    const attestationId = numberToHex(decodedLog.args.attestationId)
    return {
      attestationId,
      txHash,
      indexingValue: decodedLog.args.indexingKey,
    }
  }

  async getAttestation(
    attestationId: string,
    options?: GetAttestationChainOptions
  ): Promise<Attestation> {
    const res: any = await this.invokeContractRead("getAttestation", [
      attestationId,
    ])
    if (res.data === "0x") {
      throw new Error("attestation not found")
    }

    const schemaId = numberToHex(res.schemaId)
    const schema = await this.getSchema(schemaId)
    const schemaData = schema.data

    let decodedData: Record<string, any>
    if (options?.gated) {
      const litprotocol = new LitProtocol(this.wallet!)
      await litprotocol.connect()

      const [encryptedData, stringHash] = decodeOnChainEncryptedData(res.data)
      decodedData = JSON.parse(
        await litprotocol.decrypt(encryptedData, stringHash)
      )
    } else {
      decodedData = decodeOnChainData(
        res.data,
        res.dataLocation,
        schemaData as SchemaItem[]
      )
    }

    const recipients = res.recipients.map((item: any) => {
      let res
      try {
        res = decodeAbiParameters<any>(
          [{ name: "data", type: RecipientEncodingType.String }],
          item
        )[0]
      } catch (error) {
        res = decodeAbiParameters<any>(
          [{ name: "data", type: RecipientEncodingType.Address }],
          item
        )[0]
      }
      return res
    })
    const result: Attestation = {
      attestTimestamp: Number(res.attestTimestamp),
      revokeTimestamp: Number(res.revokeTimestamp),
      schemaId,
      data: decodedData,
      recipients,
      revoked: res.revoked,
      dataLocation: res.dataLocation,
      validUntil: Number(res.validUntil),
      linkedAttestationId:
        "0x" + Number(res.linkedAttestationId).toString(16) || "",
      indexingValue: res.indexingKey,
      attester: res.attester,
    }
    return result
  }
}
