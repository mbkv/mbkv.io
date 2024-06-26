import { h } from "../dom";
import { clamp, lerpColor } from "../utils";

const css = `
.wrapper {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-rows: max-content 1fr max-content max-content;
  grid-template-columns: 1fr;
  row-gap: 1em;
}
.container {
  position: relative;
}
.audio {
  width: 100%;
}
.canvas {
  position: absolute;
}
.sponsor {
  margin-left:1em;
}
form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.sample {
  margin-left: auto;
}
`;
const darken = (color: string, percentage: number) => {
  return lerpColor(color, "#000000", percentage);
};

const MIN_DB = -120;
const MAX_DB = 0;

let audioContext;

class AudioVisualizer extends HTMLElement {
  name: HTMLDivElement;

  canvas: HTMLCanvasElement;

  canvasContainer: HTMLDivElement;

  ctx: CanvasRenderingContext2D | null;

  audio: HTMLAudioElement;

  computedStyles = window.getComputedStyle(this);

  resizeObserver: ResizeObserver | undefined;

  analyser: AnalyserNode | undefined;

  frequencyBin: Uint8Array | undefined;

  frequencies: number[] | undefined;

  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.audio = h("audio", {
      controls: true,
      className: "audio",
    });
    this.canvas = h("canvas", {
      className: "canvas",
      onclick: () => {
        if (this.audio.paused) {
          this.audio.play();
        } else {
          this.audio.pause();
        }
      },
    });
    this.canvasContainer = h("div", { className: "container" }, this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.name = h("div");
    const wrapper = h(
      "div",
      { className: "wrapper" },
      this.name,
      this.canvasContainer,
      this.audio,
      h(
        "form",
        {
          onsubmit(e: SubmitEvent) {
            e.preventDefault();
          },
        },
        h("input", {
          type: "file",
          oninput: this.onFileUpload.bind(this),
          accept: "audio/*",
        }),
        h("button", {
          type: "button",
          className: "sample",
          textContent: "Try a sample!",
          onclick: this.sample.bind(this),
        }),
      ),
    );
    const globalStyles = h("link", { rel: "stylesheet", href: "/styles.css" });
    const styles = h("style", { textContent: css });

    this.computedStyles = window.getComputedStyle(this);

    this.shadowRoot!.append(wrapper, globalStyles, styles);
  }

  connectedCallback() {
    this.canvas.width = this.canvasContainer.clientWidth;
    this.canvas.height = this.canvasContainer.clientHeight;
    this.computedStyles = window.getComputedStyle(this);
    this.setPageSizeDependentVariables();

    this.resizeObserver = new ResizeObserver(() => {
      this.canvas.width = this.canvasContainer.clientWidth;
      this.canvas.height = this.canvasContainer.clientHeight;
      this.setPageSizeDependentVariables();
      this.render();
    });
    this.resizeObserver.observe(this.canvasContainer);
  }

  disconnectedCallback() {
    this.resizeObserver!.disconnect();
  }

  onFileUpload({ currentTarget }) {
    this.audio.innerHTML = "";
    if (currentTarget.files.length) {
      if (this.audio.src) {
        URL.revokeObjectURL(this.audio.src);
      }

      this.name.textContent = currentTarget.files[0].name;
      this.audio.src = URL.createObjectURL(currentTarget.files[0]);
      this.audio.play();
      this.setupRenderLoop();
    }
  }

  sample() {
    this.name.textContent = "Odyssey - Tatermaou";
    this.name.append(
      h("a", {
        className: "sponsor",
        href: "https://open.spotify.com/artist/1DHRvWhGHEeX0aJhlZ8pDg?si=pYuVGdnzQb-EVzqzVOOhQQ",
        textContent: "Follow him on Spotify!",
      }),
    );
    if (this.audio.src) {
      URL.revokeObjectURL(this.audio.src);
      this.audio.src = "";
    }
    this.audio.append(
      h("source", { type: "audio/ogg", src: "/odyssey - tatermaou.opus" }),
      h("source", { type: "audio/mp3", src: "/odyssey - tatermaou.mp3" }),
    );
    this.audio.play();
    this.setupRenderLoop();
  }

