import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 다른 dev 서버(.next 잠금)와 충돌 없이 별도 인스턴스(E2E 등)를 띄울 수 있도록 예약.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
