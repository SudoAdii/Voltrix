const connectButton = document.getElementById('connect-button');
const walletAddressDiv = document.getElementById('wallet-address');

async function connectPhantom() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      const address = resp.publicKey.toString();
      walletAddressDiv.textContent = `Connected wallet: ${address}`;
      console.log('Wallet public key:', address);
    } catch (err) {
      console.error('Connection failed:', err);
    }
  } else {
    // Redirect if Phantom not installed
    window.location.href = 'https://phantom.app';
  }
}

connectButton.addEventListener('click', connectPhantom);
