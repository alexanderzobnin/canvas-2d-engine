import { loadImage, loadShaderSource } from "./utils";

let imgVertexShader: string;
let imgFragmentShader: string;

let image = new Image();

interface RenderData {
  canvas: HTMLCanvasElement;
  mousePos: { x: number; y: number };
}

export function initCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth - 200;
  canvas.height = window.innerHeight - 50;

  return canvas;
}

export async function initScene(canvas: HTMLCanvasElement) {
  const scene = new SceneWebgl(canvas, { debug: true });

  imgVertexShader = await loadShaderSource("imageProcess.vert");
  imgFragmentShader = await loadShaderSource("imageProcess.frag");

  image = await loadImage("./data/panel.png");
  console.log(image.width, image.height);

  scene.init();
}

export class SceneWebgl {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null;
  renderProgram: WebGLProgram;
  animationFrameHandle: number;
  lastTime: number;
  framesCount: number;

  constructor(
    canvas: HTMLCanvasElement,
    options?: { debug?: boolean; maxParticles?: number }
  ) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2");
    this.lastTime = 0;
  }

  init() {
    const gl = this.gl;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Clear screen with  color provided in gl.clearColor()
    gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, imgVertexShader);
    gl.compileShader(vertexShader);

    // Fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, imgFragmentShader);
    gl.compileShader(fragmentShader);

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // const vertices = new Float32Array([0.1, 0.1, 0.3, 0.6, 0.5, 0.5]);

    this.animationFrame(gl, program);
    // this.clearScreen();
  }

  cancel() {
    cancelAnimationFrame(this.animationFrameHandle);
  }

  animationFrame(gl: WebGLRenderingContext, program: WebGLProgram) {
    // Draw rectangle as a background
    const backgroundBox = new Float32Array([
      -1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0,
    ]);
    let bufferBackground = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferBackground);
    gl.bufferData(gl.ARRAY_BUFFER, backgroundBox, gl.STATIC_DRAW);

    // Set vertices positions
    const positionLocation = gl.getAttribLocation(program, "position");
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    const u_time = gl.getUniformLocation(program, "u_time");
    gl.uniform1f(u_time, performance.now() / 1000);
    // console.log(performance.now() / 1000);

    // Create texture from image
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.animationFrameHandle = requestAnimationFrame(() => {
      this.animationFrame(gl, program);
    });
  }

  clearScreen() {
    const gl = this.gl;
    // Clear screen with  color provided in gl.clearColor()
    // gl.clearColor(0.09, 0.0, 0.01, 1);
    gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
