const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PixelCharity", function () {
  async function deployFixture() {
    const [owner, donorA, donorB] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PixelCharity");
    const contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();
    return { contract, owner, donorA, donorB };
  }

  it("accepts donation and stores donor per pixel", async function () {
    const { contract, donorA } = await deployFixture();
    await contract.connect(donorA).donate(12, "For students", { value: ethers.parseEther("0.1") });

    const donor = await contract.pixelToDonor(12);
    expect(donor).to.equal(donorA.address);
  });

  it("rejects duplicate pixel donation", async function () {
    const { contract, donorA, donorB } = await deployFixture();
    await contract.connect(donorA).donate(2, "First", { value: 1000n });
    await expect(contract.connect(donorB).donate(2, "Second", { value: 1000n })).to.be.revertedWith(
      "Pixel already occupied"
    );
  });

  it("returns all donations", async function () {
    const { contract, donorA, donorB } = await deployFixture();
    await contract.connect(donorA).donate(3, "A", { value: 1111n });
    await contract.connect(donorB).donate(4, "B", { value: 2222n });

    const donations = await contract.getDonations();
    expect(donations.length).to.equal(2);
    expect(donations[0].pixelIndex).to.equal(3n);
    expect(donations[1].pixelIndex).to.equal(4n);
  });

  it("allows owner to withdraw", async function () {
    const { contract, owner, donorA } = await deployFixture();
    await contract.connect(donorA).donate(10, "Help", { value: ethers.parseEther("1") });
    await expect(() => contract.connect(owner).withdraw()).to.changeEtherBalance(owner, ethers.parseEther("1"));
  });

  it("blocks non-owner withdraw", async function () {
    const { contract, donorA } = await deployFixture();
    await expect(contract.connect(donorA).withdraw()).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
  });
});
