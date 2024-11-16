import { DataLocationOnChain } from './types/index.js';
import { OffChainRpc } from './types/offChain.js';
import { request } from './utils/index.js';

export const getDataFromStorage = async (data: {
  dataId: string;
  dataLocation: DataLocationOnChain.ARWEAVE | DataLocationOnChain.IPFS;
}): Promise<any> => {
  return request(
    `${OffChainRpc.mainnet}/sp/storage-data?dataId=${
      data.dataId
    }&dataLocation=${
      data.dataLocation === DataLocationOnChain.ARWEAVE ? 'arweave' : 'ipfs'
    }`
  );
};
