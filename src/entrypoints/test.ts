import { getElementById } from "../dom";
import vertexShader from "./audio-visualizer/visualizer.vs";
import fragmentShader from "./audio-visualizer/visualizer.fs";

const compileProgram = (
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string
) => {
  const compileShader = (
    type: number,
    source: string
  ): [null, false] | [WebGLShader, boolean] => {
    const shader = gl.createShader(type);
    if (!shader) {
      return [shader, false];
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!ok) {
      return [shader, ok];
    }

    return [shader, true];
  };
  const [vShader, vOk] = compileShader(gl.VERTEX_SHADER, vertex);
  const [fShader, fOk] = compileShader(gl.FRAGMENT_SHADER, fragment);
  if (!vOk) {
    if (vShader) {
      console.error("Vertex shader: ", gl.getShaderInfoLog(vShader));
    } else {
      console.error("Unable to create vertex shader");
    }
  }
  if (!fOk) {
    if (fShader) {
      console.error("Fragment shader: ", gl.getShaderInfoLog(fShader));
    } else {
      console.error("Unable to create fragment shader");
    }
  }
  const cleanup = () => {
    gl.deleteShader(vShader);
    gl.deleteShader(fShader);
  };
  if (!vOk || !fOk) {
    cleanup();
    return;
  }
  const program = gl.createProgram();
  if (!program) {
    console.error("Unable to create program");
    cleanup();
    return;
  }
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  cleanup();

  const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linkStatus) {
    console.error("Program:", gl.getProgramInfoLog(program));
    return;
  }
  return program;
};

main();
function main() {
  let canvas: HTMLCanvasElement | null | undefined;
  let gl: WebGLRenderingContext | null | undefined;

  canvas = getElementById("thing") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Missing canvas");
    return;
  }
  gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("webgl unsupported");
    return;
  }

  const program = compileProgram(gl, vertexShader, fragmentShader);
  if (!program) {
    console.error("Cannot create program!");
    return;
  }
}
