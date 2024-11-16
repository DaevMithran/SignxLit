import { IndexService } from "./IndexService.js"
import { SignProtocolClient } from "./SignProtocolClient.js"
import { chainInfo } from "./clients/evm/constants.js"
import { EvmChains } from "./clients/evm/types.js"
import {
  SpMode,
  OffChainSignType,
  DataLocationOnChain,
  DataLocationOffChain,
} from "./types/index.js"
import type { DataLocation } from "./types/index.js"
import { OffChainRpc } from "./types/offChain.js"
import {
  delegateSignAttestation,
  delegateSignRevokeAttestation,
  delegateSignSchema,
} from "./utils/tools.js"

import { validateObject, decodeOnChainData } from "./utils/index.js"

export {
  SignProtocolClient,
  EvmChains,
  SpMode,
  OffChainRpc,
  OffChainSignType,
  DataLocation,
  DataLocationOnChain,
  DataLocationOffChain,
  delegateSignAttestation,
  delegateSignRevokeAttestation,
  delegateSignSchema,
  chainInfo,
  decodeOnChainData,
  validateObject,
  IndexService,
}
export * from "./types/index.js"
