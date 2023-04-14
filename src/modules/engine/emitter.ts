import { getTemperatureColorScale } from "./color";
import { Particle } from "./particle";
import { Vec2d } from "./types";
import { vecSub } from "./vector";

export interface EmitterOptions {
  maxX?: number;
  maxY?: number;
}

export class ParticleEmitter {
  position: Vec2d;
  maxX: number;
  maxY: number;

  constructor(position: Vec2d, options?: EmitterOptions) {
    this.position = position;
    this.maxX = options.maxX;
    this.maxY = options.maxY;
  }

  emit() {
    const ts = performance.now();
    const modulationX = Math.sin(ts / 1000);
    const modulationY = Math.cos(ts / 1000);
    const factor = 5;
    const particleVelocity: Vec2d = [
      -modulationX * factor,
      -(modulationY - 1.5) * factor,
    ];

    return generateParticle(this.position, particleVelocity);
  }

  emitRandom() {
    const x = Math.floor(Math.random() * this.maxX);
    const y = Math.floor(Math.random() * this.maxY);
    return generateParticle([x, y], [0, 0]);
  }
}

export function generateParticle(pos: Vec2d, velocity?: Vec2d) {
  const size = Math.floor(Math.random() * 3) + 1;
  // const size = 4;
  const mass = size;
  const temp = Math.random() * 1000 + 1000;
  // 250 is blue
  // const hue = Math.floor(temp / 4);
  // const saturation = 100;
  // const l = Math.floor(temp / 50 + 40);
  const colorFactor = Math.round(Math.random() * 200) + 55;
  const colorFactorBlue = Math.round(Math.random() * 200) + 55;
  // const color = `rgb(${colorFactor},${colorFactor},${colorFactorBlue})`;
  const color = getTemperatureColorScale(temp);

  let posPrev = pos;
  if (velocity) {
    posPrev = vecSub(pos, velocity);
  }

  return new Particle({
    positionCurrent: pos,
    positionPrev: posPrev,
    acceleration: [0, 0],
    radius: size,
    mass,
    temp,
    color,
  });
}
