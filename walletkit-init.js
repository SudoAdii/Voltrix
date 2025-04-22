// walletkit-init.js
import { WalletKit } from 'https://cdn.skypack.dev/@reown/walletkit';

export const walletKit = await WalletKit.init({
  projectId: 'your-project-id-here', // Replace with your actual project ID
  metadata: {
    name: 'Voltrix',
    description: 'Voltrix Web3 Dapp',
    url: 'https://yourdomain.com',
    icons: ['images/logo.png']
  }
});