  loopRunning = false;
  audioContextInitted = false;

  setupRenderLoop() {
    if (!this.audioContextInitted || !audioContext) {
      this.audioContextInitted = true;
      audioContext = new AudioContext();
      const source = new MediaElementAudioSourceNode(audioContext, {
        mediaElement: this.audio,
      });
      this.analyser = new AnalyserNode(audioContext, {
        fftSize: 32768,
        minDecibels: -120,
        maxDecibels: 0,
        smoothingTimeConstant: 0,
      });
      source.connect(this.analyser);
      this.analyser.connect(audioContext.destination);

      this.frequencyBin = new Uint8Array(this.analyser.frequencyBinCount);
      const frequencyPerBin = audioContext.sampleRate / 2 / this.analyser.frequencyBinCount;
      this.frequencies = Array(this.frequencyBin.length);
      for (let i = 0; i < this.frequencies.length; i++) {
        this.frequencies[i] = i + 1 * frequencyPerBin;
      }
      this.setPageSizeDependentVariables();
    }

    if (!this.loopRunning) {
      this.loopRunning = true;
      this.loop();
    }
  }
  pageSizeVariables: any;

  setPageSizeDependentVariables() {
    if (!this.pageSizeVariables) {
      this.pageSizeVariables = {};
    }
    const vars = this.pageSizeVariables;

    vars.drawMediumText = this.canvas.width > 1000;
    vars.drawText = this.canvas.width > 425;
    vars.drawMediumMarks = vars.drawMediumText;

    const plot = (vars.plot = (() => {
      const startValue = 20;
      const endValue = 20000;
      const startX = Math.log10(startValue);
      const endX = Math.log10(endValue);
      const plotSize = {
        startValue,
        endValue,
        startX: startX,
        endX: endX,
        diffX: endX - startX,
      };
      const leftPadding = 32;
      const bottomPadding = vars.drawText ? 32 : 0;
      return {
        ...plotSize,
        leftPadding,
        bottomPadding,
        left: leftPadding,
        right: this.canvas.width,
        width: this.canvas.width - leftPadding,
        top: 0,
        bottom: bottomPadding,
        height: this.canvas.height - bottomPadding,
      };
    })());

    const getXFromFrequency = (vars.getXFromFrequency = (freq) => {
      if (freq < plot.startValue || freq > plot.endValue) {
        return;
      }

      const x = ((Math.log10(freq) - plot.startX) / plot.diffX) * plot.width + plot.left;
      return clamp(x, plot.left, plot.right);
    });

    if (this.audioContextInitted && this.frequencies) {
      if (!vars.frequenciesToX) {
        vars.frequenciesToX = Array(this.frequencies.length);
      }

      const frequenciesToX = vars.frequenciesToX;
      if (this.audioContextInitted) {
        for (let i = 0; i < this.frequencies.length; i++) {
          frequenciesToX[i] = getXFromFrequency(this.frequencies[i]);
        }
      }

      const minBinPxs = 5;
      const logarithmicBins: any = (vars.logarithmicBins = []);
      let current: any = {
        startI: frequenciesToX.findIndex((value) => value != null),
        width: minBinPxs,
      };
      current.startPx = frequenciesToX[current.startI];
      for (let i = current.startI; i < frequenciesToX.length; i++) {
        const thisPx = frequenciesToX[i];
        if (thisPx - current.startPx > minBinPxs) {
          current.endI = i;
          logarithmicBins.push(current);
          current = {
            startI: i + 1,
            startPx: current.startPx + minBinPxs,
            width: minBinPxs,
          };
        }
      }
    }

    return;
  }

  loopId: ReturnType<typeof requestAnimationFrame> | undefined;

  loop() {
    if (this.loopId) {
      return;
    }
    this.loopId = window.requestAnimationFrame(() => {
      this.loopId = undefined;
      if (!this.isConnected) {
        this.loopRunning = false;
        return;
      }
      this.render();
      this.loop();
    });
  }

