interface networkConfigItem {
    ethUsdPriceFeed?: string;
    blockConfirmations?: number;
}

interface networkConfigInfo {
    [key: string]: networkConfigItem;
}

const networkConfig: networkConfigInfo = {
    localhost: {},
    hardhat: {},
    // 11155111 --> chainID from Sepolia
    sepolia: {
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        blockConfirmations: 6,
    },
};

const developmentChains = ["hardhat", "localhost"];

// these come from the MockV3Aggregator (@chainlink) constructor
const DECIMALS = 8;
const INITIAL_ANSWER = 2000;

module.exports = { networkConfig, developmentChains, DECIMALS, INITIAL_ANSWER };
