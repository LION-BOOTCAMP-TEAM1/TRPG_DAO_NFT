import { ethers } from "ethers";
import CONTRACT_ABI from "./abis/MarketPlace.json";
import {getContract, getIPFSFile} from "./web3";
import { Item, saleContent } from "@/store/types"

const CONTRACT_ADDRESS = "0xA3ee2e7ff521Ba77acEf9B80F6F7757386AE4779";

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
      console.log(saleList)
      await Promise.all(
        Object.values(saleList).map(async (value: any) => {
          const nftID = Number(value[2]);
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
            id: Number(value[0]),
            seller: value[1],
            nft_id: Number(value[2]),
            price: Number(value[3]),
            amount: Number(value[4]),
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

async function buyNFT(id: number, seller: String, amount: number, price: number) {
  const contract = await getMarketContract();
  
  try {
    const totalPrice = BigInt(price) * BigInt(amount);
    const tx = await contract.buy(id, amount, {
      value: totalPrice
    });

    // 영수증 기다리기..
    await tx.wait();
    return 1;
  } catch (error) {
      console.error("Error buy NFT:", error);
      if (error.code === 'INSUFFICIENT_FUNDS') {
        return 0;
      }
      return -1;
  }
}

async function setForSale(id: Number, amount: Number, price: string) {
  const contract = await getMarketContract();
  try {
    const saleList = await contract.setForSale(id, amount, ethers.parseEther(price));
    
    // 영수증 기다리기..
    await saleList.wait();

    return true;
  } catch (error) {
    console.error("Error set for sale:", error);
    return false;
  }
}

export { getSaleList, buyNFT, setForSale };