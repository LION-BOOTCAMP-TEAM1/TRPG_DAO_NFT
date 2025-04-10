const { ethers } = require("hardhat");

async function main() {
    // Signer 설정 (첫 번째 계정을 사용)
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contract with account: ${deployer.address}`);

    // 컨트랙트 배포
    const NTF = await ethers.getContractFactory("GameItems");
    const con = await NTF.deploy();

    await con.waitForDeployment();
    await con.mint(deployer.address, 1, 100);
    await con.mint(deployer.address, 3, 200);
    await con.mint(deployer.address, 5, 300);
    const itemIDs = await con.getOwnedTokens(deployer.address);
    console.log(`✅ itemIDs: ${itemIDs}`);

    const addresses = itemIDs.map(() => deployer.address);
    console.log(addresses, itemIDs);
    const res = await con.balanceOfBatch(addresses, [1, 3, 5]);
    console.log(res);

    for(var i = 0; i < itemIDs.length; i++) {
        const balance = await con.balanceOf(deployer.address, itemIDs[i]);
        console.log(`[${itemIDs[i]}] : ${balance}개`);
    }
    
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
