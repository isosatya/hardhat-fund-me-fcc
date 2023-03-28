import { FundMe } from "../../typechain-types";
import { Address } from "hardhat-deploy/dist/types";
import { ethers, getNamedAccounts, network } from "hardhat";
import { assert } from "chai";
import { developmentChains } from "../../helper-hardhat-config";

// if we are on local network, then skip the "describe"
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe, deployer: Address;
          const sendValue = ethers.utils.parseEther("0.00001");

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });
