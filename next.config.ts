import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: [],
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/:path*`,
            },
        ];
    },
    httpAgentOptions: {
        keepAlive: true,
    },
    experimental: {
        proxyTimeout: 180_000,
    },
};

export default nextConfig;

