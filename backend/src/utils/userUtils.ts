/**
 * 월렛 주소에서 친숙한 사용자 ID를 생성합니다
 * @param walletAddress 사용자의 지갑 주소
 * @returns 친숙한 형태의 사용자 ID
 */
export function createFriendlyUserId(walletAddress: string): string {
  // 지갑 주소를 소문자로 변환
  const address = walletAddress.toLowerCase();
  
  // 앞 4자리와 뒤 4자리를 추출하여 결합
  const prefix = address.substring(0, 4);
  const suffix = address.substring(address.length - 4);
  
  return `${prefix}${suffix}`;
} 