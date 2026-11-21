import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C, L, S, clamp, easeInOut, easeOut, mix, pop, prog, rng, win } from "./tl";
import { glowTex, labelTex, skyTex } from "./labels";

type V3 = [number, number, number];
const lerp3 = (a: V3, b: V3, k: number): V3 => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------------------------------------------------------- layout
const SCHOOLS: { color: string; pos: V3; name: string }[] = [
  { color: C.schools[0], pos: [-1.9, -2.6, -6], name: "BUSY PARENTS" },
  { color: C.schools[1], pos: [2.0, -4.9, -6.5], name: "GYM LOVERS" },
  { color: C.schools[2], pos: [-1.9, -7.4, -6], name: "BARGAIN HUNTERS" },
  { color: C.schools[3], pos: [2.0, -10.0, -6.5], name: "GIFT BUYERS" },
];
const BAIT: V3 = [1.3, -1.3, -5];
const GREY = new THREE.Color("#b9c7d1");

// ---------------------------------------------------------------- camera
type Key = { at: number; pos: V3; look: V3 };
const KEYS: Key[] = [
  { at: 0, pos: [0, 9, 17], look: [0, 0, -4] },
  { at: 5, pos: [2.5, 6.5, 13], look: [0, 0, -5] },
  { at: 16.6, pos: [-1, 4.5, 10], look: [0, -1, -5] },
  { at: 18.8, pos: [0, -4.6, 9.5], look: [0, -5.6, -6] },
  { at: 25.5, pos: [0.3, -5, 9.2], look: [0, -5.8, -6] },
  { at: 31.5, pos: [0, -5.3, 10], look: [0, -6, -6] },
  { at: 45.5, pos: [-0.3, -5.6, 9.6], look: [0, -6, -6] },
  { at: 54.4, pos: [0.5, -4.6, 9.4], look: [0.6, -5, -6] },
  { at: 58.4, pos: [0, -5.5, 10], look: [0, -6, -6] },
  { at: 64.6, pos: [0, -5.5, 10.2], look: [0, -6, -6] },
  { at: 66.4, pos: [0, -5.9, 12.6], look: [0, -6.1, -6] },
  { at: 84.0, pos: [0.2, -5.7, 12.2], look: [0, -6, -6] },
  { at: 86.6, pos: [0, 4.2, 12], look: [0, -0.5, -5] },
  { at: 92, pos: [0, 9.5, 16], look: [0, 0, -5] },
];

const CameraRig = ({ t }: { t: number }) => {
  const { camera, scene } = useThree();
  let i = KEYS.findIndex((k) => k.at > t) - 1;
  if (i < 0) i = 0;
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = easeInOut(prog(t, a.at, b.at));
  const pos = lerp3(a.pos, b.pos, k);
  const look = lerp3(a.look, b.look, k);
  const under = pos[1] < 0.05;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.lookAt(...look);
    camera.updateProjectionMatrix();
    if (under) {
      scene.background = new THREE.Color("#0b4766");
      scene.fog = new THREE.Fog("#0b4766", 10, 34);
    } else {
      scene.background = new THREE.Color("#0b1d3a");
      scene.fog = new THREE.Fog("#2a3366", 40, 140);
    }
  });
  return null;
};

// ---------------------------------------------------------------- environment
const Water = ({ t, under }: { t: number; under: boolean }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(90, 90, 70, 70).rotateX(-Math.PI / 2), []);
  useLayoutEffect(() => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, 0.14 * Math.sin(0.45 * x + 1.2 * t) + 0.1 * Math.sin(0.62 * z - 1.6 * t) + 0.05 * Math.sin(1.3 * (x + z) + 2.1 * t));
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial
        color={under ? "#6fd3e6" : "#16506e"}
        emissive={under ? "#2a8fb0" : "#081a2a"}
        emissiveIntensity={under ? 0.8 : 0.3}
        metalness={0.2}
        roughness={0.22}
        flatShading
        side={THREE.DoubleSide}
        transparent={under}
        opacity={under ? 0.85 : 1}
      />
    </mesh>
  );
};

const Sky = () => {
  const tex = useMemo(skyTex, []);
  const g = useMemo(glowTex, []);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[100, 24, 16]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} />
      </mesh>
      <sprite position={[-14, 6, -80]} scale={[38, 38, 1]}>
        <spriteMaterial map={g} color="#ffcf8a" transparent opacity={0.9} fog={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
};

