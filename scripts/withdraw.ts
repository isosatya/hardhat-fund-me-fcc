import { ethers, getNamedAccounts } from "hardhat";

let main = async () => {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawing...");
    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);
    console.log("got my money back!!!!");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
