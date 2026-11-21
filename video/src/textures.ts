import * as THREE from "three";

const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};

/** Vertical oak staves that wrap around the lathe barrel. */
export const staveTexture = () =>
  canvasTex(1024, 256, (c) => {
    const staves = 18, w = 1024 / staves;
    for (let i = 0; i < staves; i++) {
      const l = 30 + ((i * 37) % 11);
      c.fillStyle = `hsl(${24 + (i % 3) * 2}, 52%, ${l}%)`;
      c.fillRect(i * w, 0, w, 256);
      for (let g = 0; g < 7; g++) { // wood grain
        c.strokeStyle = `rgba(40,20,8,${0.12 + 0.06 * (g % 2)})`;
        c.lineWidth = 1.5;
        c.beginPath();
        const x = i * w + 5 + g * (w / 7);
        c.moveTo(x, 0);
        c.bezierCurveTo(x + 4, 80, x - 4, 170, x + 2, 256);
        c.stroke();
      }
      c.fillStyle = "rgba(20,8,2,0.85)";
      c.fillRect(i * w, 0, 3, 256);
    }
  });

export const labelTexture = (text: string, hot = false) =>
  canvasTex(512, 220, (c) => {
    c.fillStyle = hot ? "#fff3c4" : "#efe2c0";
    c.beginPath(); c.roundRect(8, 8, 496, 204, 24); c.fill();
    c.strokeStyle = "#6b1020"; c.lineWidth = 10; c.stroke();
    c.fillStyle = "#6b1020";
    c.font = `900 ${text.length > 8 ? 64 : 84}px Inter`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(text, 256, 102);
    c.font = "600 30px Inter"; c.fillStyle = "#7a5a3a";
    c.fillText("CUVÉE 1943", 256, 172);
  });

export const stripeTexture = () =>
  canvasTex(64, 256, (c) => {
    c.fillStyle = "#f4f1ea"; c.fillRect(0, 0, 64, 256);
    c.fillStyle = "#1d2b5a";
    for (let y = 0; y < 256; y += 32) c.fillRect(0, y, 64, 14);
  });

export const brickTexture = () => {
  const t = canvasTex(512, 512, (c) => {
    c.fillStyle = "#2a1811"; c.fillRect(0, 0, 512, 512);
    const bh = 42, bw = 120;
    for (let r = 0; r < 13; r++)
      for (let k = -1; k < 6; k++) {
        const x = k * bw + (r % 2 ? bw / 2 : 0);
        c.fillStyle = `hsl(14, 38%, ${17 + ((r * 7 + k * 13) % 7)}%)`;
        c.fillRect(x + 4, r * bh + 4, bw - 8, bh - 8);
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 2);
  return t;
};

export const floorTexture = () => {
  const t = canvasTex(512, 512, (c) => {
    c.fillStyle = "#3b2618"; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = `hsl(22, 35%, ${16 + (i % 3) * 2}%)`;
      c.fillRect(0, i * 64 + 2, 512, 60);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 6);
  return t;
};
