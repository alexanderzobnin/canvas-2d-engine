export async function loadShaderSource(path: string) {
  const response = await fetch("./shaders/" + path);
  const shaderSource = response.text();
  return shaderSource;
}

export async function loadImage(path: string): Promise<HTMLImageElement> {
  let image = new Image();
  image.src = path;

  return new Promise((resolve) => {
    image.onload = () => {
      resolve(image);
    };
  });
}
