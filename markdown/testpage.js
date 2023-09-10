class CustomCanvasElement extends HTMLCanvasElement {
  constructor() {
    super();

    this.resizeHandler = this.resizeHandler.bind(this);
    this.ctx = this.getContext("2d");
    this.resizeHandler();
  }

  connectedCallback() {
    window.addEventListener("resize", this.resizeHandler)
    this.draw();
  }
  disconnectedCallback() {
    window.removeEventListener("resize", this.resizeHandler)
  }

  resizeHandler() {
    if (this.parentElement) {
      this.width = this.parentElement.clientWidth
      this.height = Number(this.getAttribute('ratio')) * this.parentElement.clientWidth;
      this.draw();
    }
  }

  draw() {
    const styles = this.computedStyleMap()
    const outerBorder = 16;
    this.ctx.fillStyle = styles.get('--theme-bg-2');
    this.ctx.fillRect(outerBorder, outerBorder, (this.width - outerBorder * 2), (this.height - outerBorder * 2))
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = styles.get('--theme-green');
    this.ctx.font = `32px monospace`
    this.ctx.fillText("Hello from Canvas!", outerBorder * 2, outerBorder * 2)
  }
}

customElements.define("hello-world-canvas", CustomCanvasElement, { extends: "canvas" })
