import pkg from "hardhat";
const { ethers } = pkg;
import { expect } from "chai";

describe("TRPG_DAO", function () {
  let dao, owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const DAO = await ethers.getContractFactory("TRPG_DAO");
    dao = await DAO.deploy();
  });

  it("should grant rule master role, create session, add user, create proposal, vote, and auto-close", async () => {
    // 1. owner → user1에게 룰 마스터 권한 부여
    await dao.connect(owner).addRuleMaster(user1.address);

    // 🔍 user1이 룰 마스터인지 확인
    const isRuleMaster = await dao.ruleMasters(user1.address);
    expect(isRuleMaster).to.equal(true);

    // 2. user1이 세션 생성
    await dao.connect(user1).createSession(1, 1, 1);

    // 3. user1이 user2를 세션에 추가
    await dao.connect(user1).addUserToSession(1, user2.address);

    // 4. user1이 프로포절 생성 (세션 스코프: 1, scopeId: 1, 옵션: 2개)
    await dao.connect(user1).createProposal("Test Proposal", 3600, 1, 1, 2);

    // 5. user2가 투표
    await dao.connect(user2).vote(0, 1);

    // 6. proposal이 자동으로 종료됐는지 확인
    const proposal = await dao.getProposal(0);
    console.log("proposal.result", await dao.getProposalResults(0));
    expect(proposal.active).to.equal(false);
  });
});
