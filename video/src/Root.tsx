import { Composition } from "remotion";
import { BarrelVideo } from "./BarrelVideo";
import { AdBreakdown, BreakdownProps } from "./breakdown/AdBreakdown";
import { breakdowns } from "./breakdown/data";

export const FPS = 30;
export const RemotionRoot = () => (
  <>
    <Composition id="BarrelVideo" component={BarrelVideo} durationInFrames={25 * FPS} fps={FPS} width={1080} height={1920} />
    {breakdowns.map((b: BreakdownProps) => (
      <Composition key={b.id} id={b.id} component={AdBreakdown as any} durationInFrames={Math.round(b.duration * FPS)} fps={FPS} width={1080} height={1920} defaultProps={b} />
    ))}
  </>
);
