export function getTemperatureColorScale(temp: number) {
  const hue = Math.floor(temp / 60);
  const saturation = 100;
  // const l = (Math.log(20) / Math.log(1000 - temp + 1)) * 100 + 10;
  const l = Math.floor(temp / 60 + 20);
  const color = `hsl(${hue},${saturation}%,${l}%)`;
  return color;
}
