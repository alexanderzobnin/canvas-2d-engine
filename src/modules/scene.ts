import { throttle } from "lodash";
import { getTemperatureColorScale } from "./engine/color";
import { ParticleEmitter } from "./engine/emitter";
import { Link } from "./engine/link";
import { Particle } from "./engine/particle";
import { Solver } from "./engine/solver";
import { Vec2d } from "./engine/types";

const MAX_PARTICLES = 100;
const GRAVITY = 800;
const COR = 0.7;

export function initCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth - 200;
  canvas.height = window.innerHeight - 50;

  return canvas;
}

export function initContext(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  return ctx;
}

export function initAnimation(canvas: HTMLCanvasElement) {
  const scene = new Scene(canvas, { debug: true });
  scene.init();

  // scene.startAnimation();
  setTimeout(() => {
    scene.stopAnimation();
  }, 60 * 5 * 1000);
}

export class Scene {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
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
  framesCount: number;

  constructor(
    canvas: HTMLCanvasElement,
    options?: { debug?: boolean; maxParticles?: number }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
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
    this.framesCount = 0;
  }

  init() {
    const gravity: Vec2d = [0, GRAVITY];
    const solver = new Solver({ gravity, cor: COR, box: this.box });
    this.solver = solver;

    const centerX = Math.floor(this.canvas.width / 2);
    const centerY = Math.floor(this.canvas.height / 2);

    const emitingParticlesDebounced = throttle(
      this.emitParticle.bind(this),
      30
    );

    this.renderScene();

    document.addEventListener("keydown", (e) => {
      if (e.key === "e" || e.code === "Space") {
        this.emitingParticles = true;
        emitingParticlesDebounced();
      }
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
      if (e.key === "e" || e.code === "Space") {
        this.emitingParticles = false;
      }
      if (e.key === "t") {
        this.emitingParticles = !this.emitingParticles;
        this.emitParticles(10);
      }
      if (e.key === "r") {
        this.removeParticles();
      }
    });
  }

  startAnimation(maxParticles?: number) {
    this.started = true;
    this.emitingParticles = true;
    // this.physicsFrame(16);
    // this.createLinks();
    this.generateParticles(10, maxParticles);
    this.animationFrame(0);
  }

  toggleAnimation() {
    this.started = !this.started;
  }

  stopAnimation() {
    this.started = false;
    cancelAnimationFrame(this.animationFrameHandle);
  }

  removeParticles() {
    this.objects = [];
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

  createLinks() {
    const startPos: Vec2d = [400, 500];
    const startParticlePos = this.objects.length;
    const linksNum = 20;
    for (let i = 0; i < linksNum + 1; i++) {
      const pos: Vec2d = [startPos[0] + i * 10, startPos[1] + i * 1];
      const isStatic = i === 0 || i === linksNum;
      const particle = new Particle({
        positionCurrent: pos,
        positionPrev: pos,
        acceleration: [0, 0],
        mass: 1,
        radius: 8,
        color: "rgba(255,255,255)",
        isStatic,
      });
      this.objects.push(particle);
    }
    for (let i = startParticlePos + 1; i < linksNum + 1; i++) {
      this.links.push(new Link(this.objects[i - 1], this.objects[i], 16));
    }
  }

  physicsFrame(interval: number) {
    const ts = performance.now();
    let dt = ts - this.lastTimePhysics;
    this.lastTimePhysics = ts;
    if (dt > 1000) {
      dt = interval;
    }

    this.solver.update(this.objects);

    if (this.started) {
      setTimeout(() => {
        this.physicsFrame(interval);
      }, interval);
    }
  }

  animationFrame(ts: number) {
    this.framesCount++;

    if (this.started) {
      const ctx = this.ctx;
      // Clear screen
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.renderScene();

      let deltaTime = ts - this.lastTime;
      const tsSolverStart = performance.now();
      this.solver.update(this.objects, this.links);
      const tsSolverTime = performance.now() - tsSolverStart;

      if (this.framesCount === 30) {
        if (this.debug) {
          this.renderDebugInfo(deltaTime, tsSolverTime);
        }
        this.framesCount = 0;
      }

      // Limit deltaTime to 30 ms to prevent strange behavior
      deltaTime = Math.min(deltaTime, 30);
      this.lastTime = ts;

      for (let i = 0; i < this.objects.length; i++) {
        const obj = this.objects[i];
        // ctx.fillStyle = obj.color;
        ctx.fillStyle = getTemperatureColorScale(obj.temp);
        // ctx.lineWidth = 2;
        // ctx.strokeStyle = obj.color
        //   .replace("rgb", "rgba")
        //   .replace(")", ",0.7)");
        ctx.beginPath();
        ctx.arc(
          Math.round(obj.positionCurrent[0]) + this.box.x,
          Math.round(obj.positionCurrent[1]) + this.box.y,
          obj.radius,
          0,
          Math.PI * 2,
          true
        );
        ctx.stroke();
        ctx.fill();
      }
    }

    this.animationFrameHandle = requestAnimationFrame((ts) =>
      this.animationFrame(ts)
    );
  }

  renderScene() {
    const ctx = this.ctx;

    ctx.fillStyle = "rgb(20, 20, 20)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.strokeStyle = "rgb(0, 0, 0)";
    // ctx.beginPath();
    // ctx.arc(500, 400, 300, 0, Math.PI * 2, true);
    ctx.fillRect(this.box.x, this.box.y, this.box.w, this.box.h);
    ctx.fill();
    ctx.stroke();

    // render temperature legend
    for (let i = 0; i < 5000; i += 10) {
      const color = getTemperatureColorScale(i);
      ctx.fillStyle = color;
      ctx.fillRect(10 + i / 10, 10, 1, 8);
    }
  }

  renderDebugInfo(deltaTime: number, tsSolverTime: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgb(200, 220, 20)";
    // ctx.strokeStyle = "rgb(200, 220, 20)";
    ctx.font = "14px monospace";
    ctx.fillText(
      `${Math.floor(deltaTime * 10) / 10} ms`,
      this.canvas.width - 100,
      20
    );
    ctx.fillText(
      `${Math.round(1000 / deltaTime)} fps`,
      this.canvas.width - 100,
      40
    );
    ctx.fillText(`${Math.floor(tsSolverTime)} ms`, this.canvas.width - 100, 60);
    ctx.fillText(
      `${this.objects.length} particles`,
      this.canvas.width - 100,
      80
    );
  }
}
