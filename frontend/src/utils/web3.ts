import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x6a25a7a2627f37A6fF4C2e4c490F290309d0B561"; 
import CONTRACT_ABI from "./abis/GameItem.json";
const provider = new ethers.BrowserProvider((window as any).ethereum);

async function getSigner() {
    return await provider.getSigner();
}

async function getContract() {
    const signer = await getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer); 
}

async function getNFTList() {
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
        console.log(myNFTids, myNFTamounts)
        
    } catch (error) {
        console.error("Error fetching NFT:", error);
        return null;
    }
}

export { getNFTList };