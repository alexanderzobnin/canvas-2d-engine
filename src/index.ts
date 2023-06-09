// import { initAnimation, initCanvas, initContext } from "./modules/scene";
import { init, initCanvas } from "./modules/webglPlayground";
// import { init, initCanvas } from "./modules/webglScene";

function main() {
  const scene: HTMLCanvasElement = document.getElementById(
    "scene"
  ) as HTMLCanvasElement;

  initCanvas(scene);

  // initAnimation(scene);
  init(scene);
}

main();
