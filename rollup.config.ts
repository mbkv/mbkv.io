import * as path from "path";
import * as fs from "fs/promises";
import { RollupOptions } from "rollup";
import terser from "@rollup/plugin-terser";
import tsc from "rollup-plugin-typescript2";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const build_path = path.resolve(__dirname, "public");
const entrypoint_path = path.resolve(__dirname, "src", "entrypoints");

async function main(): Promise<RollupOptions[]> {
  const entrypoints = await fs.readdir(entrypoint_path);

  return entrypoints.map((entrypoint) => ({
    input: path.resolve(entrypoint_path, entrypoint),
    output: {
      file: path.resolve(build_path, path.basename(entrypoint, ".ts") + ".js"),
      format: "iife",
      name: entrypoint,
      plugins: [terser()],
      sourcemap: true,
    },
    plugins: [tsc({ "tsconfig": "./tsconfig.rollup.json" })],
  }));
}

export default main
