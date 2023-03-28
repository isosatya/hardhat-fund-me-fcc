import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "solidity-coverage";
import "typechain";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-rinkbey";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key";
const COINMARKETCAP_KEY = process.env.COINMARKETCAP_KEY || "key";

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY!],
            chainId: 11155111, //https://chainlist.org
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.18",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_KEY,
        token: "MATIC",
    },
    namedAccounts: {
        deployer: { default: 0 },
        user: { default: 1 },
    },
};

export default config;
