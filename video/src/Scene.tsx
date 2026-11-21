import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Frenchman, Soldier } from "./Characters";
import { brickTexture, floorTexture, labelTexture, staveTexture } from "./textures";
import { L, backOut, clamp, easeInOut, easeOut, mix, prog } from "./timeline";

const H = 2; // barrel height
const radiusAt = (y: number) => 0.75 + 0.15 * Math.sin((Math.PI * y) / H);

const Barrel = ({ label, hot = false, lid = true }: { label: string; hot?: boolean; lid?: boolean }) => {
  const geo = useMemo(() => {
    const pts = Array.from({ length: 24 }, (_, i) => new THREE.Vector2(radiusAt((i / 23) * H), (i / 23) * H));
    return new THREE.LatheGeometry(pts, 48);
  }, []);
  const staves = useMemo(staveTexture, []);
  const lbl = useMemo(() => labelTexture(label, hot), [label, hot]);
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={staves} roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.75, 32]} />
        <meshStandardMaterial color="#2a160b" />
      </mesh>
      {[0.22, 0.6, 1.4, 1.78].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[radiusAt(y) + 0.01, 0.035, 8, 48]} />
          <meshStandardMaterial color="#2b2b2e" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {lid && <Lid />}
      <mesh position={[0, 1.0, radiusAt(1) + 0.015]}>
        <planeGeometry args={[0.95, 0.41]} />
        <meshStandardMaterial map={lbl} roughness={0.9} emissive={hot ? "#ffcc66" : "#000"} emissiveIntensity={hot ? 0.35 : 0} />
      </mesh>
    </group>
  );
};

const Lid = () => (
  <group>
    <mesh castShadow position={[0, 0, 0]}>
      <cylinderGeometry args={[0.77, 0.77, 0.08, 40]} />
      <meshStandardMaterial color="#6e4322" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.6, 40]} />
      <meshStandardMaterial color="#3b220f" />
    </mesh>
  </group>
);

type Cam = { at: number; pos: [number, number, number]; look: [number, number, number] };
const lerp3 = (a: number[], b: number[], k: number) => a.map((v, i) => mix(v, b[i], k)) as [number, number, number];

const CameraRig = ({ t }: { t: number }) => {
  const { camera } = useThree();
  const keys: Cam[] = [
    { at: 0, pos: [-2.6, 2.4, 8.6], look: [0, 1.2, 0] },
    { at: 3.4, pos: [1.6, 2.6, 9.4], look: [0, 1.2, 0] },
    { at: L.step1.start, pos: [-1.5, 2.3, 10.6], look: [-1.3, 1.1, 0] },
    { at: L.step2.start, pos: [-0.8, 3.4, 10.4], look: [-0.8, 1.3, 0] },
    { at: L.knock.start - 0.5, pos: [0.9, 2.1, 9.4], look: [0.7, 1.3, 0] },
    { at: L.step3.start, pos: [0.25, 1.7, 6.2], look: [0.25, 1.25, 0] },
    { at: L.step3.end - 0.2, pos: [0.15, 1.6, 5.3], look: [0.15, 1.25, 0] },
    { at: L.step4.start, pos: [-0.6, 5.2, 15.5], look: [-0.8, 1.0, -1.2] },
    { at: L.result.start, pos: [-0.8, 2.8, 10.5], look: [-0.6, 1.3, 0] },
    { at: L.result.start + 2.2, pos: [0, 2.4, 8.2], look: [0, 1.6, 0] },
    { at: L.end.start, pos: [0, 2.3, 5.6], look: [0, 1.95, 0] },
    { at: 99, pos: [0, 2.3, 5.2], look: [0, 1.95, 0] },
  ];
  let i = keys.findIndex((k) => k.at > t) - 1;
  if (i < 0) i = 0;
  const a = keys[i], b = keys[i + 1];
  // first and slow-push segments glide linearly; everything else is a quick eased cut-move
  const slow = i === 0 || i === 5 || i === 9 || i === 10;
  const k = slow ? prog(t, a.at, b.at) : easeInOut(prog(t, b.at - 0.7, b.at));
  const pos = slow ? lerp3(a.pos, b.pos, k) : lerp3(a.pos, b.pos, 0);
  const look = slow ? lerp3(a.look, b.look, k) : a.look;
  // for "cut-move" segments we hold on a and then ease into b just before b starts
  const fp = slow ? pos : lerp3(a.pos, b.pos, k);
  const fl = slow ? look : lerp3(a.look, b.look, k);
  useLayoutEffect(() => {
    camera.position.set(...fp);
    camera.lookAt(...fl);
    camera.updateProjectionMatrix();
  });
  return null;
};

