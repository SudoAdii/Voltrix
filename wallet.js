var wallet;

function connectWallet() {
  // Silent redirect if Phantom not found
  if (!window.solana || !window.solana.isPhantom) {
    window.location.href = "https://phantom.app/";
    return;
  }

  (async () => {
    try {
      wallet = await window.solana.connect();
      document.getElementById("connect_button").innerText = "Connected ✅";
      document.getElementById("status_p").innerText =
        "Wallet Address: " + ellipsizeAddress(wallet.publicKey.toString());
    } catch (err) {
      console.log("Connection failed:", err);
      document.getElementById("status_p").innerText = "❌ Connection failed!";
    }
  })();

  window.solana.on("connect", () => {
    document.getElementById("connect_button").innerText = "Connected ✅";
  });
}

function ellipsizeAddress(str) {
  return str.length > 35
    ? str.substr(0, 8) + "..." + str.substr(str.length - 8)
    : str;
}
