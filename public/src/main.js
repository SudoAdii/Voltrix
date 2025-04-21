import { Web3Modal } from '@web3modal/html'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { configureChains, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const projectId = 'e1dd9756d3b0e76895816f3a3a24db16'

const chains = [mainnet]
const { publicClient } = configureChains(chains, [w3mProvider({ projectId }), publicProvider()])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
})

const ethereumClient = new EthereumClient(wagmiConfig, chains)

const modal = new Web3Modal(
  {
    projectId,
    themeMode: 'dark'
  },
  ethereumClient
)
