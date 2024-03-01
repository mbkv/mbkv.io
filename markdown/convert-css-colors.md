---
title: "Parse CSS and System colors without a package"
description: "CSS colors are pretty difficult to parse, but there's actually a neat browser hack that makes it much easier"
date: "2023-09-27"
updated: "2024-03-01"
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

First off defining all the named colors itself will balloon my javascript bundle
size which is unacceptable. But this isn't even considering hsl, hsla, hwb, lab,
some of which don't even translate well to sRGB color space. Defining a
sufficiently advanced parser and converter to get through all this is far more
work than I'm willing to put in my free time (the package "color-convert" did
converting in about [850
lines](https://github.com/Qix-/color-convert/blob/master/conversions.js) and the
package "color-string" did it in [129
lines](https://github.com/Qix-/color-string/blob/master/index.js#L46-L175),
wow!)

## Force the browser to parse css colors for you

There's actually a much easier way of doing it that I don't think anyone really
knows about as it wasn't mentioned anywhere when I tried to look it up. The
browser actually leaks its database of named colors and color parsing in its
_canvas_ API

```typescript
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "hsl(0deg, 100%, 50%)";
console.log(ctx.fillStyle); // #ff0000
ctx.fillStyle = "hsl(0deg, 100%, 50%, 50%)";
console.log(ctx.fillStyle); // rgba(255, 0, 0, 0.5)

// It even works with system colors!!!
ctx.fillStyle = "VisitedText";
console.log(ctx.fillStyle); // #551a8b on my system
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
function getRgbaFromSerialized(serialized) {
  const hexRegex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
  const rgbaRegex = /^rgba\((\d+), (\d+), (\d+), (\d+\.\d+)\)$/i;

  const hexMatch = serialized.match(hexRegex);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
      a: 1,
    };
  }

  const rgbaMatch = serialized.match(rgbaRegex);

  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
      a: Number(rgbaMatch[4]),
    };
  }

  // the color was _not_ part of the sRGB color space.
  return null;
}
```

If You do need to parse something that's not in the sRBG color space, like
[LAB](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lab),
[LCH](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/lch),
[Oklab](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklab), and
[Oklch](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch).
Well you're in luck! The same trick does work for for those color spaces to
[_normalize_](https://drafts.csswg.org/css-color-4/#serializing-lab-lch) the
colors. It doesn't actually convert them to a different color space but it makes
it a lot easier to parse by keeping all the values consistently one type! In
fact, all of the different color spaces at that point actually look the same.
You can trivially make a regular expression for all of the color spaces

Edit 3/1/2024:

I got excited briefly when I realized [CSSStyleDeclaration
API](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration) has
very similar effects. The CSS Style Declaration (aka
[HTMLElement.prototype.style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style))
lets you get and set colors. If we assign a color to this element and then query
it back, this will trigger the browser to serialize the color and give it back
to us. But it's actually has a completely different implementation to canvas and
ignores some values. [All this is still part of the
standard](https://drafts.csswg.org/css-color-4/#resolving-color-values)

```typescript
function formatColor(anyColorString) {
  formatColor.element.style.color = anyColorString;
  return formatColor.element.style.color;
}
formatColor.element = document.createElement("div");

console.log(formatColor("rgb(255 255 0)")); // rgb(255, 255, 0)
console.log(formatColor("hsl(0deg, 100%, 50%)")); // rgb(255, 0, 0)
console.log(formatColor("hsl(0deg, 100%, 50%, 50%)")); // rgba(255, 0, 0, 0.5)
console.log(formatColor("red")); // "red"... drat!
```

It literally only ignores named colors. So if you can tolerate squeezing down
what values you can accept, this will be much preferable as relying on canvas
(which can be disabled) isn't the best of solutions

### Limitations:

- Needs to be in sRGB color space to get RGB (duh). More work to get everything
  else (but not by much)

- As always, prefer [a pure CSS
  solution](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
  to running JavaScript. No matter what you do a CSS solution will always be faster

- Assuming you cannot get away with CSS, you should probably only use this if
  this feature relies on canvas. I don't know what happens with fingerprinting
  protections
