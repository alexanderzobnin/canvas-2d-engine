import { Particle } from "./particle";
import { vecAdd, vecDiv, vecLength, vecMult, vecSub } from "./vector";

export class Link {
  a: Particle;
  b: Particle;
  targetDistance: number;

  constructor(a: Particle, b: Particle, distance: number) {
    this.a = a;
    this.b = b;
    this.targetDistance = distance;
  }

  apply() {
    const axis = vecSub(this.a.positionCurrent, this.b.positionCurrent);
    const distance = vecLength(axis);
    const n = vecDiv(axis, distance);
    const delta = this.targetDistance - distance;
    if (!this.a.isStatic) {
      this.a.positionCurrent = vecAdd(
        this.a.positionCurrent,
        vecMult(n, delta * 0.5)
      );
    }
    if (!this.b.isStatic) {
      this.b.positionCurrent = vecSub(
        this.b.positionCurrent,
        vecMult(n, delta * 0.5)
      );
    }
  }
}
