/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  paths: {
    sources: "./",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {}, // 로컬 네트워크
  },
};
