import { useMemo } from "react";
import * as THREE from "three";
import { stripeTexture } from "./textures";

const skin = "#f2c29b";

/** Our hero: Breton stripes, beret, fine moustache. Origin at his feet. */
export const Frenchman = ({ belly = 1, mouthOpen = 0, blink = false }: { belly?: number; mouthOpen?: number; blink?: boolean }) => {
  const stripes = useMemo(stripeTexture, []);
  return (
    <group>
      <mesh position={[0, 0.62, 0]} scale={[belly, 1, belly]} castShadow>
        <capsuleGeometry args={[0.32, 0.6, 8, 24]} />
        <meshStandardMaterial map={stripes} roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.36 * belly, 0.72, 0]} rotation={[0, 0, s * 0.35]} castShadow>
          <capsuleGeometry args={[0.09, 0.42, 6, 12]} />
          <meshStandardMaterial map={stripes} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.495, 0.29]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#e8a07c" />
      </mesh>
      {/* beret */}
      <mesh position={[0.04, 1.75, 0]} rotation={[0, 0, -0.18]} scale={[1.08, 0.32, 1.08]} castShadow>
        <sphereGeometry args={[0.3, 32, 16]} />
        <meshStandardMaterial color="#14141c" roughness={0.9} />
      </mesh>
      <mesh position={[0.06, 1.86, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.07, 8]} />
        <meshStandardMaterial color="#14141c" />
      </mesh>
      {/* eyes */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.1, 1.58, 0.265]} scale={[1, blink ? 0.15 : 1, 1]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      {/* curly moustache */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.07, 1.43, 0.285]} rotation={[0, 0, s * -0.35]}>
          <capsuleGeometry args={[0.022, 0.1, 4, 8]} />
          <meshStandardMaterial color="#1b120c" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.14, 1.45, 0.27]} rotation={[0, 0, s * 0.9]}>
          <capsuleGeometry args={[0.016, 0.04, 4, 8]} />
          <meshStandardMaterial color="#1b120c" />
        </mesh>
      ))}
      <mesh position={[0, 1.37, 0.27]} scale={[1, 0.3 + mouthOpen, 0.5]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#5a1018" />
      </mesh>
    </group>
  );
};

/** A generic, cartoonishly stern soldier in a grey-green coat and helmet. No insignia. */
export const Soldier = ({ knock = 0, lean = 0, headTurn = 0 }: { knock?: number; lean?: number; headTurn?: number }) => {
  const coat = "#5d6449";
  return (
    <group rotation={[lean, 0, 0]}>
      <mesh position={[0, 0.78, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.85, 8, 24]} />
        <meshStandardMaterial color={coat} roughness={0.85} />
      </mesh>
      {/* belt */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 24]} />
        <meshStandardMaterial color="#2a2118" />
      </mesh>
      {/* left arm hangs; right arm knocks */}
      <mesh position={[-0.42, 1.0, 0]} rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.1, 0.5, 6, 12]} />
        <meshStandardMaterial color={coat} />
      </mesh>
      <group position={[0.38, 1.3, 0]} rotation={[-0.4 - knock * 1.3, 0, -0.15]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 6, 12]} />
          <meshStandardMaterial color={coat} />
        </mesh>
        <mesh position={[0, -0.62, 0]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
      <group position={[0, 1.72, 0]} rotation={[0, headTurn, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.29, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        {/* helmet dome + flared brim */}
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#4b4f43" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.36, 0.42, 0.12, 32, 1, true]} />
          <meshStandardMaterial color="#4b4f43" roughness={0.5} metalness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* grumpy brows */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0.06, 0.27]} rotation={[0, 0, s * 0.45]}>
            <boxGeometry args={[0.12, 0.03, 0.02]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, -0.02, 0.26]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
        <mesh position={[0, -0.06, 0.29]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#e39a78" />
        </mesh>
        <mesh position={[0, -0.16, 0.26]}>
          <boxGeometry args={[0.12, 0.02, 0.02]} />
          <meshStandardMaterial color="#5a1018" />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.15, 0.05, 0.05]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.34]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};
