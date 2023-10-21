import * as path from "path";
import * as fs from "fs/promises";
import { InputPluginOption, RollupOptions } from "rollup";
import terser from "@rollup/plugin-terser";
import tsc from "@rollup/plugin-typescript";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const build_path = path.resolve(__dirname, "public");
const entrypoint_path = path.resolve(__dirname, "src", "entrypoints");

const shaderPlugin = (): InputPluginOption => ({
  name: "shaders",
  transform(code: string, id: string) {
    if (id.endsWith(".fs") || id.endsWith(".vs") || id.endsWith(".shader")) {
      return {
        code: `export default ${JSON.stringify(code)};`,
        map: { mappings: "" },
      };
    }
  },
});

async function main(): Promise<RollupOptions[]> {
  const entrypoints = await fs.readdir(entrypoint_path);

  const outputPromises = entrypoints.map(
    async (entrypoint): Promise<RollupOptions> => {
      let inputPath = path.resolve(entrypoint_path, entrypoint);
      const isDir = (await fs.stat(inputPath)).isDirectory();
      if (isDir) {
        inputPath = path.join(inputPath, "index.ts");
      }
      return {
        input: inputPath,
        output: {
          file: path.resolve(
            build_path,
            path.basename(entrypoint, ".ts") + ".js"
          ),
          format: "iife",
          plugins: [terser()],
          sourcemap: true,
        },
        plugins: [tsc({ tsconfig: "./tsconfig.rollup.json" }), shaderPlugin()],
      };
    }
  );

  const result = await Promise.all(outputPromises);

  return result;
}

export default main;
