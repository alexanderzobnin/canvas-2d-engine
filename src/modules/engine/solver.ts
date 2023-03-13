import { Link } from "./link";
import { Particle } from "./particle";
import { Vec2d } from "./types";
import { vecAdd, vecDiv, vecLength, vecMult, vecSub } from "./vector";

export class Solver {
  gravity: Vec2d;
  grid: Map<number, Map<number, number[]>>;
  gridMaxX: number;
  gridMaxY: number;
  gridSize: number;

  constructor(gravity: Vec2d) {
    this.gravity = gravity;
    this.gridSize = 40;
    this.gridMaxX = 0;
    this.gridMaxY = 0;
  }

  update(dt: number, objects: Particle[], links?: Link[]) {
    const tsGrid = performance.now();
    // console.log(this.grid);
    const subSteps = 8;
    for (let i = 0; i < subSteps; i++) {
      this.makeGrid(objects);
      const subDt = dt / subSteps;
      this.applyGravity(objects);
      this.applyConstraint(objects);
      // this.applyConstraintFlat(objects);
      this.solveLinks(links);
      // this.solveCollisions(objects);
      this.solveCollisionsGrid(objects);
      this.updatePosition(subDt, objects);
    }
    // console.log(`${Math.floor((performance.now() - tsGrid) * 100) / 100} ms`);
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

  solveCollision(objA: Particle, objB: Particle) {
    if (objA === objB) {
      return;
    }
    const collisionAxis = vecSub(objA.positionCurrent, objB.positionCurrent);
    const distance = vecLength(collisionAxis);
    if (distance < objA.radius + objB.radius) {
      const delta = objA.radius + objB.radius - distance;
      const n = vecDiv(collisionAxis, distance);
      if (!objA.isStatic) {
        objA.positionCurrent = vecAdd(
          objA.positionCurrent,
          vecMult(n, delta * 0.5)
        );
      }
      if (!objB.isStatic) {
        objB.positionCurrent = vecSub(
          objB.positionCurrent,
          vecMult(n, delta * 0.5)
        );
      }
    }
  }

  solveCollisions(objects: Particle[]) {
    for (let i = 0; i < objects.length; i++) {
      const objA = objects[i];
      for (let j = i + 1; j < objects.length; j++) {
        const objB = objects[j];
        if (i != j) {
          this.solveCollision(objA, objB);
        }
      }
    }
  }

  solveCollisionsGrid(objects: Particle[]) {
    const gridSize = this.gridSize;
    for (let i = 0; i < this.gridMaxX; i += gridSize) {
      for (let j = 0; j < this.gridMaxY; j += gridSize) {
        const startX = Math.max(0, i - gridSize);
        const endX = Math.min(this.gridMaxX, i + gridSize);
        const startY = Math.max(0, j - gridSize);
        const endY = Math.min(this.gridMaxY, j + gridSize);
        let gridObjects: Particle[] = [];
        const centerCell = this.grid.get(i)?.get(j);
        if (centerCell) {
          for (let k = 0; k < centerCell.length; k++) {
            gridObjects.push(objects[centerCell[k]]);
          }
        }
        for (let ii = startX; ii <= endX; ii += gridSize) {
          for (let jj = startY; jj <= endY; jj += gridSize) {
            const obj = this.grid.get(ii)?.get(jj);
            if (obj) {
              // gridObjects.push(...obj);
              const cellObjects: Particle[] = [];
              for (let k = 0; k < obj.length; k++) {
                cellObjects.push(objects[obj[k]]);
              }
              this.solveCollisions(gridObjects.concat(cellObjects));
            }
          }
        }
      }
    }
  }

  solveLinks(links: Link[]) {
    if (!links) {
      return;
    }
    for (let i = 0; i < links.length; i++) {
      const l = links[i];
      l.apply();
    }
  }

  makeGrid(objects: Particle[]) {
    const grid: Map<number, Map<number, number[]>> = new Map();
    const gridSize = this.gridSize;
    for (let i = 0; i < objects.length; i++) {
      const objX =
        Math.floor(objects[i].positionCurrent[0] / gridSize) * gridSize;
      const objY =
        Math.floor(objects[i].positionCurrent[1] / gridSize) * gridSize;
      if (objX > this.gridMaxX) {
        this.gridMaxX = objX;
      }
      if (objY > this.gridMaxY) {
        this.gridMaxY = objY;
      }
      if (!grid.get(objX)) {
        grid.set(objX, new Map<number, number[]>());
      }
      if (!grid.get(objX).get(objY)) {
        grid.get(objX).set(objY, []);
      }
      grid.get(objX).get(objY).push(i);
    }
    this.grid = grid;
  }
}
