import { initAnimation, initCanvas, initContext } from "./modules/scene";
// import { init } from "./modules/webglPlayground";
import { init } from "./modules/webglScene";

function main() {
  const scene: HTMLCanvasElement = document.getElementById(
    "scene"
  ) as HTMLCanvasElement;

  initCanvas(scene);

  // initAnimation(scene);
  init(scene);
}

main();
