import React from "react";
import { Composition, registerRoot } from "remotion";
import { CaptionVideo, defaults } from "./Video";
registerRoot(() => (
  <Composition
    id="CaptionVideo"
    component={CaptionVideo}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30}
    defaultProps={{
      project: {
        id: "",
        name: "",
        duration: 1,
        width: 1080,
        height: 1920,
        words: [],
        style: defaults,
      },
      src: "",
    }}
    calculateMetadata={({ props }) => ({
      width: props.project.width,
      height: props.project.height,
      durationInFrames: Math.max(1, Math.ceil(props.project.duration * 30)),
    })}
  />
));
