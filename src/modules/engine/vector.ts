import { Vec2d } from "./types";

export function vecAdd(a: Vec2d, b: Vec2d): Vec2d {
  return [a[0] + b[0], a[1] + b[1]];
}

export function vecSub(a: Vec2d, b: Vec2d): Vec2d {
  return [a[0] - b[0], a[1] - b[1]];
}

export function vecMult(a: Vec2d, b: number): Vec2d {
  return [a[0] * b, a[1] * b];
}

export function vecDiv(a: Vec2d, b: number): Vec2d {
  return [a[0] / b, a[1] / b];
}

export function vecLength(a: Vec2d) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}
