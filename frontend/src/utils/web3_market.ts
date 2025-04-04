import { ethers } from "ethers";
import CONTRACT_ABI from "./abis/MarketPlace.json";
import {Item} from "../store/types";

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

async function getContract() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer); 
}

async function getSaleList() {
    const contract = await getContract();

    try {
        const saleList = await contract.getAllListings();
        Object.values(saleList).map(value => console.log(value));
        
        return saleList;
    } catch (error) {
        console.error("Error fetching NFT:", error);
        return null;
    }
}

export { getSaleList };