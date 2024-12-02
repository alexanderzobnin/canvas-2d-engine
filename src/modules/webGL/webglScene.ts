import { throttle } from "lodash";
import { ParticleEmitter } from "../engine/emitter";
import { Link } from "../engine/link";
import { Particle } from "../engine/particle";
import { Solver } from "../engine/solver";
import { Vec2d } from "../engine/types";
import { loadShaderSource } from "./utils";

const MAX_PARTICLES = 1000;
const GRAVITY = 400;
const COR = 0.7;

let particleVS: string;
let particleFS: string;
let physicsVS: string;
let physicsFS: string;

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

  particleVS = await loadShaderSource("particle.vert");
  particleFS = await loadShaderSource("particle.frag");

  physicsVS = await loadShaderSource("physics.vert");
  physicsFS = await loadShaderSource("physics.frag");

  scene.init();
}

export class SceneWebgl {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null;
  renderProgram: WebGLProgram;
  physicsProgram: WebGLProgram;
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
  box: { x: number; y: number; w: number; h: number };
  particlesEmitter: ParticleEmitter;
  mousePos: { x: number; y: number };
  framesCount: number;

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
    this.framesCount = 0;
    this.box = { x: 0, y: 0, w: 800, h: 600 };
    this.particlesEmitter = new ParticleEmitter([200, 200], {
      maxX: 800,
      maxY: 600,
    });
    this.mousePos = { x: 0, y: 0 };
  }

  init() {
    this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
      // console.log(e);
      this.mousePos = { x: e.offsetX, y: e.offsetY };
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "s") {
        if (!this.started) {
          this.startAnimation();
        }
      }
      if (e.key === "d") {
        if (!this.started) {
          this.startAnimation(1000);
        }
      }
      if (e.key === "f") {
        if (!this.started) {
          this.startAnimation(1500);
        }
      }
      if (e.key === "p") {
        this.toggleAnimation();
      }
      if (e.key === "q") {
        this.stopAnimation();
      }
      if (e.key === "e" || e.code === "Space") {
        this.emitingParticles = false;
      }
      if (e.key === "t") {
        this.emitingParticles = !this.emitingParticles;
        this.emitParticles(1);
      }
      if (e.key === "r") {
        this.removeParticles();
      }
    });

    const gravity: Vec2d = [0, GRAVITY];
    const solver = new Solver({ gravity, cor: COR, box: this.box });
    this.solver = solver;

    this.initScene();
    this.startAnimation();
  }

  startAnimation(maxParticles?: number) {
    this.started = true;
    this.emitingParticles = true;
    // this.physicsFrame(16);
    // this.createLinks();
    this.generateParticlesRandom(maxParticles || this.maxParticles);
    this.animationFrame(this.lastTime);
  }

  toggleAnimation() {
    this.started = !this.started;
    if (this.started) {
      this.animationFrame(this.lastTime);
    }
  }

  stopAnimation() {
    this.started = false;
    cancelAnimationFrame(this.animationFrameHandle);
    this.removeParticles();
    this.clearScreen();
  }

  generateParticles(interval: number, maxParticles?: number) {
    maxParticles = maxParticles || this.maxParticles;
    this.emitParticle();

    if (
      this.started &&
      this.emitingParticles &&
      this.objects.length < maxParticles
    ) {
      setTimeout(() => {
        this.generateParticles(interval || 100, maxParticles);
      }, interval);
    } else {
      this.emitingParticles = false;
    }
  }

  generateParticlesRandom(particlesNum: number) {
    const particles = new Array<Particle>(particlesNum);
    for (let i = 0; i < particlesNum; i++) {
      const particle = this.particlesEmitter.emitRandom();
      particles[i] = particle;
    }
    this.objects = particles;
  }

  emitParticles(interval?: number) {
    this.emitParticle();

    if (this.started && this.emitingParticles) {
      setTimeout(() => {
        this.emitParticles(interval || 100);
      }, interval);
    }
  }

  emitParticle() {
    const particle = this.particlesEmitter.emit();
    this.objects.push(particle);
  }

  removeParticles() {
    this.objects = [];
  }

  clearScreen() {
    const gl = this.gl;
    // Clear screen with  color provided in gl.clearColor()
    gl.clearColor(0.09, 0.0, 0.01, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  initScene() {
    const gl = this.gl;
    this.clearScreen();

    // Vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, particleVS);
    gl.compileShader(vertexShader);

    // Fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, particleFS);
    gl.compileShader(fragmentShader);

    // Link rendering program
    const renderProgram = gl.createProgram();
    gl.attachShader(renderProgram, vertexShader);
    gl.attachShader(renderProgram, fragmentShader);
    gl.linkProgram(renderProgram);
    this.renderProgram = renderProgram;

    // Vertex shader
    const physicsVShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(physicsVShader, physicsVS);
    gl.compileShader(physicsVShader);

    // Fragment shader
    const physicsFShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(physicsFShader, physicsFS);
    gl.compileShader(physicsFShader);

    // Link physics program
    const physicsProgram = gl.createProgram();
    gl.attachShader(physicsProgram, vertexShader);
    gl.attachShader(physicsProgram, fragmentShader);
    gl.linkProgram(physicsProgram);
    this.physicsProgram = physicsProgram;

    // make a texture
    const tex = gl.createTexture();
    const texWidth = 64;
    const texHeight = 64;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      texWidth,
      texHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // attach texture to framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tex,
      0
    );

    // render to texture
    gl.viewport(0, 0, texWidth, texHeight);
    gl.useProgram(physicsProgram);
    gl.drawArrays(gl.POINTS, 0, 1);

    // render texture (output of prg1) to canvas using prg2
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(renderProgram);

    this.animationFrame(this.lastTime);
  }

  animationFrame(ts: number) {
    this.framesCount++;
    if (!this.started) {
      return;
    }

    const { gl, renderProgram: program } = this;
    const pointDimensions = 4;

    let deltaTime = ts - this.lastTime;
    this.lastTime = ts;

    const tsSolverStart = performance.now();
    this.solver.update(this.objects);
    const tsSolverTime = performance.now() - tsSolverStart;

    const vertices = new Float32Array(this.objects.length * pointDimensions);

    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      vertices[i * pointDimensions] = obj.positionCurrent[0];
      vertices[i * pointDimensions + 1] = obj.positionCurrent[1];
      vertices[i * pointDimensions + 2] = obj.radius;
      vertices[i * pointDimensions + 3] = obj.temp;
    }

    // for (let i = 0; i < vertices.length; i++) {
    //   vertices[i] = Math.max(vertices[i] - 0.001, -1);
    // }

    // gl.clearColor(0.05, 0, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

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
    gl.uniform4fv(program.u_color, [0.8, 0.6, 0.1, 1.0]);

    // Set vertices positions
    // @ts-ignore
    program.position = gl.getAttribLocation(program, "position");
    // @ts-ignore
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(0);

    // Set vertices radius
    // @ts-ignore
    program.radius = gl.getAttribLocation(program, "radius");
    // @ts-ignore
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(1);

    // Set vertices temperatures
    // @ts-ignore
    program.temperature = gl.getAttribLocation(program, "temperature");
    // @ts-ignore
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 16, 12);
    gl.enableVertexAttribArray(2);

    //Set the attributes in the vertex shader to the same indices
    gl.bindAttribLocation(program, 0, "position");
    gl.bindAttribLocation(program, 1, "radius");
    gl.bindAttribLocation(program, 2, "temperature");
    // gl.linkProgram(program);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);

    gl.drawArrays(gl.POINTS, 0, vertices.length / pointDimensions);

    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertices.length / 2);

    if (this.framesCount === 10) {
      if (this.debug) {
        this.renderDebugInfo(deltaTime, tsSolverTime);
      }
      this.framesCount = 0;
    }

    this.animationFrameHandle = requestAnimationFrame((ts) => {
      this.animationFrame(ts);
    });
  }

  renderDebugInfo(deltaTime: number, tsSolverTime: number) {
    document.getElementById("fps").textContent = `${Math.floor(
      1000 / deltaTime
    )}`;
    document.getElementById("physicsTime").textContent = `${Math.floor(
      tsSolverTime
    )} ms`;
    document.getElementById(
      "particlesNum"
    ).textContent = `${this.objects.length}`;
  }
}
