import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { assert, expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import { Address } from "hardhat-deploy/dist/types";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: FundMe,
              mockV3Aggregator: MockV3Aggregator,
              deployer: Address,
              response;
          // 1 eth in gwei (1000000000000000000 wei)
          const sendValue = ethers.utils.parseEther("3");

          beforeEach(async () => {
              //deploy our fundMe contract using Hardhat-deploy

              // Option 1-
              // this returns an array w/the accounts in hardat.config file
              // or the fake accounts in the local hardhat network
              // const accounts = await ethers.getSigners();
              // const accountZero = accounts[0];

              // Option 2-
              // this is just like in the deployer files
              deployer = (await getNamedAccounts()).deployer;

              await deployments.fixture(["all"]);

              // getContract() method comes from 'hardhat-deploy' packages --> used for testing
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", async () => {
              it("sets the aggregator address correctly", async () => {
                  response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async () => {
              it("Fails if you don´t send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "didnt send enough"
                  );
              });
              it("Updated the SignerWithAddressdata structure", async () => {
                  await fundMe.fund({ value: sendValue });
                  // here deployer, because the "deployer" is funding in this case
                  // we return the amount in the data structure, corresponding to the deployer
                  response = await fundMe.getAddressToAmountFunded(deployer);
                  assert.equal(response.toString(), sendValue.toString());
              });
              it("Adds funder to array of funders", async () => {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue });
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
              });

              it("Withdraw ETH from a single founder", async () => {
                  // Arrange
                  // here could have also been ethers.provider.getBalance() --> says Patrick
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  /*
                      fundMe.withdraw(); ---> calling a property of the contract

                      fundMe.provider.getBalance(fundMe.address); ---> calling a 
                                function of the contract
                    */

                  // Act
                  const transactionResponse = await fundMe.withdraw();

                  const transactionReceipt = await transactionResponse.wait(1);

                  // this comes from ethers documentation for 'TransactionReceipt'
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  // .mul() or .add() are used because of BigNumber
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0");
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it("allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  // we get the accounts that we have available
                  const accounts = await ethers.getSigners();

                  //       i = 1 --> because i = 0 is the deployer account
                  //              i < 6 just so it only goes through 6 accounts
                  for (let i = 1; i < 6; i++) {
                      // this is like selecting a different account on the Remix UI
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      // used the invoked account to transfer ether
                      await fundMeConnectedContract.fund({ value: sendValue });

                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      // Act
                      const transactionResponse = await fundMe.withdraw();
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      );
                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      // Assert
                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      assert.equal(endingFundMeBalance.toString(), "0");
                      assert.equal(
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      );

                      // making sure that the funders array is reset properly
                      await expect(fundMe.getFunder(0)).to.be.reverted;

                      for (i = 0; i < 6; i++) {
                          assert.equal(
                              await (
                                  await fundMe.getAddressToAmountFunded(
                                      accounts[i].address
                                  )
                              ).toString(),
                              "0"
                          );
                      }
                  }
              });

              it("Only allows the owner to withdraw", async () => {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = fundMe.connect(attacker);

                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });

              it("allows us to CHEAPER withdraw with multiple funders", async () => {
                  // Arrange
                  // we get the accounts that we have available
                  const accounts = await ethers.getSigners();

                  //       i = 1 --> because i = 0 is the deployer account
                  //              i < 6 just so it only goes through 6 accounts
                  for (let i = 1; i < 6; i++) {
                      // this is like selecting a different account on the Remix UI
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      // used the invoked account to transfer ether
                      await fundMeConnectedContract.fund({ value: sendValue });

                      const startingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const startingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      // Act
                      const transactionResponse =
                          await fundMe.cheaperWithdraw();
                      const transactionReceipt = await transactionResponse.wait(
                          1
                      );
                      const { gasUsed, effectiveGasPrice } = transactionReceipt;
                      const gasCost = gasUsed.mul(effectiveGasPrice);

                      // Assert
                      const endingFundMeBalance =
                          await fundMe.provider.getBalance(fundMe.address);
                      const endingDeployerBalance =
                          await fundMe.provider.getBalance(deployer);

                      assert.equal(endingFundMeBalance.toString(), "0");
                      assert.equal(
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString(),
                          endingDeployerBalance.add(gasCost).toString()
                      );

                      // making sure that the funders array is reset properly
                      await expect(fundMe.getFunder(0)).to.be.reverted;

                      for (i = 0; i < 6; i++) {
                          assert.equal(
                              await (
                                  await fundMe.getAddressToAmountFunded(
                                      accounts[i].address
                                  )
                              ).toString(),
                              "0"
                          );
                      }
                  }
              });
          });
      });
