import { Vec2d } from "./types";
import { vecAdd, vecMult, vecSub } from "./vector";

interface ParticleOptions {
  positionCurrent: Vec2d;
  positionPrev: Vec2d;
  acceleration: Vec2d;
  mass: number;
  radius: number;
  color?: string;
  temp?: number;
  isStatic?: boolean;
}

// Particle is basic object
export class Particle {
  positionCurrent: Vec2d;
  positionPrev: Vec2d;
  acceleration: Vec2d;
  mass: number;
  // radius
  radius: number;
  color: string;
  temp: number;
  isStatic?: boolean;

  constructor({
    positionCurrent,
    positionPrev,
    acceleration,
    mass,
    radius,
    color,
    temp,
    isStatic,
  }: ParticleOptions) {
    this.positionCurrent = positionCurrent;
    this.positionPrev = positionPrev;
    this.acceleration = acceleration;
    this.mass = mass;
    this.radius = radius;
    this.color = color || getRandomColor();
    this.temp = temp;
    this.isStatic = isStatic;
  }

  // dt should be constant since Verlet integration cannot handle non-constant time differences
  updatePosition(dt: number) {
    if (this.isStatic) {
      return;
    }
    const velocity = vecSub(this.positionCurrent, this.positionPrev);
    this.positionPrev = this.positionCurrent;
    // Verlet integration
    // x(n+1) = 2x(n) - x(n-1) + a(n) * dt ^ 2
    // x(n+1) = x(n) + (x(n) - x(n-1) => velocity) + a(n) * dt ^ 2
    // x(n+1) = x(n) + velocity(n) + a(n) * dt ^ 2
    this.positionCurrent = vecAdd(
      vecAdd(this.positionCurrent, velocity),
      vecMult(this.acceleration, dt * dt)
    );
    this.acceleration = [0, 0];
    // this.accelerate([0, 0]);
  }

  accelerate(a: Vec2d) {
    this.acceleration = vecAdd(this.acceleration, a);
  }
}

function getRandomColor() {
  const r = Math.round(Math.random() * 255);
  const g = Math.round(Math.random() * 255);
  const b = Math.round(Math.random() * 255);
  return `rgb(${r},${g},${b})`;
}
