import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "hardhat";

const { ethers } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);

  const DAO = await ethers.getContractFactory("TRPG_DAO");
  const dao = await DAO.deploy();
  await dao.waitForDeployment();

  const address = await dao.getAddress();
  console.log("TRPG_DAO deployed to:", address);

  // ✅ 경로를 blockchain/../frontend/deployments로 수정
  const deploymentsDir = join(__dirname, "..", "..", "frontend", "deployments");
  const outputPath = join(deploymentsDir, "localDao.json");

  // 디렉토리가 없으면 생성
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }

  const data = {
    address,
    deployer: deployer.address,
    network: "localhost",
    timestamp: new Date().toISOString(),
  };

  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Contract address saved to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
