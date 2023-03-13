import { Vec2d } from "./types";
import { vecAdd, vecMult, vecSub } from "./vector";

// Particle is basic object
export class Particle {
  positionCurrent: Vec2d;
  positionPrev: Vec2d;
  acceleration: Vec2d;
  // radius
  radius: number;
  color: string;

  constructor(
    positionCurrent: Vec2d,
    positionPrev: Vec2d,
    acceleration: Vec2d,
    radius?: number,
    color?: string
  ) {
    this.positionCurrent = positionCurrent;
    this.positionPrev = positionPrev;
    this.acceleration = acceleration;
    this.color = color || getRandomColor();
    this.radius = radius || Math.max(Math.round(Math.random() * 20), 5);
  }

  updatePosition(dt: number) {
    const velocity = vecSub(this.positionCurrent, this.positionPrev);
    this.positionPrev = this.positionCurrent;
    this.positionCurrent = vecAdd(
      vecAdd(this.positionCurrent, velocity),
      vecMult(this.acceleration, dt * dt)
    );
    this.acceleration = [0, 0];
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
