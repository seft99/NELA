import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "nelaCatalog",
  title: "Catálogo NELA Joyería",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "0l7ykvj6",
  dataset: process.env.SANITY_STUDIO_DATASET || "development",
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
