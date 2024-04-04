import { lerpColor } from "../utils";

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

  ctx = this.getContext("2d");

  computedStyle = window.getComputedStyle(this);

  rafLoopId: ReturnType<typeof requestAnimationFrame> | undefined;

  constructor() {
    super();

    this.resizeHandler = this.resizeHandler.bind(this);
    this.rafLoop = this.rafLoop.bind(this);
  }

  connectedCallback() {
    this.resizeHandler();
    this.computedStyle = window.getComputedStyle(this);
    window.addEventListener("resize", this.resizeHandler);
    this.rafLoop();
  }
  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeHandler);
    if (this.rafLoopId) {
      cancelAnimationFrame(this.rafLoopId);
    }
  }

  resizeHandler() {
    if (this.parentElement) {
      this.width = this.parentElement.clientWidth;
      this.height = Number(this.getAttribute("ratio")) * this.parentElement.clientWidth;
    }
  }

  rafLoop() {
    this.rafLoopId = window.requestAnimationFrame(() => {
      this.time = performance.now() / 1000;
      this.draw();
      this.rafLoop();
    });
  }

  draw() {
    if (!this.ctx) {
      return;
    }
    this.ctx.fillStyle = this.computedStyle.getPropertyValue("--theme-bg-2");
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

      const raw1 = this.computedStyle.getPropertyValue(this.themeNames[index]);
      const raw2 = this.computedStyle.getPropertyValue(
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
