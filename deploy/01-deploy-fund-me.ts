/* 
function deployFunc(hre: any) {
    console.log("HIIIIIIII");
}

module.exports.default = deployFunc;
*/

import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import verify from "../utils/verify";

// hre ==> hardhat runtime environment

// module.exports = async (hre: any) => {
//     const { getNamedAccounts, deployments } = hre;
module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId!;

    // ethUsdPriceFeedAdress changes based on which chain we using from helper-hardhat-config
    // const ethUsdPriceFeedAdress = networkConfig[chainId]["ethUsdPriceFeed"];

    let ethUsdPriceFeedAdress;
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAdress = ethUsdAggregator.address;
        ////////////////////
        console.log(
            "ethUsdPriceFeedAdress chainId == 31337",
            ethUsdPriceFeedAdress
        );
    } else {
        ethUsdPriceFeedAdress = networkConfig[network.name].ethUsdPriceFeed!;
        /////////////////////
        console.log("ethUsdPriceFeedAdress", ethUsdPriceFeedAdress);
    }

    //if the contract is not deployed, we deploy a minimal version of our local testing

    const args = [ethUsdPriceFeedAdress];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // pricefeed Address
        log: true,
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    });

    log(`FundMe deployed at ${fundMe.address}`);

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }

    log("-------------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