const gradTex = () => {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#2aa6c4");
  g.addColorStop(0.4, "#0d5f84");
  g.addColorStop(1, "#021526");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const Underwater = ({ t }: { t: number }) => {
  const grad = useMemo(gradTex, []);
  const r = useMemo(() => rng(7), []);
  const rocks = useMemo(() => Array.from({ length: 9 }, () => ({ x: (r() - 0.5) * 16, z: -3 - r() * 10, s: 0.4 + r() * 0.9, ry: r() * 6 })), [r]);
  const weeds = useMemo(() => Array.from({ length: 14 }, () => ({ x: (r() - 0.5) * 14, z: -2 - r() * 9, h: 1.5 + r() * 2.2, ph: r() * 6, c: r() > 0.5 ? "#2f8f5b" : "#3fae6a" })), [r]);
  return (
    <group>
      <mesh position={[0, -8, -24]}>
        <planeGeometry args={[110, 34]} />
        <meshBasicMaterial map={grad} fog={false} />
      </mesh>
      <mesh position={[0, -12.8, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 40]} />
        <meshStandardMaterial color="#c8b083" roughness={1} />
      </mesh>
      {rocks.map((k, i) => (
        <mesh key={i} position={[k.x, -12.6, k.z]} rotation={[0, k.ry, 0]} scale={[k.s * 1.4, k.s, k.s]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#4f6372" flatShading roughness={0.9} />
        </mesh>
      ))}
      {weeds.map((w, i) => (
        <group key={i} position={[w.x, -12.8, w.z]}>
          {[0, 1, 2, 3].map((j) => {
            const sway = Math.sin(t * 1.3 + w.ph + j * 0.6) * 0.12 * (j + 1);
            return (
              <mesh key={j} position={[sway, (j + 0.5) * (w.h / 4), 0]} rotation={[0, 0, -sway * 0.6]}>
                <cylinderGeometry args={[0.07 - j * 0.012, 0.09 - j * 0.012, w.h / 4 + 0.05, 5]} />
                <meshStandardMaterial color={w.c} flatShading />
              </mesh>
            );
          })}
        </group>
      ))}
      {[-5, -2.2, 0.8, 3.6, 6].map((x, i) => (
        <mesh key={i} position={[x, -7.5, -8 - (i % 2) * 2]} rotation={[0, 0, 0.12 - i * 0.05]}>
          <coneGeometry args={[1.4, 15, 16, 1, true]} />
          <meshBasicMaterial color="#c9f7ff" transparent opacity={0.045 + 0.025 * Math.sin(t * 0.9 + i * 1.7)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  );
};

const Bubbles = ({ t }: { t: number }) => {
  const g = useMemo(glowTex, []);
  const seeds = useMemo(() => { const r = rng(21); return Array.from({ length: 90 }, () => [r(), r(), r(), r()]); }, []);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  useLayoutEffect(() => {
    const pts: number[] = [];
    seeds.forEach(([a, b, c, d], i) => {
      if (i < 50) {
        // ambient bubbles rising from the lake bed
        const y = -12.5 + ((t * (0.5 + d * 0.6) + a * 14) % 13);
        pts.push((b - 0.5) * 12 + Math.sin(t * 2 + i) * 0.1, y, -3 - c * 8);
      } else {
        // splash burst while the camera dives through the surface
        const k = prog(t, 17.4 + a * 0.5, 19.6 + a * 0.5);
        if (k <= 0 || k >= 1) { pts.push(0, 99, 0); return; }
        pts.push((b - 0.5) * 3, -4.2 - (1 - k) * (c * 2) + k * 4.5, 6.5 + (d - 0.5) * 2);
      }
    });
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  });
  return (
    <points geometry={geo}>
      <pointsMaterial map={g} size={0.13} color="#dffbff" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const Boat = ({ t, lines }: { t: number; lines: number }) => {
  const bob = Math.sin(t * 1.4) * 0.06;
  return (
    <group position={[0, 0.15 + bob, -4.2]} rotation={[Math.sin(t * 1.1) * 0.03, 0.4, Math.sin(t * 1.3) * 0.04]}>
      <mesh scale={[1.4, 0.32, 0.6]}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#8a4b2a" flatShading side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.32, 0.52, 1]}>
        <circleGeometry args={[1, 24]} />
        <meshStandardMaterial color="#5a2e18" />
      </mesh>
      {/* fisher */}
      <mesh position={[-0.3, 0.45, 0]}>
        <capsuleGeometry args={[0.18, 0.4, 4, 8]} />
        <meshStandardMaterial color="#ffd23f" />
      </mesh>
      <mesh position={[-0.3, 0.92, 0]}>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#f2c6a0" />
      </mesh>
      <mesh position={[-0.3, 1.04, 0]}>
        <cylinderGeometry args={[0.05, 0.22, 0.12, 12]} />
        <meshStandardMaterial color="#2b3a4a" />
      </mesh>
      {/* rods and lines into the water */}
      {Array.from({ length: lines }, (_, i) => {
        const ang = -0.9 + (i / Math.max(1, lines - 1)) * 1.8;
        const tip: V3 = [0.2 + Math.cos(ang) * 1.6, 1.5, Math.sin(ang) * 1.6];
        const water: V3 = [tip[0] + Math.cos(ang) * 1.6, -0.15 - bob, tip[2] + Math.sin(ang) * 1.6];
        return (
          <group key={i}>
            <Stick a={[-0.1, 0.5, 0]} b={tip} r={0.025} color="#2b2b2e" />
            <Stick a={tip} b={water} r={0.008} color="#ffffff" />
            <Ripple t={t + i * 0.37} pos={[water[0], 0.02 - 0.15 - bob, water[2]]} />
          </group>
        );
      })}
    </group>
  );
};

const Ripple = ({ t, pos }: { t: number; pos: V3 }) => {
  const k = (t * 0.6) % 1;
  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2 + k * 0.8, 0.26 + k * 0.8, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6 * (1 - k)} depthWrite={false} />
    </mesh>
  );
};

/** cylinder between two points */
const Stick = ({ a, b, r = 0.01, color = "#fff", opacity = 1 }: { a: V3; b: V3; r?: number; color?: string; opacity?: number }) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  if (len < 1e-4) return null;
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 5]} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

// ---------------------------------------------------------------- labels
export const Label3D = ({ text, bg, fg = "#06182a", pos, h = 0.5, s = 1, opacity = 1 }: { text: string; bg: string; fg?: string; pos: V3; h?: number; s?: number; opacity?: number }) => {
  const { tex, aspect } = labelTex(text, bg, fg);
  if (s <= 0.001 || opacity <= 0.001) return null;
  return (
    <sprite position={pos} scale={[h * aspect * s, h * s, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent opacity={opacity} depthTest={false} depthWrite={false} fog={false} />
    </sprite>
  );
};

// ---------------------------------------------------------------- fish
const Fish = ({ color, pos, heading, t, s = 1 }: { color: THREE.Color; pos: V3; heading: number; t: number; s?: number }) => {
  const wag = Math.sin(t * 9) * 0.35;
  return (
    <group position={pos} rotation={[0, heading, 0]} scale={s}>
      <mesh scale={[0.5, 0.24, 0.15]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={color} flatShading roughness={0.45} emissive={color} emissiveIntensity={0.18} />
      </mesh>
      <group position={[-0.42, 0, 0]} rotation={[0, wag, 0]}>
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.25]}>
          <coneGeometry args={[0.2, 0.32, 4]} />
          <meshStandardMaterial color={color} flatShading emissive={color} emissiveIntensity={0.18} />
        </mesh>
      </group>
      <mesh position={[0.32, 0.06, 0.1]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0.32, 0.06, -0.1]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
    </group>
  );
};

const FISH_PER = 9;
const fishSeeds = (() => {
  const r = rng(99);
  return SCHOOLS.map(() => Array.from({ length: FISH_PER }, (_, i) => ({ r: 0.45 + r() * 0.85, ph: r() * Math.PI * 2, y: (r() - 0.5) * 0.7, w: 0.55 + r() * 0.35, sub: i % 2, s: 0.8 + r() * 0.35 })));
})();

/** where every fish is and what colour, as a function of time */
const schoolState = (t: number, si: number) => {
  // finer groups: each school splits into two sub-groups during "what it means"
  const split = easeInOut(prog(t, L.mean1.start + 0.3, L.mean1.start + 1.6)) * (1 - easeInOut(prog(t, S.rating, S.rating + 1)));
  // the old single model sees everyone the same: grey sweep during new2
  const bandY = mix(1, -13, prog(t, L.new2.start + 0.3, L.new2.end - 0.2));
  const regrey = 1 - easeOut(prog(t, L.new3.start, L.new3.start + 0.8));
  const wormGrey = si === 1 ? 0 : easeOut(prog(t, L.mean3.start + 1.6, L.mean3.start + 2.4)) * (1 - easeOut(prog(t, S.rating + 0.2, S.rating + 1)));
  // highlight when the matching bait reaches them
  const ghostHit = si === 1 ? win(t, L.recap4.start + 3.0, L.new1.start + 0.4, 0.3, 0.4) : 0;
  const pulse = win(t, L.ad3.start, L.ad6.start, 0.2, 0.4);
  return { split, bandY, regrey, wormGrey, ghostHit, pulse };
};

const School = ({ t, si, attract }: { t: number; si: number; attract?: { to: V3; k: number } }) => {
  const sc = SCHOOLS[si];
  const st = schoolState(t, si);
  const base = new THREE.Color(sc.color);
  return (
    <group>
      {fishSeeds[si].map((f, i) => {
        const dir = si % 2 ? -1 : 1;
        const a = f.ph + t * f.w * dir;
        const subOff = (f.sub ? 0.75 : -0.75) * st.split;
        let p: V3 = [sc.pos[0] + f.r * Math.cos(a) + subOff, sc.pos[1] + f.y + 0.15 * Math.sin(2 * a + f.ph), sc.pos[2] + f.r * 0.6 * Math.sin(a)];
        const vx = -Math.sin(a) * dir, vz = 0.6 * Math.cos(a) * dir;
        let heading = Math.atan2(-vz, vx);
        if (attract && attract.k > 0) {
          const jitter: V3 = [Math.cos(a * 2) * 0.35 - 0.5 * Math.sign(attract.to[0] - sc.pos[0]), Math.sin(a * 3) * 0.25, Math.sin(a * 2) * 0.3];
          const target = add3(attract.to, jitter);
          p = lerp3(p, target, attract.k * (0.55 + 0.45 * ((i % 3) / 2)));
          heading = mix(heading, Math.atan2(-(attract.to[2] - p[2]), attract.to[0] - p[0]), attract.k);
        }
        let c = base.clone();
        if (st.split > 0) c = c.lerp(new THREE.Color(f.sub ? "#ffffff" : "#0b2a44"), 0.22 * st.split);
        const swept = p[1] > st.bandY ? 1 : 0;
        const grey = Math.max(swept * st.regrey * (t > L.new2.start ? 1 : 0), st.wormGrey);
        c = c.lerp(GREY, grey * 0.85);
        const glow = st.ghostHit + st.pulse * (0.5 + 0.5 * Math.sin(t * 8));
        if (glow > 0) c = c.lerp(new THREE.Color("#ffffff"), glow * 0.35);
        return <Fish key={i} color={c} pos={p} heading={heading} t={t + i} s={f.s * (1 + 0.15 * glow)} />;
      })}
    </group>
  );
};

// ---------------------------------------------------------------- baits
const Worm = ({ t, color = "#ff7aa8" }: { t: number; color?: string }) => {
  const geo = useMemo(() => {
    const pts = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(Math.sin(i * 0.9) * 0.12, -i * 0.11, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.065, 6, false);
  }, []);
  return (
    <group rotation={[0, 0, Math.sin(t * 3) * 0.25]}>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} roughness={0.5} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <Hook y={-0.85} />
    </group>
  );
};

const Hook = ({ y }: { y: number }) => (
  <mesh position={[0.06, y, 0]} rotation={[0, 0, Math.PI * 0.1]}>
    <torusGeometry args={[0.1, 0.018, 6, 12, Math.PI * 1.3]} />
    <meshStandardMaterial color="#e6eef5" metalness={0.9} roughness={0.2} />
  </mesh>
);

type LureKind = "spinner" | "fly" | "spoon" | "frog" | "popper" | "jig";
const Lure = ({ kind, t }: { kind: LureKind; t: number }) => {
  const wob = Math.sin(t * 3.2) * 0.2;
  switch (kind) {
    case "spinner":
      return (
        <group rotation={[0, 0, wob]}>
          <mesh scale={[0.12, 0.35, 0.12]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#ff4d5e" emissive="#ff4d5e" emissiveIntensity={0.3} /></mesh>
          <mesh position={[0.18, 0.15, 0]} rotation={[0, t * 9, 0.3]} scale={[0.22, 0.32, 0.04]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#dfe8ef" metalness={0.95} roughness={0.15} emissive="#88a0b0" emissiveIntensity={0.3} /></mesh>
          <Hook y={-0.45} />
        </group>
      );
    case "fly":
      return (
        <group rotation={[0, t * 0.8, wob]}>
          <mesh scale={[0.1, 0.22, 0.1]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#1b1b1b" /></mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[Math.cos(i) * 0.12, 0.05, Math.sin(i) * 0.12]} rotation={[Math.sin(i) * 0.8, 0, Math.cos(i) * 0.8]}>
              <coneGeometry args={[0.05, 0.45, 4]} />
              <meshStandardMaterial color={i % 2 ? "#ffb020" : "#ffd23f"} emissive="#ffb020" emissiveIntensity={0.35} flatShading />
            </mesh>
          ))}
          <Hook y={-0.35} />
        </group>
      );
    case "spoon":
      return (
        <group rotation={[wob * 2, 0, wob]}>
          <mesh scale={[0.2, 0.38, 0.06]}><sphereGeometry args={[1, 14, 10]} /><meshStandardMaterial color="#ffcf4a" metalness={0.9} roughness={0.15} emissive="#c48a12" emissiveIntensity={0.45} /></mesh>
          <Hook y={-0.5} />
        </group>
      );
    case "frog":
      return (
        <group rotation={[0, 0, wob]}>
          <mesh scale={[0.28, 0.2, 0.22]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#3ddc84" emissive="#1f8a4c" emissiveIntensity={0.35} flatShading /></mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[0.14, 0.16, s * 0.1]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#ffffff" /></mesh>
              <mesh position={[0.18, 0.17, s * 0.1]}><sphereGeometry args={[0.035, 6, 6]} /><meshBasicMaterial color="#000" /></mesh>
              <mesh position={[-0.28, -0.08, s * 0.16]} rotation={[0, 0, 1.2 + Math.sin(t * 5) * 0.3]}><cylinderGeometry args={[0.035, 0.035, 0.3, 5]} /><meshStandardMaterial color="#2fb86b" /></mesh>
            </group>
          ))}
          <Hook y={-0.32} />
        </group>
      );
    case "popper":
      return (
        <group rotation={[0, 0, wob]}>
          <mesh><cylinderGeometry args={[0.16, 0.09, 0.55, 12]} /><meshStandardMaterial color="#ff8a3d" emissive="#ff8a3d" emissiveIntensity={0.35} /></mesh>
          <mesh position={[0, 0.28, 0]}><sphereGeometry args={[0.16, 12, 8]} /><meshStandardMaterial color="#ffffff" /></mesh>
          <Hook y={-0.42} />
        </group>
      );
    case "jig":
      return (
        <group rotation={[0, t, wob]}>
          <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.14, 12, 10]} /><meshStandardMaterial color="#b07bff" metalness={0.5} roughness={0.3} emissive="#6b3fc4" emissiveIntensity={0.4} /></mesh>
          {Array.from({ length: 10 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i * 0.63) * 0.08, -0.15, Math.sin(i * 0.63) * 0.08]} rotation={[Math.sin(i * 0.63) * 0.4, 0, -Math.cos(i * 0.63) * 0.4]}>
              <cylinderGeometry args={[0.012, 0.012, 0.4, 3]} />
              <meshStandardMaterial color="#ff4d8d" emissive="#ff4d8d" emissiveIntensity={0.3} />
            </mesh>
          ))}
          <Hook y={-0.42} />
        </group>
      );
  }
};

