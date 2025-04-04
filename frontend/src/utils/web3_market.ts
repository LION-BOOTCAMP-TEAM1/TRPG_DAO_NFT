import { ethers } from "ethers";
import CONTRACT_ABI from "./abis/MarketPlace.json";
import {getContract, getIPFSFile} from "./web3";
import { Item, saleContent } from "@/store/types"

const CONTRACT_ADDRESS = "0x1dcC22a0D550ef5066A73b8a9699cd43E2bB27B2";

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

async function getMarketContract() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer); 
}

async function getSaleList() {
    const contract = await getMarketContract();
    const NFTContract = await getContract();

    const result: saleContent[] = [];

    try {
        const saleList = await contract.getAllListings();
        
        await Promise.all(
          Object.values(saleList).map(async (value: any) => {
            const nftID = Number(value[1]);
            const uri = await NFTContract.uri(nftID);
            const newURI = uri.replace("{id}", String(nftID));
            const item = await getIPFSFile(newURI);
            const newItem:Item = {
              id: nftID,
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
  
            const sale: saleContent = {
              seller: value[0],
              nft_id: Number(value[1]),
              price: Number(value[2]),
              amount: Number(value[3]),
              item: newItem,
            }
            
            result.push(sale);
          })
        );
        
        return result;
    } catch (error) {
        console.error("Error fetching NFT:", error);
        return null;
    }
}

export { getSaleList };