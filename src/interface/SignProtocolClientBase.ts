import {
  Attestation,
  AttestationResult,
  CreateAttestationOnChainOptions,
  GetAttestationChainOptions,
  RecipientEncodingType,
  RevokeAttestationOnChainOptions,
  RevokeAttestationResult,
  Schema,
  SchemaResult,
} from "../types/index.js"

export interface SignProtocolClientBase {
  createSchema(schema: Schema): Promise<SchemaResult>
  createSchema(
    schema: Schema,
    options?: { getTxHash?: (txHash: `0x${string}`) => void }
  ): Promise<SchemaResult>

  getSchema(schemaId: string): Promise<Schema>

  createAttestation(attestation: Attestation): Promise<AttestationResult>
  createAttestation(
    attestation: Attestation,
    options?: CreateAttestationOnChainOptions
  ): Promise<AttestationResult>

  getAttestation(
    attestationId: string,
    options?: GetAttestationChainOptions
  ): Promise<Attestation>

  revokeAttestation(
    attestationId: string,
    options?: {
      reason?: string
    }
  ): Promise<RevokeAttestationResult>
  revokeAttestation(
    attestationId: string,
    options?: RevokeAttestationOnChainOptions
  ): Promise<RevokeAttestationResult>
}
