import less from "less";
import chokidar from "chokidar";
import mustache from "mustache";
import { minify as minifyHtml } from "html-minifier-terser";
import { minify as minifyJS } from 'terser';
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import frontMatter from "front-matter";
import path from "path";
import fsSync from "fs";
import fs from "fs/promises";

const rootDir = fsSync.realpathSync(
  path.join(path.dirname(process.argv[1]), ".."),
);
const publicDir = path.join(rootDir, "public");
const markdownDir = path.join(rootDir, "markdown");
const baseHtmlEntrypoint = path.join(markdownDir, "base.html");
const styleEntrypoint = path.join(rootDir, "styles", "styles.less");

async function buildLess() {
  const file = await fs.readFile(styleEntrypoint, { encoding: "utf-8" });
  const built = await less.render(file, {
    filename: path.basename(styleEntrypoint),
    paths: [path.dirname(styleEntrypoint)],
    compress: true,
  });
  return built.css;
}

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

async function buildSite() {
  const [styles, baseHtml, siteFiles] = await Promise.all([
    buildLess(),
    fs.readFile(baseHtmlEntrypoint, { encoding: "utf-8" }),
    fs.readdir(markdownDir),
  ]);

  const buildAsMarkdown = async (filename) => {
    const markdown = await fs.readFile(filename, {
      encoding: "utf-8",
    });
    const metadata = frontMatter(markdown);
    const renderedMarkdown = marked.parse(metadata.body);
    console.assert(
      metadata.attributes.title,
      "Each document must have a title!",
    );
    console.assert(
      metadata.attributes.description,
      "Each document must have a description!",
    );
    const rendered = mustache.render(baseHtml, {
      title: metadata.attributes.title,
      description: metadata.attributes.description,
      styles,
      content: renderedMarkdown,
    });
    const minified = await minifyHtml(rendered, {
      collapseWhitespace: true,
      removeComments: true,
    });
    fs.writeFile(
      path.join(publicDir, path.basename(filename, ".md") + ".html"),
      minified,
    );
  }

  const buildAsJavascript = async (filename) => {
    const file = await fs.readFile(filename, { encoding: 'utf-8' })
    const minified = await minifyJS(file)
    await fs.writeFile(
      path.join(publicDir, path.basename(filename)),
      minified.code,
    )
  }

  for (const filename of siteFiles) {
    const fullpath = path.join(markdownDir, filename)
    if (filename.endsWith(".md")) {
      await buildAsMarkdown(fullpath);
    } else if (filename.endsWith('.js')) {
      await buildAsJavascript(fullpath);
    }
  }

}

async function build() {
  await buildSite().catch(err => console.error(err));
}

const isWatch = process.argv.some((arg) => arg === "--watch");

if (isWatch) {
  chokidar
    .watch(["./styles", "./markdown"], { ignoreInitial: true })
    .on("all", () => {
      console.log("running");
      build();
    });
  build();
} else {
  build();
}