/** a bait hanging on a line from the surface */
const OnLine = ({ pos, children, s = 1, opacity = 1 }: { pos: V3; children: React.ReactNode; s?: number; opacity?: number }) => {
  if (s <= 0.001) return null;
  return (
    <group>
      <Stick a={[pos[0], 0.2, pos[2]]} b={[pos[0], pos[1] + 0.1, pos[2]]} r={0.012} color="#e8f6ff" opacity={0.55 * opacity} />
      <group position={pos} scale={s}>{children}</group>
    </group>
  );
};

// ---------------------------------------------------------------- the Andromeda current
const curvePts: V3[] = [[-5, -0.6, -4], [0.6, -1.3, -5], [2.4, -2.8, -6], [2.2, -4.9, -6.5], [0, -6.4, -6], [-2.2, -7.6, -6], [0.2, -9.0, -6], [2.4, -10.4, -6.5], [5, -11.5, -6]];
const CURVE = new THREE.CatmullRomCurve3(curvePts.map((p) => new THREE.Vector3(...p)));

const Current = ({ t, opacity, white }: { t: number; opacity: number; white: number }) => {
  const g = useMemo(glowTex, []);
  const seeds = useMemo(() => { const r = rng(5); return Array.from({ length: 360 }, () => [r(), r(), r(), r()]); }, []);
  const geo = useMemo(() => new THREE.BufferGeometry(), []);
  useLayoutEffect(() => {
    const pts: number[] = [];
    seeds.forEach(([a, b, c, d]) => {
      const u = (a + t * 0.07 * (0.7 + d * 0.6)) % 1;
      const p = CURVE.getPointAt(u);
      pts.push(p.x + (b - 0.5) * 0.7, p.y + (c - 0.5) * 0.5, p.z + (d - 0.5) * 0.6);
    });
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  });
  if (opacity <= 0.001) return null;
  const col = new THREE.Color(C.aqua).lerp(new THREE.Color("#ffffff"), white);
  return (
    <points geometry={geo}>
      <pointsMaterial map={g} size={0.32} color={col} transparent opacity={opacity * 0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

/** the old single model: one band of light that sweeps every fish the same way */
const ScanBand = ({ t }: { t: number }) => {
  const k = prog(t, L.new2.start + 0.3, L.new2.end - 0.2);
  const o = win(t, L.new2.start + 0.2, L.new2.end + 0.2, 0.3, 0.4);
  if (o <= 0) return null;
  return (
    <mesh position={[0, mix(1, -13, k), -6]}>
      <boxGeometry args={[14, 0.18, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.45 * o} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

// ---------------------------------------------------------------- specialists (Andromeda 2.0 experts)
const ORIGIN: V3 = [0, -6, -6];
const orbit = (i: number, t: number): V3 => {
  switch (i) {
    case 0: return add3(SCHOOLS[1].pos, [1.5 * Math.cos(2.2 * t), 0.45 * Math.sin(3 * t), 1.0 * Math.sin(2.2 * t)]);
    case 1: return add3(SCHOOLS[2].pos, [1.9 * Math.cos(1.6 * t + 1), 0.3 * Math.sin(2 * t), 1.2 * Math.sin(1.6 * t + 1)]);
    case 2: return add3(BAIT, [0.85 * Math.cos(2.6 * t), -0.6 + 0.3 * Math.sin(1.3 * t), 0.6 * Math.sin(2.6 * t)]);
    default: { const u = 1.1 * t; return [2.2 + 0.9 * Math.sin(2 * u), -7.45 + 2.6 * Math.sin(u), -6.2 + 0.5 * Math.cos(u)]; }
  }
};
const specPos = (i: number, t: number): V3 => {
  const E = L.new3.start + 0.4 + i * 0.15;
  return lerp3(ORIGIN, orbit(i, t), easeOut(prog(t, E, E + 1.3)));
};
const SPEC_NAMES = ["RECENT BITES", "ITS SCHOOL", "WHAT YOUR AD MEANS", "FACEBOOK + INSTAGRAM"];

const Specialists = ({ t }: { t: number }) => {
  const g = useMemo(glowTex, []);
  const vis = win(t, L.new3.start + 0.3, L.mean3.start + 0.5, 0.5, 0.6);
  const geos = useMemo(() => [0, 1, 2, 3].map(() => new THREE.BufferGeometry()), []);
  useLayoutEffect(() => {
    geos.forEach((geo, i) => {
      const pts: number[] = [];
      for (let j = 0; j < 28; j++) pts.push(...specPos(i, t - j * 0.035));
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    });
  });
  if (vis <= 0) return null;
  const inSpecs = t > L.spec1.start - 0.2 && t < L.spec4.end + 0.3;
  return (
    <group>
      {[0, 1, 2, 3].map((i) => {
        const ln = L[`spec${i + 1}`];
        const active = win(t, ln.start - 0.15, ln.end + 0.25, 0.25, 0.3);
        const dim = inSpecs ? 0.45 + 0.55 * active : 1;
        const s = 1 + 0.7 * active;
        const p = specPos(i, t);
        const col = C.specs[i];
        return (
          <group key={i}>
            <points geometry={geos[i]}>
              <pointsMaterial map={g} size={0.28} color={col} transparent opacity={vis * dim * 0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>
            <mesh position={p} scale={0.2 * s * vis}>
              <sphereGeometry args={[1, 14, 10]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <sprite position={p} scale={[1.5 * s * vis, 1.5 * s * vis, 1]}>
              <spriteMaterial map={g} color={col} transparent opacity={vis * dim} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <Label3D text={SPEC_NAMES[i]} bg={col} fg="#06182a" pos={[clamp(p[0], -1.6, 1.6), p[1] + (i === 2 ? -0.95 : 0.75), p[2] + 0.3]} h={0.42} s={pop(t, ln.start, 0.3) * active} opacity={active} />
          </group>
        );
      })}
      {/* "its school": a ring around the whole group */}
      {(() => {
        const o = win(t, L.spec2.start, L.mean3.start + 0.4, 0.4, 0.5) * vis;
        if (o <= 0) return null;
        return (
          <mesh position={SCHOOLS[2].pos} rotation={[Math.PI / 2 - 0.25, 0, t * 0.3]} scale={0.6 + 0.4 * easeOut(prog(t, L.spec2.start, L.spec2.start + 0.6))}>
            <torusGeometry args={[2.1, 0.04, 8, 64]} />
            <meshBasicMaterial color={C.specs[1]} transparent opacity={o * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })()}
    </group>
  );
};

// ---------------------------------------------------------------- the ten identical worms
const WORM_COLORS = ["#ff7aa8", "#ff86ae", "#ff6f9f", "#ff93b6", "#ff7aa0", "#ff80b0", "#ff749e", "#ff8cb2", "#ff7ea6", "#ff70a6"];
const Worms = ({ t }: { t: number }) => {
  const a = L.mean3.start;
  const vis = win(t, a, S.rating + 0.6, 0.2, 0.5);
  if (vis <= 0) return null;
  const merge = easeInOut(prog(t, a + 1.2, a + 2.1));
  const travel = easeInOut(prog(t, a + 2.2, a + 3.4));
  const target: V3 = [SCHOOLS[1].pos[0] - 0.9, SCHOOLS[1].pos[1] + 0.2, SCHOOLS[1].pos[2]];
  return (
    <group>
      {WORM_COLORS.map((c, i) => {
        const drop = easeOut(prog(t, a + i * 0.06, a + 0.6 + i * 0.06));
        const x0 = -2.9 + i * 0.64;
        let p: V3 = [mix(x0, 0, merge), mix(2, -1.2, drop), -4.6];
        p = lerp3(p, target, travel);
        const s = i === 0 ? 1 : 1 - merge;
        return (
          <group key={i}>
            {travel <= 0 && <Stick a={[p[0], 0.2, p[2]]} b={[p[0], p[1] + 0.05, p[2]]} r={0.01} color="#e8f6ff" opacity={0.5 * vis * (i === 0 ? 1 : 1 - merge)} />}
            {s > 0.01 && (
              <group position={p} scale={s * vis * 1.25}>
                <Worm t={t + i * 0.3} color={c} />
              </group>
            )}
          </group>
        );
      })}
      <Label3D text="10 COPIES = 1 BAIT" bg={C.red} fg="#ffffff" pos={[0, -2.6, -4.6]} h={0.55} s={pop(t, a + 1.9, 0.35)} opacity={win(t, a + 1.9, S.rating + 0.3, 0.2, 0.3)} />
    </group>
  );
};

// ---------------------------------------------------------------- Adwave section: angles, ICPs, awareness, formats
const AD_LURES: { kind: LureKind; fmt: string; win: boolean; repl?: LureKind }[] = [
  { kind: "spinner", fmt: "VIDEO", win: true },
  { kind: "fly", fmt: "STATIC", win: false, repl: "popper" },
  { kind: "spoon", fmt: "CAROUSEL", win: true },
  { kind: "frog", fmt: "UGC", win: false, repl: "jig" },
];
const BITE_N = [14, 3, 11, 2];
const lureHome = (i: number): V3 => [-1.5 + i * 1.35, -1.7, -4.8];
const lureSpot = (i: number): V3 => { const sc = SCHOOLS[i].pos; return [sc[0] + (sc[0] < 0 ? 1.9 : -1.9), sc[1] + 0.25, sc[2] + 0.6]; };

const AdwaveSection = ({ t }: { t: number }) => {
  const on = win(t, L.ad2.start - 0.2, S.cta + 1.2, 0.3, 0.8);
  if (on <= 0) return null;
  const descend = easeInOut(prog(t, L.ad6.start + 0.2, L.ad6.start + 2.0));
  const cut = easeInOut(prog(t, L.ad8.start + 0.1, L.ad8.start + 0.8));
  const fresh = easeOut(prog(t, L.ad8.start + 1.3, L.ad8.start + 2.2));
  const winGlow = win(t, L.ad8.start + 0.2, S.cta + 1.2, 0.4, 0.5);
  const bandOn = win(t, L.ad4.start - 0.1, S.cta + 0.8, 0.4, 0.6);
  const bands: { y: number; label: string; ly: number }[] = [
    { y: -0.05, label: "UNAWARE", ly: -0.65 },
    { y: -3.85, label: "PROBLEM AWARE", ly: -4.45 },
    { y: -8.7, label: "READY TO BUY", ly: -9.3 },
  ];
  return (
    <group>
      {/* awareness depth bands */}
      {bands.map((b, i) => {
        const s = pop(t, L.ad4.start + i * 0.28, 0.35);
        return (
          <group key={i}>
            {i > 0 && (
              <mesh position={[0, b.y, -6]} scale={[s, 1, 1]}>
                <boxGeometry args={[11, 0.05, 0.05]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.5 * bandOn} />
              </mesh>
            )}
            <mesh position={[0, mix(b.y, i === 2 ? -12.8 : bands[i + 1].y, 0.5), -6.3]}>
              <planeGeometry args={[11, i === 2 ? 4.1 : Math.abs(b.y - bands[i + 1].y)]} />
              <meshBasicMaterial color={["#7fe3ff", "#3aa0d8", "#1b4c9c"][i]} transparent opacity={0.1 * bandOn * s} depthWrite={false} />
            </mesh>
            <Label3D text={b.label} bg="#ffffff" fg="#06182a" pos={[-3.2, b.ly, -5.5]} h={0.42} s={s} opacity={bandOn} />
          </group>
        );
      })}
      {/* ICP names */}
      {SCHOOLS.map((sc, i) => (
        <Label3D key={i} text={sc.name} bg={sc.color} fg="#06182a" pos={add3(sc.pos, [0, -1.0, 0.6])} h={0.5} s={pop(t, L.ad3.start + i * 0.15, 0.35)} opacity={win(t, L.ad3.start, L.ad6.start + 0.4, 0.2, 0.4)} />
      ))}
      {/* lures */}
      {AD_LURES.map((lu, i) => {
        const appear = pop(t, L.ad2.start + i * 0.18, 0.45);
        const p = lerp3(lureHome(i), lureSpot(i), descend);
        const dropIn: V3 = [p[0], p[1] + (1 - easeOut(prog(t, L.ad2.start + i * 0.18, L.ad2.start + 0.6 + i * 0.18))) * 3, p[2]];
        const alive = lu.win ? 1 : 1 - cut;
        const s = appear * alive * (1 + 0.25 * winGlow * (lu.win ? 1 : 0)) * 1.25;
        const fmtS = pop(t, L.ad5.start + i * 0.12, 0.3) * alive;
        return (
          <group key={i}>
            <OnLine pos={dropIn} s={s} opacity={on * alive}>
              <Lure kind={lu.kind} t={t + i} />
            </OnLine>
            {lu.win && winGlow > 0 && (
              <sprite position={p} scale={[1.6 * winGlow, 1.6 * winGlow, 1]}>
                <spriteMaterial map={glowTex()} color={C.green} transparent opacity={0.7 * winGlow} depthWrite={false} blending={THREE.AdditiveBlending} />
              </sprite>
            )}
            <Label3D text={lu.fmt} bg={C.yellow} fg="#06182a" pos={add3(dropIn, [0, -0.85, 0.2])} h={0.34} s={fmtS} opacity={on} />
            {(() => {
              const k = easeOut(prog(t, L.ad7.start + 0.3 + i * 0.15, L.ad7.start + 1.8 + i * 0.15));
              const n = Math.round(BITE_N[i] * k);
              const verdict = t > L.ad8.start + 0.1 + i * 0.1;
              const txt = verdict ? (lu.win ? "SCALE IT" : "CUT") : `${n} BITES`;
              const bg = lu.win ? C.green : C.red;
              const o = win(t, L.ad7.start + 0.3, S.cta + 0.4, 0.2, 0.4) * (lu.win ? 1 : 1 - 0.6 * cut);
              return <Label3D text={txt} bg={bg} fg={lu.win ? "#06182a" : "#ffffff"} pos={[p[0], p[1] + 0.75, p[2] + 0.4]} h={0.44} s={pop(t, L.ad7.start + 0.3 + i * 0.15, 0.3) * (verdict ? pop(t, L.ad8.start + 0.1 + i * 0.1, 0.3) : 1)} opacity={o} />;
            })()}
            {lu.repl && fresh > 0 && (
              <>
                <OnLine pos={[p[0], p[1] + (1 - fresh) * 4, p[2]]} s={fresh * 1.25}>
                  <Lure kind={lu.repl} t={t + i * 2} />
                </OnLine>
                <Label3D text="NEW" bg={C.aqua} fg="#06182a" pos={[p[0], p[1] - 0.85, p[2] + 0.2]} h={0.34} s={pop(t, L.ad8.start + 1.9, 0.3)} opacity={on} />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
};

// ---------------------------------------------------------------- whole scene
export const LakeScene = ({ t }: { t: number }) => {
  // camera underwater?
  let i = KEYS.findIndex((k) => k.at > t) - 1;
  if (i < 0) i = 0;
  const camY = mix(KEYS[i].pos[1], KEYS[Math.min(i + 1, KEYS.length - 1)].pos[1], easeInOut(prog(t, KEYS[i].at, KEYS[Math.min(i + 1, KEYS.length - 1)].at)));
  const under = camY < 0.05;

  // recap bait + the ghost bait the current carries to the right school
  const baitVis = win(t, L.recap3.start - 0.1, L.mean3.start + 0.3, 0.3, 0.4);
  const ghostK = easeInOut(prog(t, L.recap4.start + 1.2, L.recap4.start + 3.2));
  const ghostVis = win(t, L.recap4.start + 1.0, L.new1.start + 0.3, 0.2, 0.4);
  const ghostTarget: V3 = [SCHOOLS[1].pos[0] - 0.9, SCHOOLS[1].pos[1] + 0.2, SCHOOLS[1].pos[2]];
  const ghostCurve = CURVE.getPointAt(0.12 + ghostK * 0.26);
  const ghostPos: V3 = lerp3([ghostCurve.x, ghostCurve.y, ghostCurve.z], ghostTarget, ghostK * ghostK);

  const currentO = win(t, L.recap4.start, L.new3.start + 1.0, 0.6, 0.9);
  const white = easeOut(prog(t, L.new2.start, L.new2.start + 0.8));

  // Adwave "measure": fish from winning schools swarm their lures
  const bite = win(t, L.ad7.start + 0.2, S.cta + 0.6, 0.8, 0.8);
  const attractFor = (si: number) => (AD_LURES[si].win && bite > 0 ? { to: lureSpot(si), k: bite * 0.75 } : undefined);

  return (
    <>
      <CameraRig t={t} />
      <hemisphereLight args={["#bfefff", "#0b2a44", under ? 1.1 : 0.9]} />
      <directionalLight position={under ? [-6, 12, 6] : [-14, 7, -80]} intensity={under ? 1.4 : 1.7} color={under ? "#d7fbff" : "#ffc98a"} />
      <ambientLight intensity={0.25} />
      <Sky />
      <Water t={t} under={under} />
      <Boat t={t} lines={t > S.cta ? 4 : 1} />
      <Underwater t={t} />
      <Bubbles t={t} />

      {SCHOOLS.map((_, si) => <School key={si} t={t} si={si} attract={attractFor(si)} />)}

      <Current t={t} opacity={currentO} white={white} />
      <ScanBand t={t} />
      <Specialists t={t} />

      {baitVis > 0 && (
        <OnLine pos={BAIT} s={pop(t, L.recap3.start, 0.4) * baitVis * 1.3} opacity={baitVis}>
          <Worm t={t} />
        </OnLine>
      )}
      {ghostVis > 0 && ghostK > 0 && (
        <group position={ghostPos} scale={1.3 * ghostVis}>
          <Worm t={t} color="#7ff3ff" />
        </group>
      )}

      {/* recap labels */}
      <Label3D text="PEOPLE" bg={C.white} pos={[0, -3.6, -5.6]} h={0.55} s={pop(t, L.recap2.start, 0.35)} opacity={win(t, L.recap2.start, L.new1.start, 0.2, 0.3)} />
      <Label3D text="YOUR ADS" bg={C.yellow} pos={[1.3, -2.55, -4.6]} h={0.55} s={pop(t, L.recap3.start, 0.35)} opacity={win(t, L.recap3.start, L.new1.start, 0.2, 0.3)} />
      <Label3D text="ANDROMEDA" bg={C.aqua} pos={[-1.1, -6.5, -5.4]} h={0.55} s={pop(t, L.recap4.start + 0.4, 0.35)} opacity={win(t, L.recap4.start + 0.4, L.new1.start, 0.2, 0.3)} />

      <Worms t={t} />
      <AdwaveSection t={t} />
    </>
  );
};
