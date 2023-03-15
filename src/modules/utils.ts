export async function loadShaderSource(path: string) {
  const response = await fetch("./shaders/" + path);
  const shaderSource = response.text();
  return shaderSource;
}
