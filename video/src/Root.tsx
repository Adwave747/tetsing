import { Composition } from "remotion";
import { BarrelVideo } from "./BarrelVideo";
import { AndromedaVideo } from "./andromeda/AndromedaVideo";
import { TOTAL } from "./andromeda/tl";

export const FPS = 30;
export const RemotionRoot = () => (
  <>
    <Composition id="BarrelVideo" component={BarrelVideo} durationInFrames={25 * FPS} fps={FPS} width={1080} height={1920} />
    <Composition id="AndromedaVideo" component={AndromedaVideo} durationInFrames={Math.ceil(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
