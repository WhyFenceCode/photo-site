export function gradient(pal: string[], i: number): string {
  const a = (i * 47 + pal.length * 31) % 360;
  return `radial-gradient(circle at ${20 + (i * 23) % 60}% ${25 + (i * 37) % 50}%,${pal[i % 4]} 0,transparent 45%),radial-gradient(circle at ${75 - (i * 17) % 50}% ${70 - (i * 29) % 45}%,${pal[(i + 1) % 4]} 0,transparent 55%),linear-gradient(${a}deg,${pal[(i + 2) % 4]},${pal[(i + 3) % 4]})`;
}
