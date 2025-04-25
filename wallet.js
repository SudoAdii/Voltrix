var wallet;

function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    window.location.href = "https://phantom.app/";
    return;
  }

  (async () => {
    try {
      wallet = await window.solana.connect();

      if (!wallet || !wallet.publicKey) {
        document.getElementById("status_p").innerText = "❌ Connection rejected by user.";
        return;
      }

      const walletAddress = wallet.publicKey.toString();
      const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");
      const balanceLamports = await connection.getBalance(wallet.publicKey);
      const solBalance = balanceLamports / solanaWeb3.LAMPORTS_PER_SOL;

      document.getElementById("connect_button").innerText = "Connected ✅";
      document.getElementById("status_p").innerText =
        "Wallet: " + ellipsizeAddress(walletAddress) + " | Balance: " + solBalance.toFixed(4) + " SOL";

    } catch (err) {
      document.getElementById("status_p").innerText = "❌ Something went wrong.";
    }
  })();
}

function ellipsizeAddress(str) {
  return str.length > 35
    ? str.substr(0, 8) + "..." + str.substr(str.length - 8)
    : str;
}
