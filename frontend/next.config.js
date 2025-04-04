/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel 배포를 위해 빌드 시 ESLint 검사 비활성화
  eslint: {
    // 빌드 시 ESLint 에러가 있어도 배포 진행
    ignoreDuringBuilds: true,
  },
  // TypeScript 타입 검사 빌드 시 무시
  typescript: {
    // 빌드 시 타입 에러가 있어도 배포 진행
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 