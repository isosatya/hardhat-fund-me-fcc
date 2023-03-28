// SPDX-License-Identifier: MIT

// 1- Pragma
pragma solidity ^0.8.18;

// 2- Imports
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// 3- Errors
error FundMe__NotOwner();

// 4- Interfaces, Libraries, Contracts

// NatSpec documentation
/**
 * @title A contract for crowdfunding
 * @author Andrés Singh
 * @notice (Explanation of functionality)
 * @dev (Any extra details)
 */

contract FundMe {
    using PriceConverter for uint256;
    /*
    s_funders, s_priceFeed, s_addressToAmountFunded --> all storage variables
    MINIMUM_USD, i_owner --> NOT variables --> part of contract bytecode

    --> we made variables private, so save gas
*/

    //  segun Patrick MINIMUM_USD = 50 * 1e18 --> pero para mi no es asi
    uint256 public constant MINIMUM_USD = 50;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    // price feed coming from sepolia network in this link
    // 0x694AA1769357215DE4FAC081bf1f309aDC325306
    // https://docs.chain.link/data-feeds/price-feeds/addresses

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "Sender is not sender of msg!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        } // more gas efficient
        _;
    }

    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    function fund() public payable {
        // minimum fund amound in usd
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "didnt send enough"
        ); // 1 eth = 1e18 wei

        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // reset the array
        s_funders = new address[](0);

        // actually withdraw the funds:

        //transfer --> this method does reverse if not successfull
        // payable(msg.sender) = payable address
        // payable(msg.sender).transfer(address(this).balance);

        //send --> this method does not reverse if not successfull that´s why "require" is needed
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "SEND FAILED");

        // //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");

        require(callSuccess, "CALL FAILED: Failed to send Ether");
    }

    function cheaperWithdraw() public payable onlyOwner {
        // in this function we use memory storage instead of contract storage
        // copying values from storage to memory so we use less gass

        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");

        require(callSuccess, "CALL FAILED: Failed to send Ether");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
