import { Composition } from "remotion";
import { MusicVisual } from "./compositions/MusicVisual";

export function RemotionRoot() {
  return (
    <Composition
      id="MusicVisual"
      component={MusicVisual}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ projectId: "demo" }}
    />
  );
}
