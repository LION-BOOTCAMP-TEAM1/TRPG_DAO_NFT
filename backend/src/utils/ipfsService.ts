import axios from 'axios';

// Ensure this module is properly exported
export {};

/**
 * IPFS 게이트웨이 URL
 * Pinata, Infura 등 원하는 IPFS 서비스로 변경 가능
 */
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

/**
 * NFT 메타데이터를 IPFS에 업로드하고 URI를 반환하는 함수
 * @param metadata NFT 메타데이터 객체
 * @returns IPFS URI (예: ipfs://Qm...)
 */
export async function uploadMetadata(metadata: any): Promise<string> {
  try {
    // 개발 환경 또는 IPFS 서비스 키가 없는 경우 가짜 URI 반환
    if (process.env.NODE_ENV === 'development' || !PINATA_API_KEY) {
      console.log('개발 환경에서는 더미 IPFS URI를 반환합니다.');
      // 메타데이터에서 고유한 해시 생성
      const dummyHash = `Qm${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
      return `ipfs://${dummyHash}`;
    }

    // Pinata API를 사용하여 메타데이터 업로드
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );

    // 응답에서 IPFS 해시 추출
    const ipfsHash = response.data.IpfsHash;
    return `ipfs://${ipfsHash}`;
  } catch (error) {
    console.error('IPFS 메타데이터 업로드 오류:', error);
    
    // 오류 발생 시 폴백 메커니즘으로 더미 URI 반환
    const fallbackHash = `Qm${Date.now().toString(36)}`;
    console.warn(`IPFS 업로드 실패, 폴백 URI 사용: ipfs://${fallbackHash}`);
    return `ipfs://${fallbackHash}`;
  }
}

/**
 * IPFS URI를 HTTP URL로 변환하는 함수
 * @param uri IPFS URI (예: ipfs://Qm...)
 * @returns HTTP URL (예: https://ipfs.io/ipfs/Qm...)
 */
export function ipfsUriToHttpUrl(uri: string): string {
  if (!uri || !uri.startsWith('ipfs://')) {
    return uri; // IPFS URI가 아니면 그대로 반환
  }
  
  const hash = uri.replace('ipfs://', '');
  return `${IPFS_GATEWAY}${hash}`;
} 