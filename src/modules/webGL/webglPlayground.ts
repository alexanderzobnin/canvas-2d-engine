import { throttle } from "lodash";
import { ParticleEmitter } from "../engine/emitter";
import { Link } from "../engine/link";
import { Particle } from "../engine/particle";
import { Solver } from "../engine/solver";
import { Vec2d } from "../engine/types";
import { loadShaderSource } from "./utils";

const MAX_PARTICLES = 100;
const GRAVITY = 800;
const COR = 0.7;

let simpleVertexShader: string;
let simpleFragmentShader: string;

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
  const scene = new SceneWebglPlayground(canvas, { debug: true });

  simpleVertexShader = await loadShaderSource("simpleVertexShader.vert");
  simpleFragmentShader = await loadShaderSource("simpleFragmentShader.frag");
  simpleVertexShader = await loadShaderSource("play.vert");
  simpleFragmentShader = await loadShaderSource("play.frag");

  scene.init();
}

export class SceneWebglPlayground {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null;
  animationFrameHandle: number;
  lastTime: number;
  lastTimePhysics: number;
  debug: boolean;
  solver: Solver;
  objects: Particle[];
  links: Link[];
  started: boolean;
  maxParticles: number;
  emitingParticles: boolean;
  dropFramesCount: number;
  box: { x: number; y: number; w: number; h: number };
  particlesEmitter: ParticleEmitter;
  mousePos: { x: number; y: number };

  constructor(
    canvas: HTMLCanvasElement,
    options?: { debug?: boolean; maxParticles?: number }
  ) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2");
    this.lastTime = 0;
    this.lastTimePhysics = 0;

    const { debug } = options;
    this.debug = debug;
    this.maxParticles = this.maxParticles || MAX_PARTICLES;
    this.objects = [];
    this.links = [];
    this.dropFramesCount = 0;
    this.box = { x: 100, y: 100, w: 400, h: 600 };
    this.particlesEmitter = new ParticleEmitter([200, 200], {});
    this.mousePos = { x: 0, y: 0 };
  }

  init() {
    this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
      // console.log(e);
      this.mousePos = { x: e.offsetX, y: e.offsetY };
    });
    document.addEventListener("keyup", (e) => {
      if (e.key === "q") {
        this.stopAnimation();
      }
    });

    this.renderScene();
  }

  stopAnimation() {
    this.started = false;
    cancelAnimationFrame(this.animationFrameHandle);
    this.clearScreen();
  }

  clearScreen() {
    const gl = this.gl;
    // Clear screen with  color provided in gl.clearColor()
    gl.clearColor(0.09, 0.0, 0.01, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  renderScene() {
    const gl = this.gl;
    const canvas = this.canvas;
    const mousePos = this.mousePos;
    const renderData = {
      canvas: this.canvas,
      mousePos: this.mousePos,
    };

    // Clear screen with  color provided in gl.clearColor()
    gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, simpleVertexShader);
    gl.compileShader(vertexShader);

    // Fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, simpleFragmentShader);
    gl.compileShader(fragmentShader);

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const vertices = new Float32Array([0.1, 0.1, 0.3, 0.6, 0.5, 0.5]);

    // Draw rectangle as a background
    const backgroundBox = new Float32Array([
      1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0,
    ]);
    let bufferBackground = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferBackground);

    this.animationFrame(gl, program, backgroundBox);
  }

  animationFrame(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    vertices: Float32Array
  ) {
    // for (let i = 0; i < vertices.length; i++) {
    //   vertices[i] = Math.max(vertices[i] - 0.005, -1);
    // }

    gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // let buffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // gl.bindBuffer(gl.ARRAY_BUFFER, bufferBackground);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.useProgram(program);

    // @ts-ignore
    program.u_time = gl.getUniformLocation(program, "u_time");
    // @ts-ignore
    gl.uniform1f(program.u_time, performance.now() / 1000);
    // @ts-ignore
    program.u_mouse = gl.getUniformLocation(program, "u_mouse");
    // @ts-ignore
    gl.uniform2f(program.u_mouse, this.mousePos.x, this.mousePos.y);
    // @ts-ignore
    program.u_resolution = gl.getUniformLocation(program, "u_resolution");
    // @ts-ignore
    gl.uniform2f(program.u_resolution, this.canvas.width, this.canvas.height);

    // Set color property
    // @ts-ignore
    program.u_color = gl.getUniformLocation(program, "u_color");
    // @ts-ignore
    gl.uniform4fv(program.u_color, [0.9, 0.8, 0.6, 1.0]);

    // Set vertices positions
    // @ts-ignore
    program.position = gl.getAttribLocation(program, "position");
    // @ts-ignore
    gl.enableVertexAttribArray(program.position);
    // @ts-ignore
    gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);

    // gl.drawArrays(gl.POINTS, 0, vertices.length / 2);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);

    this.animationFrameHandle = requestAnimationFrame(() => {
      this.animationFrame(gl, program, vertices);
    });
  }
}

function initBuffers(gl: WebGLRenderingContext) {
  const positionBuffer = initPositionBuffer(gl);

  return {
    position: positionBuffer,
  };
}

function initPositionBuffer(gl: WebGLRenderingContext) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}
