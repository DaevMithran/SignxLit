import { ChainType, SignType } from "../../../types/index.js"
import { OffChainClientBase } from "../../../interface/OffChainClientBase.js"
import {
  PrivateKeyAccount,
  PublicClient,
  WalletClient,
  http,
  createPublicClient,
  createWalletClient,
  custom,
} from "viem"
import { mainnet } from "viem/chains"
import { OffChainRpc } from "../../../types/offChain.js"

export class OffChainClient extends OffChainClientBase {
  rpc: OffChainRpc | string
  public walletClient!: WalletClient
  public publicClient!: PublicClient
  public privateKeyAccount?: PrivateKeyAccount
  public chain: any
  public account!: { address: `0x${string}` }
  constructor({
    signType,
    rpcUrl: rpc,
    account: privateKeyAccount,
    walletClient,
  }: {
    signType: SignType
    rpcUrl?: OffChainRpc | string
    account?: PrivateKeyAccount
    walletClient?: WalletClient
  }) {
    super(ChainType.evm, signType, rpc || OffChainRpc.mainnet)
    this.rpc = rpc || OffChainRpc.mainnet
    const chain = mainnet
    this.chain = chain
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

  async signTypedData({
    message,
    types,
    primaryType,
  }: {
    message: { [key: string]: any }
    types: { [key: string]: { name: string; type: string }[] }
    primaryType: string
  }): Promise<{ message: any; signature: string }> {
    const data: any = {
      domain: {
        name: "sign.global",
        version: "1",
      } as const,
      message: message,
      primaryType,
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
        ],
        ...types,
      } as const,
    }
    const account = await this.getAccount()
    const signTypedData: any = this.privateKeyAccount
      ? account.signTypedData
      : this.walletClient.signTypedData
    const signature = await signTypedData({
      account: account.address,
      ...data,
    })
    return {
      message: data,
      signature,
    }
  }

  async signMessage(message: string): Promise<string> {
    const account = await this.getAccount()
    const signMessage = this.privateKeyAccount
      ? account.signMessage
      : this.walletClient.signMessage
    return await signMessage({
      account: account.address,
      message,
    })
  }
}
