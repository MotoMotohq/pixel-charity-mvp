const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const PixelCharity = await hre.ethers.getContractFactory("PixelCharity");
  const pixelCharity = await PixelCharity.deploy(deployer.address);
  await pixelCharity.waitForDeployment();

  const deployed = await pixelCharity.getAddress();
  console.log("PixelCharity deployed to:", deployed);
  console.log("Frontend .env: VITE_PIXEL_CHARITY_ADDRESS=" + deployed);
  console.log("Local Hardhat: VITE_RPC_URL=http://127.0.0.1:8545 and optional VITE_EXPECTED_CHAIN_ID=31337");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