const KNOCKS = [10.25, 10.45, 10.62];

export const Scene = ({ t }: { t: number }) => {
  const bricks = useMemo(brickTexture, []);
  const floor = useMemo(floorTexture, []);

  // ---- hero barrel tilt (pour) and shakes
  const tiltIn = easeOut(prog(t, L.step1.start + 0.4, L.step1.start + 1.0));
  const tiltOut = easeInOut(prog(t, L.step1.end - 0.5, L.step1.end + 0.1));
  const tilt = 0.6 * tiltIn * (1 - tiltOut);
  const wobble =
    KNOCKS.reduce((s, k) => (t > k ? s + Math.exp(-(t - k) * 9) * Math.sin((t - k) * 45) * 0.05 : s), 0) +
    (t > L.step3.start && t < L.step3.end ? Math.sin(t * 70) * 0.006 : 0) +
    (t > L.result.start + 1.8 ? Math.exp(-(t - L.result.start - 1.8) * 6) * Math.sin((t - L.result.start - 1.8) * 40) * 0.05 : 0);
  const PIV = -0.8;

  // ---- lid: pops off at step1, slams on at end of step2, pops again in result
  const off1 = easeOut(prog(t, L.step1.start, L.step1.start + 0.5));
  const on1 = prog(t, L.step2.start + 1.45, L.step2.start + 1.75);
  const off2 = easeOut(prog(t, L.result.start + 1.8, L.result.start + 2.6));
  let lidPos: [number, number, number] = [0, H + 0.02, 0];
  let lidRot: [number, number, number] = [0, 0, 0];
  if (off2 > 0) { lidPos = [mix(0, 2.2, off2), H + 0.02 + Math.sin(off2 * Math.PI) * 2.2 - off2 * 1.95, mix(0, 0.9, off2)]; lidRot = [0, 0, -off2 * 7.5]; }
  else if (on1 > 0 && t < L.result.start) { lidPos = [0, mix(5, H + 0.02, on1 * on1), 0]; lidRot = [0, 0, 0]; }
  else if (off1 > 0) { lidPos = [mix(0, 3.2, off1), H + 0.02 + Math.sin(off1 * Math.PI) * 1.6 + off1 * 0.2, mix(0, -1, off1)]; lidRot = [off1 * 1.2, 0, -off1 * 6]; }
  if (off1 >= 1 && on1 <= 0) lidPos = [9, -5, 0]; // parked offstage
  if (off2 >= 1) { lidPos = [2.4, 0.1, 1.0]; lidRot = [Math.PI / 2 - 0.1, 0, 0.3]; }

  // ---- Frenchman
  const walkIn = easeOut(prog(t, 2.4, 3.9));
  let gx = mix(-6, -2.65, walkIn), gy = Math.abs(Math.sin(walkIn * Math.PI * 4)) * 0.12 * (1 - walkIn), gz = 0.25;
  let gry = 0.9, grx = 0, gscale = 1;
  const pouring = clamp((tilt - 0.45) / 0.15) * (t < L.step1.end - 0.4 ? 1 : 0);
  const belly = 1 + 0.35 * easeInOut(prog(t, L.step1.start + 1.0, L.step1.end - 0.4));
  const jump = prog(t, L.step2.start + 0.35, L.step2.start + 1.25);
  if (jump > 0) {
    gx = mix(-2.65, 0, jump);
    gz = mix(0.25, 0, jump);
    gy = Math.sin(jump * Math.PI) * 2.7 + mix(0, 0.02, jump) - (jump > 0.85 ? (jump - 0.85) * 0.2 : 0);
    gry = mix(0.9, Math.PI * 2, easeInOut(jump));
  }
  const pop = backOut(prog(t, L.result.start + 1.85, L.result.start + 2.35));
  if (t > L.result.start + 1.8) { gy = mix(0.02, 0.95, pop); gry = 0; }
  const insideHidden = jump >= 1 && t < L.result.start + 1.8 && t > L.step2.start + 1.9; // hidden under lid
  if (t > L.end.start) grx = Math.sin((t - L.end.start) * 5) * 0.06;
  const blink = (t % 2.7) < 0.12;

  // ---- wine stream (bezier from low rim to his mouth)
  const th = tilt;
  const rimLow = [PIV + (0.8 * Math.cos(th) - H * Math.sin(th)) - 0.75 * Math.cos(th), 0.8 * Math.sin(th) + H * Math.cos(th) - 0.75 * Math.sin(th)];
  const mouth = [-2.65 + 0.23, 1.38];
  const ctrl = [(rimLow[0] + mouth[0]) / 2, Math.max(rimLow[1], mouth[1]) + 0.35];
  const drops = Array.from({ length: 34 }, (_, i) => {
    const u = (t * 2.4 + i / 34) % 1;
    const x = (1 - u) ** 2 * rimLow[0] + 2 * (1 - u) * u * ctrl[0] + u * u * mouth[0];
    const y = (1 - u) ** 2 * rimLow[1] + 2 * (1 - u) * u * ctrl[1] + u * u * mouth[1];
    return [x, y, 0.25 * u] as [number, number, number];
  });
  const puddle = easeOut(prog(t, L.step1.start + 1.2, L.step1.end));

  // ---- soldier path
  let sx = mix(5.5, 1.6, easeOut(prog(t, L.step2.start + 1.6, L.knock.start - 0.55))), sz = 0.55, sry = -1.05, sbob = 0;
  const walking = (t > L.step2.start + 1.6 && t < L.knock.start - 0.55) || (t > L.step4.start && t < L.step4.start + 1.1) || (t > L.result.start && t < L.result.start + 1.6);
  if (walking) sbob = Math.abs(Math.sin(t * 14)) * 0.08;
  const toInspect = easeInOut(prog(t, L.step4.start, L.step4.start + 1.1));
  if (toInspect > 0) { sx = mix(1.6, -2.3, toInspect); sz = mix(0.55, -1.25, toInspect); sry = mix(-1.05, Math.PI, toInspect); }
  const leave = easeInOut(prog(t, L.result.start, L.result.start + 1.6));
  if (leave > 0) { sx = mix(-2.3, -8, leave); sz = mix(-1.25, 0.6, leave); sry = mix(Math.PI, -Math.PI / 2, Math.min(1, leave * 3)); }
  const knock = KNOCKS.reduce((m, k) => Math.max(m, t > k - 0.08 && t < k + 0.1 ? 1 - Math.abs(t - k) / 0.1 : 0), 0);
  const lean = t > L.step4.start + 1.1 && t < L.result.start ? 0.35 * easeOut(prog(t, L.step4.start + 1.1, L.step4.start + 1.5)) : 0;
  const headTurn = t > L.knock.end && t < L.step4.start ? Math.sin((t - L.knock.end) * 2.2) * 0.6 : 0;
  const soldierVisible = t > L.step2.start + 1.5 && t < L.result.start + 1.65;

  // ---- sparkles around the clean, fragrant survivor
  const sparkleOn = prog(t, L.result.start + 2.0, L.result.start + 2.4);
  const bulbSwing = Math.sin(t * 1.6) * 0.12 + wobble * 2;

  return (
    <>
      <color attach="background" args={["#140b07"]} />
      <fog attach="fog" args={["#140b07", 12, 30]} />
      <ambientLight intensity={0.35} color="#ffd9b0" />
      <hemisphereLight args={["#ffcf99", "#2a1208", 0.45]} />
      <spotLight position={[1.5, 7.5, 5]} angle={0.75} penumbra={0.6} intensity={110} decay={1.6} color="#ffd29a" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <pointLight position={[-4, 3, 4]} intensity={18} color="#ff9a5a" decay={1.6} />
      <pointLight position={[4, 2.5, -1]} intensity={10} color="#7aa0ff" decay={1.6} />

      {/* hanging bulb */}
      <group position={[0, 5.6, 0.6]} rotation={[0, 0, bulbSwing]}>
        <mesh position={[0, 0.0, 0]}><cylinderGeometry args={[0.01, 0.01, 1.6]} /><meshBasicMaterial color="#111" /></mesh>
        <mesh position={[0, -0.85, 0]}><sphereGeometry args={[0.13, 16, 16]} /><meshBasicMaterial color="#fff1c8" /></mesh>
        <pointLight position={[0, -0.95, 0]} intensity={8} color="#ffcf8a" decay={1.8} />
      </group>

      {/* cellar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[40, 40]} /><meshStandardMaterial map={floor} roughness={0.9} /></mesh>
      <mesh position={[0, 5, -4.2]} receiveShadow><planeGeometry args={[30, 10]} /><meshStandardMaterial map={bricks} roughness={1} /></mesh>

      {/* the other barrels nobody would ever suspect... except they do */}
      {([[-4.6, "CHARDONNAY"], [-2.3, "ROSÉ"], [2.3, "RIESLING"], [4.6, "CABERNET"], [6.9, "BEAUJOLAIS"], [-6.9, "SANCERRE"]] as const).map(([x, name]) => (
        <group key={name} position={[x, 0, -2.5]} rotation={[0, (x * 0.13) % 0.3, 0]}><Barrel label={name} /></group>
      ))}

      {/* hero barrel */}
      <group position={[PIV, 0, 0]} rotation={[0, 0, tilt + wobble]}>
        <group position={[-PIV, 0, 0]}>
          <Barrel label="MERLOT" hot={t > L.step4.start + 0.8 && t < L.result.start} lid={false} />
        </group>
      </group>
      <group position={lidPos} rotation={lidRot}><Lid /></group>

      {/* wine */}
      {pouring > 0.01 && drops.map((p, i) => (
        <mesh key={i} position={p} scale={pouring}><sphereGeometry args={[0.075, 10, 10]} /><meshStandardMaterial color="#7a0a1e" roughness={0.15} metalness={0.1} /></mesh>
      ))}
      {puddle > 0 && t < L.result.start && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.25, 0.012, 0.6]} scale={[puddle * 1.1, puddle * 0.8, 1]}>
          <circleGeometry args={[0.8, 40]} /><meshStandardMaterial color="#5c0716" roughness={0.05} />
        </mesh>
      )}

      {!insideHidden && (
        <group position={[gx, gy, gz]} rotation={[grx, gry, 0]} scale={gscale}>
          <Frenchman belly={belly} mouthOpen={pouring * 0.9} blink={blink} />
        </group>
      )}

      {soldierVisible && (
        <group position={[sx, sbob, sz]} rotation={[0, sry, 0]}>
          <Soldier knock={knock} lean={lean} headTurn={headTurn} />
        </group>
      )}

      {sparkleOn > 0 && Array.from({ length: 9 }, (_, i) => {
        const a = t * 1.8 + (i / 9) * Math.PI * 2;
        const r = 0.75 + 0.1 * Math.sin(t * 3 + i);
        return (
          <mesh key={i} position={[Math.cos(a) * r, gy + 1.65 + Math.sin(a * 2 + i) * 0.2, Math.sin(a) * r]} scale={sparkleOn * (0.7 + 0.3 * Math.sin(t * 9 + i))} rotation={[t * 3, t * 2, 0]}>
            <octahedronGeometry args={[0.07]} /><meshBasicMaterial color={i % 3 === 0 ? "#ffffff" : "#ffd45a"} />
          </mesh>
        );
      })}

      <CameraRig t={t} />
    </>
  );
};
