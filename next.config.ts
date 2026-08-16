import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const isLamppExport = process.env.LAMPP_EXPORT === "1";

const nextConfig: NextConfig = isLamppExport
  ? {
      output: "export",
      basePath: "/bichimeca",
      trailingSlash: true,
    }
  : {
      async headers() {
        return [
          {
            source: "/(.*)",
            headers: securityHeaders,
          },
        ];
      },
    };

export default nextConfig;
