import { AttestationInfo, PageInfo, SchemaInfo } from './types/indexService.js';
import { OffChainRpc } from './types/offChain.js';
import { request, stringifyQueryString } from './utils/index.js';
import { checkId } from './utils/tools.js';

export class IndexService {
  private host: OffChainRpc;
  constructor(env: 'mainnet' | 'testnet') {
    this.host = env === 'testnet' ? OffChainRpc.testnet : OffChainRpc.mainnet;
  }
  querySchemaList = async (query: {
    id?: string;
    registrant?: string;
    mode?: 'offchain' | 'onchain';
    page: number;
    size?: number;
  }): Promise<
    | (PageInfo & {
        rows: SchemaInfo[];
      })
    | null
  > => {
    if (query.id && !checkId(query.id)) return null;
    const res = await request(
      `${this.host}/index/schemas?${stringifyQueryString({
        ...query,
        size: query.size || 100,
      })}`
    );
    const data = res.data || {};
    return { ...data, size: Number(data.size || 0) };
  };
  querySchema = async (schemaId: string): Promise<SchemaInfo | null> => {
    if (!checkId(schemaId)) return null;
    const res = await request(`${this.host}/index/schemas/${schemaId}`);
    return res.data;
  };
  queryAttestationList = async (query: {
    id?: string;
    schemaId?: string;
    attester?: string;
    page: number;
    mode?: 'offchain' | 'onchain';
    indexingValue?: string;
  }): Promise<
    | (PageInfo & {
        rows: AttestationInfo[];
      })
    | null
  > => {
    if (query.id && !checkId(query.id)) return null;
    const res = await request(
      `${this.host}/index/attestations?${stringifyQueryString(query)}`
    );
    const data = res.data || {};
    return data;
  };
  queryAttestation = async (
    attestationId: string
  ): Promise<AttestationInfo | null> => {
    if (!checkId(attestationId)) return null;
    const res = await request(
      `${this.host}/index/attestations/${attestationId}`
    );
    return res.data;
  };
}
