    let wallet;

    function connectWallet() {
      if (!window.solana || !window.solana.isPhantom) {
        window.location.href = "https://phantom.app/";
        return;
      }

      (async () => {
        try {
          const resp = await window.solana.connect();
          wallet = resp.publicKey;

          if (!wallet) {
            document.getElementById("status_p").innerText = "❌ Connection rejected.";
            return;
          }

          const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");
          const lamports = await connection.getBalance(wallet);
          const sol = lamports / solanaWeb3.LAMPORTS_PER_SOL;

          document.getElementById("connect_button").innerText = "Connected ✅";
          document.getElementById("status_p").innerText =
            "Wallet: " + ellipsize(wallet.toString()) + " | Balance: " + sol.toFixed(4) + " SOL";

        } catch (err) {
          console.error("❌ Error:", err);
          document.getElementById("status_p").innerText = "❌ Something went wrong.";
        }
      })();
    }

    function ellipsize(str) {
      return str.slice(0, 6) + "..." + str.slice(-4);
    }
