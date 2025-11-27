import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  distDir: "out",
  basePath: "/obsidian-public",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default withMDX(config);
