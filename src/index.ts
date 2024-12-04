// import { initAnimation, initCanvas, initContext } from "./modules/scene";
// import { initScene, initCanvas } from "./modules/webGL/webglPlayground";
// import { initScene, initCanvas } from "./modules/webGL/webglScene";
// import { initScene, initCanvas } from "./modules/webGL/webglImageProcess";
import { initScene, initCanvas } from "./modules/webGL/webglParticles";

function main() {
  const scene: HTMLCanvasElement = document.getElementById(
    "scene"
  ) as HTMLCanvasElement;

  initCanvas(scene);

  // initAnimation(scene);
  initScene(scene);
}

main();
