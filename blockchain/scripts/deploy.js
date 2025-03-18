const { ethers } = require("hardhat");

async function main() {
    // Signer 설정 (첫 번째 계정을 사용)
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contract with account: ${deployer.address}`);

    // 컨트랙트 배포
    const NTF = await ethers.getContractFactory("Test");
    const con = await NTF.deploy();

    await con.waitForDeployment();
    const contractAddress = await con.getAddress();
    console.log(`✅ deployed to: ${contractAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
