import { Link } from "./link";
import { Particle } from "./particle";
import { Vec2d } from "./types";
import {
  vecAdd,
  vecDiv,
  vecLength,
  vecMult,
  vecMultScalar,
  vecSub,
} from "./vector";

// 60 updates per second
const SIMULATION_UPDATE_RATE = 60;
const SUB_STEPS = 2;
// coefficient of restitution
const COR = 0.7;

interface SolverOptions {
  gravity: Vec2d;
  updateRate?: number;
  subSteps?: number;
  cor?: number;
}

export class Solver {
  gravity: Vec2d;
  grid: Map<number, Map<number, number[]>>;
  gridMaxX: number;
  gridMaxY: number;
  gridSize: number;
  updateRate: number;
  dt: number;
  subSteps: number;
  cor: number;

  constructor({ gravity, updateRate, subSteps, cor }: SolverOptions) {
    this.gravity = gravity;
    this.gridSize = 40;
    this.gridMaxX = 0;
    this.gridMaxY = 0;
    this.updateRate = updateRate || SIMULATION_UPDATE_RATE;
    this.dt = 1 / this.updateRate;
    this.subSteps = subSteps || SUB_STEPS;
    this.cor = cor || COR;
  }

  update(objects: Particle[], links?: Link[]) {
    const tsGrid = performance.now();
    // console.log(this.grid);
    const subSteps = SUB_STEPS;
    for (let i = 0; i < subSteps; i++) {
      this.makeGrid(objects);
      const subDt = this.dt / subSteps;
      this.applyCoolingAndHeating(objects);
      this.applyGravity(objects);
      this.applyConvection(objects);
      // this.applyConstraint(objects);
      this.applyConstraintBox(objects);
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

  applyConvection(objects: Particle[]) {
    for (let i = 0; i < objects.length; i++) {
      const convectionForce = Math.min(objects[i].temp, 5000) * 1;
      // const convectionAcc = convectionForce / Math.pow(objects[i].mass / 4, 2);
      const convectionAcc = convectionForce;
      objects[i].accelerate([0, -convectionAcc]);
    }
  }

  applyCoolingAndHeating(objects: Particle[]) {
    for (let i = 0; i < objects.length; i++) {
      // Cooling
      const obj = objects[i];
      if (obj.positionCurrent[1] < 850) {
        const dTemp = (850 - obj.positionCurrent[1]) * 0.1;
        obj.temp = Math.max(obj.temp - dTemp, 0);
      }

      // Heating
      if (obj.positionCurrent[1] + obj.radius >= 900) {
        obj.temp = Math.min(
          obj.temp +
            ((obj.positionCurrent[1] - 850) / 5) *
              Math.random() *
              Math.random() *
              20,
          5000
        );
      }
      // obj.radius = Math.min(Math.round(obj.temp / 1000) + 4, 6);
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
        const angle = Math.atan2(toObj[0], toObj[1]);
        if (Math.abs(Math.sin(angle)) < 0.01) {
          obj.temp = Math.min(obj.temp + 100, 5000);
        }
        if (Math.abs(Math.sin(angle)) > 0.95) {
          obj.temp = Math.max(obj.temp - 10, 0);
        }
      }
    }
  }

  applyConstraintBox(objects: Particle[]) {
    const floor = 900;
    const ceil = 0;
    const left = 200;
    const right = 800;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj.positionCurrent[1] + obj.radius > floor) {
        obj.positionCurrent = [obj.positionCurrent[0], floor - obj.radius];
        // let vel = vecSub(obj.positionCurrent, obj.positionPrev);
        // vel = vecMult(vel, 0.9);
        // obj.positionPrev = vecSub(obj.positionCurrent, vel);
      }
      if (obj.positionCurrent[1] - obj.radius < ceil) {
        obj.positionCurrent = [obj.positionCurrent[0], ceil + obj.radius];
      }
      if (obj.positionCurrent[0] - obj.radius < left) {
        obj.positionCurrent = [left + obj.radius + 0, obj.positionCurrent[1]];
      }
      if (obj.positionCurrent[0] + obj.radius > right) {
        obj.positionCurrent = [right - obj.radius - 0, obj.positionCurrent[1]];
      }
    }
  }

  solveCollision(objA: Particle, objB: Particle) {
    if (objA === objB) {
      return;
    }
    const axis = vecSub(objA.positionCurrent, objB.positionCurrent);
    const distance = vecLength(axis);
    if (distance < objA.radius + objB.radius) {
      if (objA.mass && objB.mass) {
        this.solveCollisionInelastic(objA, objB, axis, distance);
      } else {
        this.solveCollisionSimple(objA, objB, axis, distance);
      }
    } else if (distance <= objA.radius + objB.radius + 1) {
      this.transmitTemperature(objA, objB);
    }
  }

  solveCollisionSimple(
    objA: Particle,
    objB: Particle,
    axis: Vec2d,
    distance: number
  ) {
    const delta = objA.radius + objB.radius - distance;
    const n = vecDiv(axis, distance);
    if (!objA.isStatic) {
      objA.positionCurrent = vecAdd(
        objA.positionCurrent,
        vecMult(n, delta * 0.5)
      );
      // objA.positionPrev = objA.positionCurrent;
    }
    if (!objB.isStatic) {
      objB.positionCurrent = vecSub(
        objB.positionCurrent,
        vecMult(n, delta * 0.5)
      );
      // objB.positionPrev = objB.positionCurrent;
    }
  }

  solveCollisionInelastic(
    objA: Particle,
    objB: Particle,
    axis: Vec2d,
    distance: number
  ) {
    const Cr = this.cor;
    const velA = vecSub(objA.positionCurrent, objA.positionPrev);
    const velB = vecSub(objB.positionCurrent, objB.positionPrev);

    // Normal vector
    const un = vecDiv(axis, distance);
    // Tangencial vector
    const ut: Vec2d = [-un[1], un[0]];

    const vAn = vecMultScalar(un, velA);
    const vAt = vecMultScalar(ut, velA);
    const vBn = vecMultScalar(un, velB);
    const vBt = vecMultScalar(ut, velB);

    // Simply solve collision by moving objects to prevent intersection
    this.solveCollisionSimple(objA, objB, axis, distance);

    if (!objA.isStatic) {
      const vAnScalar =
        (Cr * objB.mass * (vBn - vAn) + objA.mass * vAn + objB.mass * vBn) /
        (objA.mass + objB.mass);
      const va = vecAdd(vecMult(un, vAnScalar), vecMult(ut, vAt));
      objA.positionPrev = vecSub(objA.positionCurrent, va);
    }
    if (!objB.isStatic) {
      const vBnScalar =
        (Cr * objA.mass * (vAn - vBn) + objA.mass * vAn + objB.mass * vBn) /
        (objA.mass + objB.mass);
      const vb = vecAdd(vecMult(un, vBnScalar), vecMult(ut, vBt));
      objB.positionPrev = vecSub(objB.positionCurrent, vb);
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
            if (ii === i && jj === j) {
              continue;
            }
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

  transmitTemperature(objA: Particle, objB: Particle) {
    const energyA = objA.mass * objA.temp;
    const energyB = objB.mass * objB.temp;
    const totalEnergy = energyA + energyB;
    const tempEnd = totalEnergy / (objA.mass + objB.mass);
    const dTempA = ((tempEnd - objA.temp) / 1000) * 4;
    const dTempB = ((tempEnd - objB.temp) / 1000) * 4;
    objA.temp += dTempA;
    objB.temp += dTempB;
  }
}
