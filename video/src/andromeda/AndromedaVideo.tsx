import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { LakeScene } from "./LakeScene";
import { Overlay } from "./Overlay";

export const AndromedaVideo = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: "#06182a" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 50, position: [0, 9, 17], near: 0.1, far: 300 }}>
        <LakeScene t={t} />
      </ThreeCanvas>
      <Overlay t={t} />
      <Audio src={staticFile("andromeda/mix.wav")} />
    </AbsoluteFill>
  );
};
