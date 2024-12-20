import { PrivateKeyAccount } from "viem/accounts"
import { EvmChains } from "../clients/evm/types.js"
import { OffChainRpc } from "./offChain.js"
import { WalletClient } from "viem"
import { AbiType } from "abitype"
import { AccsOperatorParams, AccsParams } from "@lit-protocol/types"
export * from "./indexService.js"

export type ContractInfo = {
  address: Address
  chain: any
}

export enum DataLocationOnChain {
  ONCHAIN, // only when Mode=OnChain
  ARWEAVE,
  IPFS,
}

export enum DataLocationOffChain {
  ARWEAVE = "arweave",
  IPFS = "ipfs",
  GREENFIELD = "greenfield",
  GREENFIELD_TESTTNET = "greenfield-testnet",
}

export type DataLocation = DataLocationOnChain | DataLocationOffChain
export enum SignType {
  "eip712" = "eip712",
}
export enum OffChainSignType {
  EvmEip712 = "evm-eip712",
}
export type SchemaItem = {
  name: string
  type: AbiType
}
export type Address = `0x${string}`

export type SchemaResult = {
  schemaId: string
  txHash?: string
}
export type AttestationResult = {
  attestationId: string
  indexingValue: string
  txHash?: string
}
export enum ChainType {
  evm = "evm",
}
export enum SpMode {
  OnChain = "OnChain",
  OffChain = "OffChain",
}

export type OnChainClientOptions = {
  chain: EvmChains
  account?: PrivateKeyAccount
  wallet?: any
  rpcUrl?: string
  walletClient?: WalletClient
}

export type OffChainClientOptions = {
  signType: OffChainSignType
  account?: PrivateKeyAccount
  rpcUrl?: OffChainRpc | string
  walletClient?: WalletClient
  wallet?: any
}

type CommonSchema = {
  name: string
  description?: string
  revocable?: boolean //Whether Attestations that adopt this Schema can be revoked.
  maxValidFor?: number //The maximum number of seconds that an Attestation can remain valid. 0 means Attestations can be valid forever. This is enforced through `Attestation.validUntil`.
}

export type OnChainSchema =
  | (CommonSchema & {
      /**
       * @deprecated please use `hook` instead
       */
      resolver?: Address
      hook?: Address
      registrant?: Address
      timestamp?: number
      dataLocation?: DataLocationOnChain.ONCHAIN //Where `Schema.data` is stored. See `DataLocation.DataLocation`.
      data: SchemaItem[] // when dataLocation=ONCHAIN, data is SchemaItem[], when dataLocation=ARWEAVE or IPFS, data is id of the data,
    })
  | (CommonSchema & {
      resolver?: Address
      hook?: Address
      registrant?: Address
      dataLocation: DataLocationOnChain.ARWEAVE | DataLocationOnChain.IPFS //Where `Schema.data` is stored. See `DataLocation.DataLocation`.
      data: string // when dataLocation=ONCHAIN, data is SchemaItem[], when dataLocation=ARWEAVE or IPFS, data is id of the data,
    })

export type OffChainSchema = CommonSchema & {
  dataLocation?:
    | DataLocationOffChain.ARWEAVE
    | DataLocationOffChain.IPFS
    | DataLocationOffChain.GREENFIELD
  data: SchemaItem[]
}

/**
 * Schema is a template for Attestations. It defines the structure of the data that can be included in an Attestation, and the rules that apply to it.
 * @typedef Schema
 * @property {string} name - The name of the Schema.
 * @property {string} [description] - The description of the Schema.
 * @property {boolean} [revocable] - Whether Attestations that adopt this Schema can be revoked.
 * @property {DataLocation} [schemaDataLocation] - Where `Schema.data` is stored. See `DataLocation.DataLocation`.
 * @property {DataLocation} [attestationDataLocation] - Where `Schema.data` is stored. See `DataLocation.DataLocation`.
 * @property {number} [maxValidFor] - The maximum number of seconds that an Attestation can remain valid. 0 means Attestations can be valid forever. This is enforced through `Attestation.validUntil`.
 * @property {Address} [resolver] - The `ISPResolver` that is called at the end of every function. 0 means there is no resolver set. See `ISPResolver`.
 * @property {SchemaItem[] | string} data - // when dataLocation=ONCHAIN, data is SchemaItem[], when dataLocation=ARWEAVE or IPFS, data is id of the data,
 */
export type Schema = OnChainSchema | OffChainSchema

type CommonAttestation = {
  schemaId: string
  linkedAttestationId?: string | null
  validUntil?: number
  revoked?: boolean | null
  recipients?: string[]
  indexingValue: string
  attester?: Address
  gated?: boolean
}
export type OnChainAttestation =
  | (CommonAttestation & {
      attestTimestamp?: number
      revokeTimestamp?: number
      dataLocation?: DataLocationOnChain.ONCHAIN //Where `Attestation.data` is stored. See `DataLocation.DataLocation`.
      data: { [key: string]: any }
    })
  | (CommonAttestation & {
      attestTimestamp?: number
      revokeTimestamp?: number
      dataLocation: DataLocationOnChain.ARWEAVE | DataLocationOnChain.IPFS //Where `Attestation.data` is stored. See `DataLocation.DataLocation`.
      data: string
    })
type OffChainAttestation = CommonAttestation & {
  dataLocation?:
    | DataLocationOffChain.ARWEAVE
    | DataLocationOffChain.IPFS
    | DataLocationOffChain.GREENFIELD
  data: { [key: string]: any }
}
/**
 * This struct represents an on-chain attestation record. This record is not deleted after revocation.
 * @typedef Attestation
 * @property {string} schemaId - The `Schema` that this Attestation is based on. It must exist.
 * @property {string} [linkedAttestationId] - Useful if the current Attestation references a previous Attestation. It can either be 0 or an existing attestation ID.
 * @property {object} data - The raw data of the Attestation based on `Schema.data`.
 * @property {number} [validUntil] - The expiration timestamp(seconds) of the Attestation. Must respect `Schema.maxValidFor`. 0 indicates no expiration date.
 * @property {boolean} [revoked] - If the Attestation has been revoked. It is possible to make a revoked Attestation.
 * @property {string[]} [recipients] - The intended  recipients of this Attestation.
 * @property {string} indexingValue - The value that is used to index this Attestation.
 */
export type Attestation = OnChainAttestation | OffChainAttestation

export type AttestationDelegationSignature = {
  attestation: Attestation
  delegationSignature: `0x${string}`
}
export type SchemaDelegationSignature = {
  schema: OnChainSchema
  delegationSignature: `0x${string}`
}
export type RevokeDelegationSignature = {
  attestationId: string
  delegationSignature: `0x${string}`
  reason?: string
}

export type RevokeAttestationResult = {
  attestationId: string
  txHash?: string
  reason?: string
}

export type AttestationRevokeInfo = {
  attestationId: string
  revokeReason: string
}

export enum RecipientEncodingType {
  Address = "address",
  String = "string",
}

export type CreateAttestationOnChainOptions = {
  resolverFeesETH?: BigInt //unit wei
  delegationSignature?: string
  getTxHash?: (txHash: `0x${string}`) => void
  recipientEncodingType?: RecipientEncodingType
  extraData?: `0x${string}`
  gated?: boolean
  accessControlConditions?: (AccsParams | AccsOperatorParams)[]
}

export type GetAttestationChainOptions = {
  gated?: boolean
}

export type RevokeAttestationOnChainOptions = {
  reason?: string
  delegationSignature?: string
  getTxHash?: (txHash: `0x${string}`) => void
  extraData?: `0x${string}`
}
