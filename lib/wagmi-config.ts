import { createConfig, http } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'

// Basic wagmi config for Ethereum support (if needed in the future)
// Currently not used as we're using Solana wallets
export const config = createConfig({
  chains: [mainnet, polygon],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
})






