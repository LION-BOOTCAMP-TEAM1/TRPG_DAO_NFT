import { ethers } from "ethers";
import axios from "axios";
import CONTRACT_ABI from "./abis/GameItem.json";
import {Item} from "../store/types";
import {addItemToInventory} from "../store/characterSlice"

const CONTRACT_ADDRESS = "0x6a25a7a2627f37A6fF4C2e4c490F290309d0B561"; 

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

async function getNFTList(dispatch) {

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
          Object.values(myNFTids).map(async (id) => {
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

export { getNFTList };