import { loadImage, loadShaderSource } from "./utils";

// This is the number of primitives we will draw
const COUNT = 50000;

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

  imgVertexShader = await loadShaderSource("physics.vert");
  imgFragmentShader = await loadShaderSource("physics.frag");

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
    this.bindControls();

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

    // This line tells WebGL that these four output varyings should
    // be recorded by transform feedback and that we're using a single
    // buffer to record them.
    gl.transformFeedbackVaryings(
      program,
      ["vSpeed", "vDepth", "vPosition", "vVelocity"],
      gl.INTERLEAVED_ATTRIBS
    );

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.log(gl.getShaderInfoLog(vertexShader));
      console.log(gl.getShaderInfoLog(fragmentShader));
      console.log(gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);

    // Initial state of the input data. This "seeds" the
    // particle system for its first draw.
    let initialData = new Float32Array(COUNT * 6);
    for (let i = 0; i < COUNT * 6; i += 6) {
      const px = Math.random() * 2 - 1;
      const speed = Math.random() * 0.5 + 0.4;
      const depth = Math.random();

      initialData.set(
        [
          speed, // vSpeed
          depth, // vDepth
          px, // vPosition
          0.9,
          0.01, // vVelocity
          0.1,
        ],
        i
      );
    }

    // Describe our first buffer for when it is used a vertex buffer
    const buffer1 = gl.createBuffer();
    const vao1 = gl.createVertexArray();
    gl.bindVertexArray(vao1);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferData(gl.ARRAY_BUFFER, 6 * COUNT * 4, gl.DYNAMIC_COPY);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, initialData);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 4);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 8);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 24, 16);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    // Initial data is no longer needed, so we can clear it now.
    initialData = null;

    // Buffer2 is identical but does not need initial data
    const buffer2 = gl.createBuffer();
    const vao2 = gl.createVertexArray();
    gl.bindVertexArray(vao2);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, 6 * COUNT * 4, gl.DYNAMIC_COPY);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 4);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 8);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 24, 16);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    // Clean up after yourself
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // This code should NOT be used, since we are using a single
    // draw call to both UPDATE our particle system and DRAW it.
    // gl.enable(gl.RASTERIZER_DISCARD);

    // We have two VAOs and two buffers, but one of each is
    // ever active at a time. These variables will make sure
    // of that.
    let vao = vao1;
    let buffer = buffer2;
    let time = 0;

    const uRandomLocation = gl.getUniformLocation(program, "uRandom");

    // When we call `gl.clear(gl.COLOR_BUFFER_BIT)` WebGL will
    // use this color (100% black) as the background color.
    gl.clearColor(0, 0, 0, 1);

    this.draw(
      gl,
      program,
      buffer,
      buffer1,
      buffer2,
      vao,
      vao1,
      vao2,
      uRandomLocation
    );
  }

  cancel() {
    cancelAnimationFrame(this.animationFrameHandle);
  }

  draw(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    buffer: WebGLBuffer,
    buffer1: WebGLBuffer,
    buffer2: WebGLBuffer,
    vao: WebGLVertexArrayObject,
    vao1: WebGLVertexArrayObject,
    vao2: WebGLVertexArrayObject,
    uRandomLocation: WebGLUniformLocation
  ) {
    // It often helps to send a single (or multiple) random
    // numbers into the vertex shader as a uniform.
    gl.uniform1f(uRandomLocation, Math.random());
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Bind one buffer to ARRAY_BUFFER and the other to TFB
    gl.bindVertexArray(vao);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);

    // Perform transform feedback and the draw call
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    gl.endTransformFeedback();

    // Clean up after ourselves to avoid errors.
    gl.bindVertexArray(null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    // If we HAD skipped the rasterizer, we would have turned it
    // back on here too.
    // gl.disable(gl.RASTERIZER_DISCARD);

    // Swap the VAOs and buffers
    if (vao === vao1) {
      vao = vao2;
      buffer = buffer1;
    } else {
      vao = vao1;
      buffer = buffer2;
    }

    this.animationFrameHandle = requestAnimationFrame(() => {
      this.draw(
        gl,
        program,
        buffer,
        buffer1,
        buffer2,
        vao,
        vao1,
        vao2,
        uRandomLocation
      );
    });
  }

  clearScreen() {
    const gl = this.gl;
    // Clear screen with  color provided in gl.clearColor()
    // gl.clearColor(0.09, 0.0, 0.01, 1);
    gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  bindControls() {
    document.addEventListener("keyup", (e) => {
      if (e.key === "c") {
        this.cancel();
      }
    });
  }
}
