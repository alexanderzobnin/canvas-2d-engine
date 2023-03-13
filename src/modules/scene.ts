import { throttle } from "lodash";
import { Particle } from "./engine/particle";
import { Solver } from "./engine/solver";
import { Vec2d } from "./engine/types";

const MAX_PARTICLES = 500;

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

  scene.startAnimation();
  setTimeout(() => {
    scene.stopAnimation();
  }, 60 * 1000);
}

export class Scene {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  animationFrameHandle: number;
  lastTime: number;
  debug: boolean;
  solver: Solver;
  objects: Particle[];
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

    const { debug } = options;
    this.debug = debug;
    this.maxParticles = this.maxParticles || MAX_PARTICLES;
    this.objects = [];
    this.dropFramesCount = 0;
  }

  init() {
    const gravity: Vec2d = [0, 1000];
    const solver = new Solver(gravity);
    this.solver = solver;

    const objects: Particle[] = [];
    const centerX = Math.floor(this.canvas.width / 2);
    const centerY = Math.floor(this.canvas.height / 2);
    // objects.push(new Particle([centerX, centerY], [centerX, centerY], [0, 0]));
    // objects.push(new Particle([600, 400], [600, 400], [0, 0]));
    // objects.push(new Particle([800, 400], [800, 400], [0, 0]));
    this.objects = objects;

    const emitingParticlesDebounced = throttle(
      this.emitParticle.bind(this),
      30
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "p") {
        this.toggleAnimation();
      }
      if (e.key === "e") {
        this.emitingParticles = true;
        emitingParticlesDebounced();
      }
      if (e.key === "t") {
        this.emitingParticles = !this.emitingParticles;
        this.emitParticles(50);
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === "e") {
        this.emitingParticles = false;
      }
    });
  }

  startAnimation() {
    this.started = true;
    this.emitingParticles = true;
    // this.physicsFrame(1);
    this.particlesEmitter();
    this.animationFrame(0);
  }

  toggleAnimation() {
    this.started = !this.started;
  }

  stopAnimation() {
    this.started = false;
    cancelAnimationFrame(this.animationFrameHandle);
  }

  particlesEmitter(interval = 50) {
    this.emitParticle();

    if (
      this.started &&
      this.emitingParticles &&
      this.objects.length < this.maxParticles
    ) {
      setTimeout(() => {
        this.particlesEmitter();
      }, interval);
    }
  }

  emitParticles(interval = 100) {
    this.emitParticle();

    if (this.started && this.emitingParticles) {
      setTimeout(() => {
        this.emitParticles();
      }, interval);
    }
  }

  emitParticle() {
    for (let i = 0; i < 4; i++) {
      const jitterX = Math.floor(Math.random() * 100);
      const jitterY = Math.floor(Math.random() * 100);
      const position: Vec2d = [800 + jitterX, 200 + jitterY];
      this.objects.push(new Particle(position, position, [0, 0]));
    }
  }

  physicsFrame(dt: number) {
    if (this.debug) {
      console.log("physicsFrame");
    }

    this.solver.update(dt, this.objects);

    if (this.started) {
      setTimeout(() => {
        this.physicsFrame(dt);
      }, 16);
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
      if (deltaTime > 1000) {
        deltaTime = 16;
      }
      this.lastTime = ts;
      if (this.debug) {
        // console.log(deltaTime);
        ctx.fillStyle = "rgb(200, 220, 20)";
        // ctx.strokeStyle = "rgb(200, 220, 20)";
        ctx.font = "14px monotype";
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

      this.solver.update(deltaTime / 1000, this.objects);

      for (let i = 0; i < this.objects.length; i++) {
        const obj = this.objects[i];
        ctx.fillStyle = obj.color;
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
