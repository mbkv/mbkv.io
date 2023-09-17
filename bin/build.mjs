import less from "less";
import chokidar from "chokidar";
import mustache from "mustache";
import { minify as _minifyHtml } from "html-minifier-terser";
import { minify as minifyJS } from "terser";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import frontMatter from "front-matter";
import path from "path";
import fsSync from "fs";
import fs from "fs/promises";
import { mkdirp } from "mkdirp";

const minifyHtml = (source) =>
  _minifyHtml(source, { collapseWhitespace: true, removeComments: true });

const readFile = (filename) => fs.readFile(filename, { encoding: "utf-8" });

const rootDir = fsSync.realpathSync(
  path.join(path.dirname(process.argv[1]), ".."),
);
const publicDir = path.join(rootDir, "public");
const markdownDir = path.join(rootDir, "markdown");
const baseHtmlEntrypoint = path.join(markdownDir, "base.html");
const markdownHtmlEntrypoint = path.join(markdownDir, "markdown.html");
const sitemapXmlEntrypoint = path.join(markdownDir, "sitemap.xml");
const styleEntrypoint = path.join(rootDir, "styles", "styles.less");

async function buildLess() {
  const file = await readFile(styleEntrypoint);
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
  const [styles, baseHtml, markdownHtml, sitemapXml, siteFiles] =
    await Promise.all([
      buildLess(),
      readFile(baseHtmlEntrypoint).then((base) => minifyHtml(base)),
      readFile(markdownHtmlEntrypoint).then((base) => minifyHtml(base)),
      readFile(sitemapXmlEntrypoint).then((base) => minifyHtml(base)),
      fs.readdir(markdownDir),
    ]);

  const buildAsMarkdown = async (filename) => {
    const markdown = await readFile(filename);
    const { attributes, body } = frontMatter(markdown);
    let renderedMarkdown = marked.parse(body);
    renderedMarkdown = await minifyHtml(renderedMarkdown);
    renderedMarkdown = mustache.render(markdownHtml, {
      ...attributes,
      content: renderedMarkdown,
      routerProps: JSON.stringify(attributes),
    });
    console.assert(attributes.title, "Each document must have a title!");
    console.assert(
      attributes.description,
      "Each document must have a description!",
    );

    const rendered = mustache.render(baseHtml, {
      ...attributes,
      styles,
      content: renderedMarkdown,
    });
    const htmlBasename = path.basename(filename, ".md");
    if (attributes.date && isNaN(new Date(attributes.date))) {
      console.error(`${filename}: Invalid date ${attributes.date}`);
      return;
    }

    const normalizeUrl = (url) => {
      if (url.endsWith('/index.html') || url.endsWith('\\index.html')) {
        url = url.slice(0, url.length - '/index.html'.length);
      }
      if (url.endsWith('.html')) {
        url = url.slice(0, url.length - '.html'.length);
      }
      if (url.endsWith('/')) {
        url.slice(0, url.length - '/'.length);
      }
      return url;
    }

    // the url the user sees
    let url;
    // the FULL directory that stores all the HTML files. each article has its
    // own directory
    let directory

    if (attributes.url) {
      url = normalizeUrl(attributes.url);
      directory = path.join(publicDir, url);
    } else if (attributes.date) {
      const datePath = attributes.date.replace(/-/g, '/');
      url = "/" + datePath + "/" + htmlBasename;
      directory = path.join(publicDir, datePath, htmlBasename);
    } else {
      url = "/" + htmlBasename;
      directory = path.join(publicDir, htmlBasename);
    }

    await mkdirp(directory)

    fs.writeFile(path.join(directory, 'index.html'), rendered);
    fs.writeFile(path.join(directory, '_.html'), renderedMarkdown);

    return {
      path: normalizeUrl(url),
      lastModified: attributes.updated ?? attributes.date,
    };
  };

  const buildAsJavascript = async (filename) => {
    const file = await readFile(filename);
    const basename = path.basename(filename);
    const minified = await minifyJS(
      { [basename]: file },
      {
        // module: true,
        sourceMap: {
          includeSources: true,
          url: basename + ".map",
        },
      },
    );
    await Promise.all([
      fs.writeFile(path.join(publicDir, basename), minified.code),
      fs.writeFile(path.join(publicDir, basename + ".map"), minified.map),
    ]);
  };

  const renderedPages = [];

  for (const filename of siteFiles) {
    const fullpath = path.join(markdownDir, filename);
    if (filename.endsWith(".md")) {
      renderedPages.push(await buildAsMarkdown(fullpath));
    } else if (filename.endsWith(".js")) {
      await buildAsJavascript(fullpath);
    }
  }

  const sitemapFile = mustache.render(sitemapXml, { pages: renderedPages });
  fs.writeFile(path.join(publicDir, "sitemap.xml"), sitemapFile);
}

async function build() {
  console.time("built site in");
  try {
    await buildSite();
  } catch (e) {
    console.error(e);
  } finally {
    console.timeEnd("built site in");
  }
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
