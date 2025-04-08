import { ethers } from "ethers";
import axios from "axios";
import CONTRACT_ABI from "./abis/GameItem.json";
import {Item} from "../store/types";
import {addItemToInventory, clearInventory} from "../store/characterSlice"

const CONTRACT_ADDRESS = "0x994fDDa7215E84202e3585B8EBCcA89960b42705";
const MARKET_CONTRACT_ADDRESS = '0x16FE8D89Cb7Bf27c72660d7bDf8b9905B4455807';

function getProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  } else {
    throw new Error("클라이언트 환경이 아닙니다.");
  }
}

async function getSigner() {
  return await getProvider().getSigner();
}

async function getContract() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer); 
}

async function getIPFSFile(uri: string) {
  try {
    const res = await axios.get(uri);
    const data = res.data;

    return data;
  } catch (error) {
    console.error("❌ Failed to fetch metadata:", error);
    return null;
  }
}

let isFetching = false;
async function getNFTList(dispatch: any) {
  if (isFetching) return; // 중복 실행 방지
  isFetching = true;

  dispatch(clearInventory());
    const contract = await getContract();

    try {
        const signer = await getSigner();
        const myAddress = signer.address;
        const myNFTids_BI = await contract.getOwnedTokens(myAddress);
        
        // BigInt to Number 변환
        const addresses = myNFTids_BI.map(() => myAddress);
        const myNFTids = Object.values(myNFTids_BI).map(value => Number(value));
        const myNFTamounts_BI = await contract.balanceOfBatch(addresses, myNFTids);
        const myNFTamounts = Object.values(myNFTamounts_BI).map(value => Number(value));
        
        // NFT 데이터를 전역에 저장
        await Promise.all(
          Object.values(myNFTids).map(async (id, index) => {
            const uri = await contract.uri(id);
            const newURI = uri.replace("{id}", String(id));
            const item = await getIPFSFile(newURI);

            const newItem:Item = {
              id: id,
              name: item.name,
              description: item.description,
              image: item.image,
              type: item.type, // 무기 방어구 악세
              rarity: item.rarity,
              isNFT: true,
              amount: myNFTamounts[index],
              stat:{
                  attack: item.attack,
                  magic: item.magic,
                  strength: item.strength,
                  agility: item.agility,
                  intelligence: item.intelligence,
                  charisma: item.charisma,
                  health: item.health,
                  wisdom: item.wisdom,
              }
            }
            dispatch(addItemToInventory(newItem));
          })
        );
    } catch (error) {
        console.error("Error fetching NFT:", error);
        return null;
    }
}

async function setApprovalForAll() {
  try {
    const contract = await getContract();
    const signer = await getSigner();
    const tx = await contract.setApprovalForAll(MARKET_CONTRACT_ADDRESS, true);
    
    // 영수증 기다리기..
    await tx.wait();

    // Approve 가져오기
    return isApprovedForAll();
  } catch (err) {
    console.error("❌ Approve 실패:", err);
    return false;
  }
}

async function isApprovedForAll() {
  try {
    const contract = await getContract();
    const signer = await getSigner();

    // Approve 가져오기
    const approve = await contract.isApprovedForAll(signer.address, MARKET_CONTRACT_ADDRESS);
    return approve;
  } catch (err) {
    console.error("❌ Approve 실패:", err);
    return false;
  }
}

async function randomMint(dispatch: any) {
  try {
    const contract = await getContract();
    const signer = await getSigner();
    const userAddress = await signer.getAddress();

    // 0.01 ETH 보내면서 민트 요청
    const tx = await contract.mintRandom(
      userAddress,
      {
        value: ethers.parseEther("0.01"), // 가격에 맞게 조정
      }
    );

    // 영수증 기다리기..
    const receipt = await tx.wait();
    
    // 영수증 내역에서 내꺼 찾기
    for (const log of receipt.logs) {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "minted") {
        const tokenId = Number(parsed.args.tokenId);

        const uri = await contract.uri(tokenId);
        const newURI = uri.replace("{id}", String(tokenId));
        const item = await getIPFSFile(newURI);

        const newItem:Item = {
          id: tokenId,
          name: item.name,
          description: item.description,
          image: item.image,
          type: item.type, // 무기 방어구 악세
          rarity: item.rarity,
          isNFT: true,
          amount: 1,
          stat:{
              attack: item.attack,
              magic: item.magic,
              strength: item.strength,
              agility: item.agility,
              intelligence: item.intelligence,
              charisma: item.charisma,
              health: item.health,
              wisdom: item.wisdom,
          }
        }
        dispatch(addItemToInventory(newItem));

        return newItem;
      }
    }

  } catch (err) {
    console.error("❌ 랜덤 민팅 실패:", err);
  }
}

export { getContract, getIPFSFile, getNFTList, randomMint, setApprovalForAll, isApprovedForAll };