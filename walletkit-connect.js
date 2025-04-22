// walletkit-connect.js
import { walletKit } from './walletkit-init.js';

async function connectWallet() {
  try {
    const session = await walletKit.connect({
      namespaces: {
        eip155: {
          methods: ['eth_sendTransaction', 'personal_sign'],
          chains: ['eip155:1'],
          events: ['accountsChanged', 'chainChanged']
        }
      }
    });

    const accounts = session.namespaces.eip155.accounts;
    const address = accounts[0].split(':')[2];
    document.getElementById('walletInfo').innerText = `Connected: ${address}`;
  } catch (err) {
    console.error('Wallet connection failed:', err);
    alert('Failed to connect wallet.');
  }
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);
