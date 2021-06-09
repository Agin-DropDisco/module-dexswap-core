const HDWalletProvider = require('truffle-hdwallet-provider')	
require('dotenv').config();

mnemonic = process.env.KEY_MNEMONIC;
infuraApiKey = process.env.KEY_INFURA_API_KEY;
privateKey = process.env.PRIVATE_KEY;

module.exports = {	
  networks: {	
    rpc: {	
      network_id: '*',	
      host: 'localhost',	
      port: 8545,	
      gas: 9000000,	
      gasPrice: 10000000000 //10 Gwei	
    },	
    develop: {	
      network_id: '66',	
      host: 'localhost',	
      port: 8545,	
      gas: 9000000,	
      gasPrice: 10000000000 //10 Gwei	
    },	
    mainnet: {	
      provider: function () {	
        return new HDWalletProvider(mnemonic, `https://mainnet.infura.io/v3/${infuraApiKey}`)	
      },	
      network_id: '1',	
      gas: 9000000,	
      gasPrice: 10000000000 //10 Gwei	
    },	
    rinkeby: {	
      provider: function () {	
        return new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraApiKey}`)	
      },	
      network_id: '4',	
      gas: 9000000,	
      gasPrice: 10000000000 //10 Gwei	
    },	
    moonbase: {	
      provider: () => new HDWalletProvider([privateKey], "https://rpc.testnet.moonbeam.network"),
      network_id: '1287',	
      gas: 0,	
      gasPrice: 10000000000 //10 Gwei	
    },	
    oasis: {	
      provider: () => new HDWalletProvider([privateKey], "https://rpc.oasiseth.org:8545"),
      network_id: '69',	
      gas: 9000000,	
      gasPrice: 1000000000 //1 Gwei	
    },	
    matic: {	
      provider: function () {	
        return new HDWalletProvider(mnemonic, "https://rpc-mumbai.matic.today")	
      },
      // provider: () => new HDWalletProvider(mnemonic, `https://rpc-mumbai.matic.today`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },	
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },
  build: {},	
  compilers: {	
    solc: {	
      version: '0.5.16',
      settings: {
        evmVersion: 'istanbul',
      },
    }
  },	
  
  solc: {	
    optimizer: {	
      enabled: true,	
      runs: 200	
    }
  },	
}
