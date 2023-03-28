import { ethers, getNamedAccounts } from "hardhat";

let main = async () => {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding Contract...");
    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.1"),
    });
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
