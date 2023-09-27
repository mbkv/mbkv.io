---
title: "Parse CSS and System colors without a package"
description: "CSS colors are pretty difficult to parse, but there's actually a neat browser hack that makes it much easier"
date: "2023-09-27"
updated: "2023-09-27"
---

Recently I've been designing my website. I gave myself several requirements, 1
of which is absolutely no non-trivial runtime JavaScript that's not written by
me. As a proof of concept of my website I decided to use [custom
elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
to simulate some runtime behavior with the canvas. The idea was a simple
lerpColor between all of the colors on the current theme being used. The problem
is CSS colors can be in a very wide range or formats. Assuming I wanted the
ability to modify my styles without breaking javascript I'd have to support
parsing basically the entire standard

## Small intro to CSS \<color>

CSS colors and be of the format:

```css
/* named colors */
color: red;

/* different types of hex */
color: #123;
color: #1234;
color: #123456;
color: #12345678;

/* rgb() values */
color: rgb(11, 22, 33);
color: rgb(11, 22, 33, 0.44);
color: rgba(11, 22, 33, 0.44);
color: rgb(11 22 33);
color: rgb(11 22 33 / 0.44);
color: rgba(11 22 33 / 0.44);
color: rgb(11 22 33 / 44%);
color: rgba(11 22 33 / 44%);
```

If defining a list of all the named colors didn't scare you off, defining a
sufficiently advanced parser should. This isn't even considering hsl, hsla, hwb, lab
potentially even future formats that we don't even know about yet. The package
"color-convert" did it in about 850 lines, wow! Something

## Force the browser to parse css colors for you

There's actually a much easier way of doing it that I don't think anyone really
knows about as it wasn't mentioned anywhere when I tried to look it up.
_Assuming_ you are on the canvas, you can actually use a hidden feature of
"fillStyle"

```typescript
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "hsl(0deg, 100%, 50%)";
console.log(ctx.fillStyle); // #ff0000
ctx.fillStyle = "hsl(0deg, 100%, 50%, 50%)";
console.log(ctx.fillStyle); // rgba(255, 0, 0, 0.5)

// It even works with system colors!!!
ctx.fillStyle = "GrayText";
console.log(ctx.fillStyle); // #808080 on my system
```

We've successfully converted the majority of CSS colors into 2 very basic
formats. You might be thinking that this is a bug or browser dependent. But this
is [actually defined in the
standard](https://html.spec.whatwg.org/multipage/canvas.html#serialisation-of-a-color)
to always return a "serialized output". What that means is if the color is part
of the sRGB color space, _this method will guarantee to return either a hex code
or a rgba color_

Now that we have a very strict set of values that we need to parse. All of the
logic we need to write becomes very minimal

```typescript
ctx.fillStyle = some_variable

const color = getRgbaFromSerialized(ctx.fillStyle)

function getRgbaFromSerialized(serialized) {
  const formatted = ctx.fillStyle;
  const hexRegex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
  const rgbaRegex = /^rgba\((\d+), (\d+), (\d+), (\d+\.\d+)\)$/i

  const hexMatch = formatted.match(hexRegex);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
      a: 1,
    }
  }

  const rgbaMatch = formatted.match(rgbaRegex);

  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1])
      g: Number(rgbaMatch[2])
      b: Number(rgbaMatch[3])
      a: Number(rgbaMatch[4])
    }
  }

  // the color was _not_ part of the sRGB color space.
  return null;
}

```

### Limitations:

- Needs to be in sRGB color space to get RGB (duh)

- As always, prefer a pure CSS solution to JavaScript. No matter what you do a
  CSS solution will always be faster

- Assuming you cannot get away with CSS, you should probably only use this if
  this feature relies on canvas. I don't know what happens with fingerprinting
  protections