  cancelLoop() {
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
    }
    this.loopId = undefined;
  }

  render() {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    const themeText = this.computedStyles.getPropertyValue("--theme-text");
    const themeRed = this.computedStyles.getPropertyValue("--theme-red");

    const { getXFromFrequency, plot, drawText, drawMediumMarks, drawMediumText, logarithmicBins } =
      this.pageSizeVariables;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // helper
    const drawLine = (x1, y1, x2, y2) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    const drawSpectrum = () => {
      if (!this.analyser || !this.frequencyBin) {
        return;
      }
      //Draw spectrum
      this.analyser.getByteFrequencyData(this.frequencyBin);
      for (let i = 0; i < logarithmicBins.length; i++) {
        const bin = logarithmicBins[i];
        const value = Math.max(...this.frequencyBin.slice(bin.startI, bin.endI + 1));

        const ratio = value / 255;
        const barHeight = ratio * plot.height;
        ctx.fillStyle = themeRed;
        ctx.fillStyle = darken(ctx.fillStyle, (ratio - 0.5) * -0.5);
        ctx.fillRect(bin.startPx, plot.height - barHeight + plot.top, 5, barHeight);
      }
    };
    const drawVerticalLines = () => {
      const verticalLines = [
        {
          value: 20,
          line: "thick",
        },
        {
          value: 200,
          line: "thick",
        },
        {
          value: 2000,
          line: "thick",
        },
        {
          value: 20000,
          line: "thick",
        },
        {
          value: 50,
          line: "medium",
        },
        {
          value: 100,
          line: "medium",
        },
        {
          value: 500,
          line: "medium",
        },
        {
          value: 1000,
          line: "medium",
        },
        {
          value: 5000,
          line: "medium",
        },
        {
          value: 10000,
          line: "medium",
        },
      ];

      // draw vertical (frequency) lines
      ctx.fillStyle = themeText;
      ctx.strokeStyle = themeText;
      for (const { value, line } of verticalLines) {
        if (line === "medium" && !drawMediumMarks) {
          continue;
        }
        const x = getXFromFrequency(value);
        ctx.lineWidth = line === "thick" ? 2 : 1;
        if (value === 20000) {
          ctx.lineWidth *= 2;
        }
        if (line === "thick") {
          ctx.setLineDash([]);
        } else {
          ctx.setLineDash([10, 10]);
        }
        drawLine(x, plot.top, x, plot.height - plot.top);

        if (!drawText) {
          continue;
        }
        if (line === "medium" && !drawMediumText) {
          continue;
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const fontSize = line === "thick" ? 24 : 16;
        ctx.font = `${fontSize}px sans-serif`;

        if (value === 20) {
          ctx.textAlign = "left";
        } else if (value === 20000) {
          ctx.textAlign = "right";
        }
        const text =
          (value >= 1000 ? `${Math.floor(value / 1000)}K` : String(value)) +
          (line === "thick" ? "hz" : "");
        ctx.fillText(text, x, plot.height + plot.top + 8);
      }
    };
    const drawHorizontalLines = () => {
      // draw horizontal (dB) lines
      ctx.textAlign = "right";
      ctx.fillStyle = themeText;
      ctx.strokeStyle = themeText;
      ctx.lineWidth = 1;
      ctx.font = "16px sans-serif";
      ctx.setLineDash([10, 10]);
      for (let db = 0; db > -120; db -= 30) {
        if (db === 0) {
          ctx.textBaseline = "top";
        } else {
          ctx.textBaseline = "middle";
        }

        const y = (plot.height / MIN_DB) * db + plot.top;

        drawLine(plot.left, y, plot.right, y);
        ctx.fillText(`${db}`, plot.left - 8, y);
      }
    };

    if (this.audioContextInitted) {
      drawSpectrum();
    }
    drawVerticalLines();
    drawHorizontalLines();
  }
}

customElements.define("audio-visualizer", AudioVisualizer);
