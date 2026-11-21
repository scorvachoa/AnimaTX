import React from "react";
import { AbsoluteFill, Composition, registerRoot } from "remotion";
import { CaptionVideo, defaults, Project } from "./Video";
type ExportProps = {
  project: Project;
  src: string;
  outputWidth: number;
  outputHeight: number;
  renderFps: number;
};
function ExportVideo({ project, src, outputWidth, outputHeight }: ExportProps) {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          width: project.width,
          height: project.height,
          transformOrigin: "top left",
          transform: `scale(${outputWidth / project.width}, ${outputHeight / project.height})`,
        }}
      >
        <CaptionVideo project={project} src={src} />
      </div>
    </AbsoluteFill>
  );
}
registerRoot(() => (
  <Composition
    id="CaptionVideo"
    component={ExportVideo}
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
      outputWidth: 1080,
      outputHeight: 1920,
      renderFps: 30,
    }}
    calculateMetadata={({ props }) => ({
      width: props.outputWidth,
      height: props.outputHeight,
      fps: props.renderFps,
      durationInFrames: Math.max(
        1,
        Math.ceil(props.project.duration * props.renderFps),
      ),
    })}
  />
));
