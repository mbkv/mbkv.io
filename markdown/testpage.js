/**
 * lerp
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
const lerp = (a, b, t) => {
  return a + t * (b - a);
};

/**
 * @param {string} hex
 */
const parseHexColor = (hex) => ({
  r: parseInt(hex.substring(1, 3), 16),
  g: parseInt(hex.substring(3, 5), 16),
  b: parseInt(hex.substring(5, 7), 16),
});

/**
 * Lerp between two hex color values
 * @param {string} hex1
 * @param {string} hex2
 * @param {number} t
 */
const lerpColor = (hex1, hex2, t) => {
  const color1 = parseHexColor(hex1);
  const color2 = parseHexColor(hex2);

  const r = Math.floor(lerp(color1.r, color2.r, t)).toString(16).padStart(2, '0');
  const g = Math.floor(lerp(color1.g, color2.g, t)).toString(16).padStart(2, '0');
  const b = Math.floor(lerp(color1.b, color2.b, t)).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
};

class CustomCanvasElement extends HTMLCanvasElement {
  themeNames = [
    "--theme-red",
    "--theme-orange",
    "--theme-green",
    "--theme-cyan",
    "--theme-blue",
    "--theme-purple",
  ];

  time = 0;

  constructor() {
    super();

    this.resizeHandler = this.resizeHandler.bind(this);
    this.rafLoop = this.rafLoop.bind(this);
    this.ctx = this.getContext("2d");
    this.blinkState = 0;
    this.computedStyles = window.getComputedStyle(this);
    this.rafLoopId = undefined;
  }

  connectedCallback() {
    this.resizeHandler();
    this.computedStyles = window.getComputedStyle(this);
    window.addEventListener("resize", this.resizeHandler);
    this.rafLoop();
  }
  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeHandler);
    cancelAnimationFrame(this.rafLoopId);
  }

  resizeHandler() {
    if (this.parentElement) {
      this.width = this.parentElement.clientWidth;
      this.height =
        Number(this.getAttribute("ratio")) * this.parentElement.clientWidth;
      this.draw();
    }
  }

  rafLoop() {
    this.rafLoopId = this.requestAnimationFrame(() => {
      this.time = performance.now() / 1000;
      this.draw();
      this.rafLoop();
    })
  }

  draw() {
    this.ctx.fillStyle = this.computedStyles.getPropertyValue("--theme-bg-2");
    this.ctx.fillRect(0, 0, this.width, this.height);

    let border = 50;
    let fontSize = 32;
    const text = "Hello from Canvas!";
    {
      this.ctx.textBaseline = "top";
      this.ctx.font = `${fontSize}px monospace`;
      const measured = this.ctx.measureText(text);
      const measuredWidth = border * 2 + measured.width;
      fontSize *= this.width / measuredWidth;
      border *= this.width / measuredWidth;
      this.ctx.font = `${fontSize}px monospace`;
    }
    {
      const scaled = this.time / 2;
      const index = Math.floor(scaled) % this.themeNames.length;
      const percentage = scaled - Math.floor(scaled);

      const raw1 = this.computedStyles.getPropertyValue(this.themeNames[index]);
      const raw2 = this.computedStyles.getPropertyValue(
        this.themeNames[(index + 1) % this.themeNames.length],
      );

      this.ctx.fillStyle = raw1;
      const hex1 = this.ctx.fillStyle;
      this.ctx.fillStyle = raw2;
      const hex2 = this.ctx.fillStyle;

      this.ctx.fillStyle = lerpColor(hex1, hex2, percentage);
    }
    this.ctx.fillText("Hello from Canvas!", border, border * 0.75);
  }
}

customElements.define("hello-world-canvas", CustomCanvasElement, {
  extends: "canvas",
});
