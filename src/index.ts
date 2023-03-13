import { initAnimation, initCanvas, initContext } from "./modules/scene";

function main() {
  console.log("main");

  const scene: HTMLCanvasElement = document.getElementById(
    "scene"
  ) as HTMLCanvasElement;

  initCanvas(scene);
  // const ctx = initContext(scene);
  initAnimation(scene);
}

main();
