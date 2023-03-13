import { Particle } from "./particle";
import { Vec2d } from "./types";
import { vecAdd, vecDiv, vecLength, vecMult, vecSub } from "./vector";

export class Solver {
  gravity: Vec2d;

  constructor(gravity: Vec2d) {
    this.gravity = gravity;
  }

  update(dt: number, objects: Particle[]) {
    const subSteps = 8;
    for (let i = 0; i < subSteps; i++) {
      const subDt = dt / subSteps;
      this.applyGravity(objects);
      this.applyConstraint(objects);
      // this.applyConstraintFlat(objects);
      this.solveCollision(objects);
      this.updatePosition(subDt, objects);
    }
  }

  updatePosition(dt: number, objects: Particle[]) {
    for (let i = 0; i < objects.length; i++) {
      objects[i].updatePosition(dt);
    }
  }

  applyGravity(objects: Particle[]) {
    for (let i = 0; i < objects.length; i++) {
      objects[i].accelerate(this.gravity);
    }
  }

  applyConstraint(objects: Particle[]) {
    const center: Vec2d = [600, 400];
    const radius = 400;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const toObj = vecSub(obj.positionCurrent, center);
      const distance = vecLength(toObj);
      if (distance > radius - obj.radius) {
        const n = vecDiv(toObj, distance);
        const newPos = vecMult(n, radius - obj.radius);
        obj.positionCurrent = vecAdd(newPos, center);
      }
    }
  }

  applyConstraintFlat(objects: Particle[]) {
    const floor = 800;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const floorPoint: Vec2d = [obj.positionCurrent[0], floor];
      const toObj = vecSub(obj.positionCurrent, floorPoint);
      const distance = vecLength(toObj);
      if (distance < 20) {
        obj.positionCurrent = [obj.positionCurrent[0], floor - obj.radius];
      }
    }
  }

  solveCollision(objects: Particle[]) {
    for (let i = 0; i < objects.length; i++) {
      const objA = objects[i];
      for (let j = i + 1; j < objects.length; j++) {
        const objB = objects[j];
        if (i != j) {
          const collisionAxis = vecSub(
            objA.positionCurrent,
            objB.positionCurrent
          );
          const distance = vecLength(collisionAxis);
          if (distance < objA.radius + objB.radius) {
            const delta = objA.radius + objB.radius - distance;
            const n = vecDiv(collisionAxis, distance);
            objA.positionCurrent = vecAdd(
              objA.positionCurrent,
              vecMult(n, delta * 0.5)
            );
            objB.positionCurrent = vecSub(
              objB.positionCurrent,
              vecMult(n, delta * 0.5)
            );
          }
        }
      }
    }
  }
}
