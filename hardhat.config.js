/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  paths: {
    sources: "./blockchain",
    cache: "./blockchain/cache",
    artifacts: "./blockchain/artifacts"
  },
  networks: {
    hardhat: {}, // 로컬 네트워크
  },
};
