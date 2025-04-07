declare module '../utils/ipfsService' {
  export function uploadMetadata(metadata: any): Promise<string>;
  export function ipfsUriToHttpUrl(uri: string): string;
} 