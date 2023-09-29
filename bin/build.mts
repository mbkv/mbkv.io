import less from "less";
import chokidar from "chokidar";
import mustache from "mustache";
import { minify as _minifyHtml } from "html-minifier-terser";
import { Marked, Renderer } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import frontMatter from "front-matter";
import path from "path";
import fsSync from "fs";
import fs from "fs/promises";
import { mkdirp } from "mkdirp";
import * as rollup from "rollup";
import { loadConfigFile } from "rollup/loadConfigFile";

const minifyHtml = (source: string) =>
  _minifyHtml(source, { collapseWhitespace: true, removeComments: true });

const readFile = (filename: string) => fs.readFile(filename, { encoding: "utf-8" });

const rootDir = fsSync.realpathSync(
  path.join(path.dirname(process.argv[1]), "..")
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
  return fs.writeFile(path.join(publicDir, "styles.css"), built.css);
}

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);
const renderer = new Renderer();
renderer.paragraph = (text) => {
  if (text.startsWith("<")) {
    // probably a html tag
    return text;
  }
  return `<p>${text}</p>`;
};
marked.use({ renderer });

async function buildSite() {
  const [pageTemplate, postTemplate, sitemapXmlTemplate, siteFiles] = await Promise.all([
    readFile(baseHtmlEntrypoint).then((base) => minifyHtml(base)),
    readFile(markdownHtmlEntrypoint).then((base) => minifyHtml(base)),
    readFile(sitemapXmlEntrypoint).then((base) => minifyHtml(base)),
    fs.readdir(markdownDir),
  ]);

  const buildAsMarkdown = async (filename: string) => {
    const { attributes, fragment, html } = await (async () => {
      const markdown = await readFile(filename);
      const { attributes, body } = (frontMatter as any)(markdown);
      let fragment = await marked.parse(body);
      fragment = await minifyHtml(fragment);
      fragment = mustache.render(postTemplate, {
        ...attributes,
        content: fragment,
        routerProps: JSON.stringify(attributes),
      });
      console.assert(attributes.title, "Each document must have a title!");
      console.assert(
        attributes.description,
        "Each document must have a description!"
      );

      const html = mustache.render(pageTemplate, {
        ...attributes,
        content: fragment,
      });

      return { fragment, html, attributes };
    })();

    if (attributes.date && Number.isNaN(+new Date(attributes.date))) {
      console.error(`${filename}: Invalid date ${attributes.date}`);
      return;
    }

    const normalizeUrl = (url: string) => {
      if (url.endsWith(".html")) {
        url = url.slice(0, url.length - ".html".length);
      }
      if (url.match(/[/\\]index$/)) {
        url = url.slice(0, url.length - "/index".length);
      }
      if (url.endsWith("/")) {
        url.slice(0, url.length - "/".length);
      }
      return url;
    };

    // the url the user sees
    let url: string;
    // the FULL directory that stores all the HTML files. each article has its
    // own directory
    let directory: string;

    const htmlBasename = path.basename(filename, ".md");
    if (attributes.url) {
      url = normalizeUrl(attributes.url);
      directory = path.join(publicDir, url);
    } else if (attributes.date) {
      const datePath = attributes.date.replace(/-/g, "/");
      url = "/" + datePath + "/" + htmlBasename;
      directory = path.join(publicDir, datePath, htmlBasename);
    } else {
      url = "/" + htmlBasename;
      directory = path.join(publicDir, htmlBasename);
    }

    await mkdirp(directory);

    await Promise.all([
      fs.writeFile(path.join(directory, "index.html"), html),
      fs.writeFile(path.join(directory, "_.html"), fragment),
    ]);

    return {
      path: normalizeUrl(url),
      lastModified: attributes.updated ?? attributes.date,
    };
  };

  const renderedPages: ({ path: string, lastModified: string })[] = [];

  for (const filename of siteFiles) {
    if (!filename.endsWith(".md")) {
      continue;
    }
    const fullpath = path.join(markdownDir, filename);
    const result = await buildAsMarkdown(fullpath)
    if (result) {
      renderedPages.push(result);
    }
  }

  const sitemapFile = mustache.render(sitemapXmlTemplate, { pages: renderedPages });
  fs.writeFile(path.join(publicDir, "sitemap.xml"), sitemapFile);
}

async function buildJavascript() {
  const { options, warnings } = await loadConfigFile(path.resolve(rootDir, 'rollup.config.js'), {
    format: 'es'
  });

  warnings.flush();

  for (const optionsObj of options) {
    const bundle = await rollup.rollup(optionsObj);
    await Promise.all(optionsObj.output.map(bundle.write));
  }
  rollup.watch(options)
}

async function watchJavascript() {
  const { options, warnings } = await loadConfigFile(path.resolve(rootDir, 'rollup.config.js'), {
    format: 'es'
  });

  warnings.flush();

  const watcher = rollup.watch(options)
  watcher.on('event', event => {
    if (event.code === 'BUNDLE_END') {
      console.log(`Built in: ${event.duration}ms (${event.input})`)
    }
  })

}

async function build(javascript: boolean) {
  console.time("built site in");
  try {
    const promises = [buildLess(), buildSite()];
    if (javascript) {
      promises.push(buildJavascript());
    }
    await Promise.all(promises);
  } catch (e) {
    console.error(e);
  } finally {
    console.timeEnd("built site in");
  }
}

const isWatch = process.argv.some((arg) => arg === "--watch");

if (isWatch) {
  watchJavascript();
  chokidar
    .watch(["./styles", "./markdown"], { ignoreInitial: true })
    .on("all", () => {
      console.log("running");
      build(false);
    });
  build(false);
} else {
  build(true);
}
