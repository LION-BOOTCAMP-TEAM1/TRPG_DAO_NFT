import { ethers } from "ethers";
import axios from "axios";
import CONTRACT_ABI from "./abis/GameItem.json";
import {Item} from "../store/types";
import {addItemToInventory} from "../store/characterSlice"

const CONTRACT_ADDRESS = "0xb6421262CA413510B84f2c728eB775d6acBa5b75"; 

export function getProvider() {
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

async function getNFTList(dispatch: any) {

    const contract = await getContract(); 
    try {
        const signer = await getSigner();
        const myAddress = "0x1e99e1F4C043968e19682404d8671BA104Faf372"; // 내 지갑 ㅠ signer.address
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

async function randomMint(dispatch: any) {
  try {
    const contract = await getContract();
    const signer = await getSigner();
    const userAddress = await signer.getAddress();

    // 0.01 ETH 보내면서 민트 요청
    const tx = await contract.mintRandom({
      value: ethers.parseEther("0.01"), // 가격에 맞게 조정
    });

    console.log("⏳ 트랜잭션 전송됨:", tx.hash);

    // 이벤트 수신 대기 (한 번만)
    const receipt = await tx.wait();

    const log = receipt.logs.find((log) => {
      try {
        return contract.interface.parseLog(log)?.name === "MintedRandom";
      } catch {
        return false;
      }
    });

    if (!log) {
      console.error("❌ 이벤트 수신 실패");
      return;
    }

    const parsed = contract.interface.parseLog(log);
    const tokenId = parsed?.args?.tokenId?.toString();
    console.log("✅ 랜덤 민팅된 tokenId:", tokenId);

    // 메타데이터 URI
    const uriRaw = await contract.uri(tokenId);
    const uri = uriRaw.replace("{id}", tokenId.padStart(64, "0")); // IPFS CID 형식 맞추기

    // 메타데이터 가져오기
    const metadata = await getIPFSFile(uri);
    if (!metadata) return;

    const newItem: Item = {
      id: parseInt(tokenId),
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      type: metadata.type,
      rarity: metadata.rarity,
      isNFT: true,
      stat: metadata.stat,
    };

    // Redux 저장
    dispatch(addItemToInventory(newItem));
    console.log("✅ 인벤토리에 추가됨:", newItem.name);
  } catch (err) {
    console.error("❌ 랜덤 민팅 실패:", err);
  }
}

export { getNFTList, randomMint };