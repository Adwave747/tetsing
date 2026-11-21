import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Scene } from "./Scene";
import { Overlay } from "./Overlay";

export const BarrelVideo = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: "#1a0f0a" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 42, position: [0, 2, 9] }}>
        <Scene t={t} />
      </ThreeCanvas>
      <Overlay t={t} />
      <Audio src={staticFile("mix.wav")} />
    </AbsoluteFill>
  );
};
