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

let simpleVertexShader: string;
let simpleFragmentShader: string;

export async function init(canvas: HTMLCanvasElement) {
  const scene = new SceneWebgl(canvas, { debug: true });

  simpleVertexShader = await loadShaderSource("simpleVertexShader.vert");
  simpleFragmentShader = await loadShaderSource("simpleFragmentShader.frag");

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
  }

  init() {
    this.renderScene();
  }

  renderScene() {
    const gl = this.gl;

    // Clear screen with  color provided in gl.clearColor()
    gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, simpleVertexShader);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, simpleFragmentShader);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const vertices = new Float32Array([0.1, 0.1, 0.3, 0.6, 0.5, 0.5]);

    function animate() {
      for (let i = 0; i < vertices.length; i++) {
        vertices[i] = Math.max(vertices[i] - 0.005, -1);
      }

      gl.clearColor(0.05, 0, 0.2, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      let buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      gl.useProgram(program);
      // @ts-ignore
      program.color = gl.getUniformLocation(program, "color");
      // @ts-ignore
      gl.uniform4fv(program.color, [0, 1, 0, 1.0]);

      // @ts-ignore
      program.position = gl.getAttribLocation(program, "position");
      // @ts-ignore
      gl.enableVertexAttribArray(program.position);
      // @ts-ignore
      gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, vertices.length / 2);

      requestAnimationFrame(() => {
        animate();
      });
    }

    animate();
  }
}
