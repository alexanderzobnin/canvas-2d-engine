import { throttle } from "lodash";
import { Link } from "./engine/link";
import { Particle } from "./engine/particle";
import { Solver } from "./engine/solver";
import { Vec2d } from "./engine/types";

const MAX_PARTICLES = 100;
const GRAVITY = 1000;

export function initCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth - 50;
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
  }

  init() {
    const gravity: Vec2d = [0, GRAVITY];
    const solver = new Solver({ gravity, cor: 0.3 });
    this.solver = solver;

    const centerX = Math.floor(this.canvas.width / 2);
    const centerY = Math.floor(this.canvas.height / 2);

    const emitingParticlesDebounced = throttle(
      this.emitParticle.bind(this),
      30
    );

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

  startAnimation() {
    this.started = true;
    this.emitingParticles = true;
    // this.physicsFrame(16);
    // this.createLinks();
    this.particlesEmitter(50);
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

  particlesEmitter(interval: number) {
    this.emitParticle();

    if (
      this.started &&
      this.emitingParticles &&
      this.objects.length < this.maxParticles
    ) {
      setTimeout(() => {
        this.particlesEmitter(interval || 100);
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
    const emitterPosition: Vec2d = [600, 200];
    const ts = performance.now();
    const modulationX = Math.sin(ts / 1000);
    const modulationY = Math.cos(ts / 1000);
    const factor = 5;
    const particlePosition: Vec2d = [
      emitterPosition[0] + modulationX * factor,
      emitterPosition[1] + (modulationY - 1.5) * factor,
    ];
    const size = Math.max(Math.abs(Math.floor(10 * Math.cos(ts / 100))), 4);
    const mass = size;
    const hue = Math.abs(Math.floor(360 * Math.sin(ts / 100)));
    const saturation = Math.max(
      Math.abs(Math.floor(50 * modulationX)) + 50,
      50
    );
    const l = Math.floor(Math.random() * 50) + 40;
    const color = `hsl(${hue},${saturation}%,${l}%)`;

    this.objects.push(
      new Particle({
        positionCurrent: emitterPosition,
        positionPrev: particlePosition,
        acceleration: [0, 0],
        radius: size,
        mass,
        color,
      })
    );
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
    if (this.started) {
      const ctx = this.ctx;
      // Clear screen
      ctx.fillStyle = "rgb(60, 60, 60)";
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      let deltaTime = ts - this.lastTime;

      if (this.debug) {
        // console.log(deltaTime);
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
        ctx.fillText(
          `${this.objects.length} particles`,
          this.canvas.width - 100,
          60
        );
      }

      // Limit deltaTime to 30 ms to prevent strange behavior
      deltaTime = Math.min(deltaTime, 30);
      this.lastTime = ts;

      // Stop animation when FPS starts drop
      if (1000 / deltaTime < 30) {
        this.dropFramesCount++;
      }
      if (this.dropFramesCount > 10) {
        this.emitingParticles = false;
      }
      if (this.dropFramesCount > 20) {
        // this.stopAnimation();
      }

      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.strokeStyle = "rgb(0, 0, 0)";
      ctx.beginPath();
      ctx.arc(600, 400, 400, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.stroke();

      this.solver.update(this.objects, this.links);

      for (let i = 0; i < this.objects.length; i++) {
        const obj = this.objects[i];
        // ctx.lineWidth = 2;
        ctx.fillStyle = obj.color;
        // ctx.strokeStyle = obj.color
        //   .replace("rgb", "rgba")
        //   .replace(")", ",0.7)");
        ctx.beginPath();
        ctx.arc(
          Math.round(obj.positionCurrent[0]),
          Math.round(obj.positionCurrent[1]),
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
}
