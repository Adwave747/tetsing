import { Composition } from "remotion";
import { BarrelVideo } from "./BarrelVideo";

export const FPS = 30;
export const RemotionRoot = () => (
  <Composition id="BarrelVideo" component={BarrelVideo} durationInFrames={25 * FPS} fps={FPS} width={1080} height={1920} />
);
