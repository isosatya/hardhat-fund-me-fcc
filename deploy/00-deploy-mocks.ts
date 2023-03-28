import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} from "../helper-hardhat-config";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, network } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // If we are on a local development network, we need to deploy mocks!
    // if (developmentChains.includes(network.name)) {
    if (chainId == 31337) {
        console.log("LOCAL NETWORK DETECTED!!! Deploying Mocks...");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });
        log("Mocks deployed!!!!!");
        log("-------------------------------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
