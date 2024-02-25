// ==UserScript==
// @name        Auto dark mode
// @author      Michael Bitokhov
// @description Detect when a site does not have a dark theme, and give it one.
// @namespace   https://mbkv.io
// @version     1.0
// @license     MIT
// @grant       none
// @sandbox     dom
// @run-at      document-end
// @noframes
// ==/UserScript==

const id = () => Math.random().toString(36).substring(2);
const className = "t_" + id() + id();

(function addClassName() {
  const style = document.createElement("style");
  style.innerText = `.${className} {
  filter: invert(1) hue-rotate(180deg);
  background-color: white;

  img, video, iframe {
    filter: invert(1) hue-rotate(180deg);
    background-color: white;
  }
}`;
  document.head.append(style);
})();
function enableDarkMode() {
  document.documentElement.classList.add(className);
}
function disableDarkMode() {
  document.documentElement.classList.remove(className);
}

function pageIsDarkMode() {
  function countDarkText(element, parentColor) {
    const styles = getComputedStyle(element);
    if (styles.display === "none") {
      return;
    }
    const rgba = getRgbaFromSerialized(styles.backgroundColor);
    const lerp = (t, a, b) => a + (b - a) * t;
    let thisColor = undefined;
    if (parentColor) {
      thisColor = {
        r: lerp(rgba.a, parentColor.r, rgba.r),
        g: lerp(rgba.a, parentColor.g, rgba.g),
        b: lerp(rgba.a, parentColor.b, rgba.b),
        a: 1,
      };
    } else if (rgba.a === 0) {
      thisColor = {
        r: 255,
        g: 255,
        b: 255,
        a: 1,
      };
    } else {
      thisColor = rgba;
    }
    const thisIsDark = isColorDark(thisColor);
    const numberOfCharacters = [...element.childNodes].reduce((a, b) => {
      if (b instanceof Text) {
        const text = b.textContent?.replace(/\s+/g, "") || "";
        return a + text.length;
      }
      return a;
    }, 0);

    const colors = {
      light: 0,
      dark: 0,
    };
    if (thisIsDark) {
      colors.dark = numberOfCharacters;
    } else {
      colors.light = numberOfCharacters;
    }

    for (const child of element.children) {
      const childTextColors = countDarkText(child, thisColor);
      if (!childTextColors) {
        continue;
      }
      colors.light += childTextColors.light;
      colors.dark += childTextColors.dark;

      if (colors.light + colors.dark > 1000) {
        return colors;
      }
    }
    return colors;
  }
  const textColors = countDarkText(document.body);
  return textColors.dark > textColors.light;
}
function isColorDark(rgb) {
  const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  return luminance < 128;
}
function getRgbaFromSerialized(formatted) {
  const rgbRegex = /^rgb\(([\d+\.]+), ([\d+\.]+), ([\d+\.]+)\)$/i;
  const rgbaRegex = /^rgba\(([\d+\.]+), ([\d+\.]+), ([\d+\.]+), ([\d+\.]+)\)$/i;
  const rgbMatch = formatted.match(rgbRegex);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: 1,
    };
  }
  const rgbaMatch = formatted.match(rgbaRegex);
  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
      a: Number(rgbaMatch[4]),
    };
  }
  return null;
}
(async () => {
  function run() {
    const pageIsDark = pageIsDarkMode();
    if (pageIsDark) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  }
  run();

  let start = performance.now();
  while (performance.now() - start < 1000) {
    await new Promise((resolve) =>
      requestAnimationFrame(() => {
        run();
        resolve();
      })
    );
  }
  while (performance.now() - start < 5000) {
    await new Promise((resolve) =>
      setTimeout(() => {
        run();
        resolve();
      }, 100)
    );
  }
})();
