import { defineConfig } from "astro/config";
import config from "./site.config.json" with { type: "json" };

const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = config.siteUrl || (vercel ? `https://${vercel}` : "http://localhost:4321");

export default defineConfig({
  site,
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "always" },
  compressHTML: true,
});
