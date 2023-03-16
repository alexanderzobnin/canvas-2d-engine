import { throttle } from "lodash";
import { ParticleEmitter } from "./engine/emitter";
import { Link } from "./engine/link";
import { Particle } from "./engine/particle";
import { Solver } from "./engine/solver";
import { Vec2d } from "./engine/types";
import { loadShaderSource } from "./utils";

const MAX_PARTICLES = 100;
const GRAVITY = 800;
const COR = 0.7;

let particleVertexShader: string;
let particleFragmentShader: string;

interface RenderData {
  canvas: HTMLCanvasElement;
  mousePos: { x: number; y: number };
}

export async function init(canvas: HTMLCanvasElement) {
  const scene = new SceneWebgl(canvas, { debug: true });

  particleVertexShader = await loadShaderSource("particle.vert");
  particleFragmentShader = await loadShaderSource("particle.frag");

  scene.init();
}

export class SceneWebgl {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | null;
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
    this.gl = canvas.getContext("webgl");
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
    this.renderScene();
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
    gl.shaderSource(vertexShader, particleVertexShader);
    gl.compileShader(vertexShader);

    // Fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, particleFragmentShader);
    gl.compileShader(fragmentShader);

    // Link program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const vertices = new Float32Array([0.1, 0.1, 0.3, 0.6, 0.5, 0.5]);

    // Draw rectangle as a background
    // const backgroundBox = new Float32Array([
    //   1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0,
    // ]);
    // let bufferBackground = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, bufferBackground);

    this.animate(gl, program, vertices);
  }

  animate(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    vertices: Float32Array
  ) {
    for (let i = 0; i < vertices.length; i++) {
      vertices[i] = Math.max(vertices[i] - 0.0005, -1);
    }

    gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // gl.bindBuffer(gl.ARRAY_BUFFER, bufferBackground);
    // gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

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

    gl.drawArrays(gl.POINTS, 0, vertices.length / 2);

    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);

    requestAnimationFrame(() => {
      this.animate(gl, program, vertices);
    });
  }
}
