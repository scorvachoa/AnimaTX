import React from "react";
import { captionCharacters } from "./caption-display.mjs";
import type { CoverSettings } from "./cover.mjs";
import { lineMotion, wordMotion } from "./text-animations.mjs";
import { captionTime, defaultLeadMs } from "./caption-time.mjs";
import {
  captionBlocks,
  captionLineSplit,
  activeCaptionBlock,
} from "./caption-blocks.mjs";
import {
  AbsoluteFill,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
export type Word = {
  id: string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
  cueId?: string;
  style?: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    animation?: string;
    uppercase?: boolean;
  };
};
export type Project = {
  id: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  words: Word[];
  script?: string;
  cover?: CoverSettings;
  style: {
    fontSize: number;
    color: string;
    activeColor: string;
    outline: string;
    y: number;
    x?: number;
    animation: string;
    wordsPerBlock: number;
    twoLines?: boolean;
    firstLineWords?: number;
    fontFamily?: string;
    secondFontFamily?: string;
    secondFontSize?: number;
    secondColor?: string;
    letterSpacing?: number;
    lineGap?: number;
    uppercase?: boolean;
    secondUppercase?: boolean;
    hidePunctuation?: boolean;
    secondLetterSpacing?: number;
    secondAnimation?: string;
    secondActiveColor?: string;
    secondOutline?: string;
    captionLeadMs?: number;
  };
};
export const fonts = [
  "Arial",
  "Impact",
  "Georgia",
  "Courier New",
  "Trebuchet MS",
  "Segoe Print",
  "Segoe Script",
  "Ink Free",
  "Bradley Hand ITC",
  "Lucida Handwriting",
  "Mistral",
  "Comic Sans MS",
];
export const defaults = {
  fontSize: 64,
  color: "#ffffff",
  activeColor: "#c8ff59",
  outline: "#111111",
  y: 76,
  animation: "karaoke",
  wordsPerBlock: 4,
  captionLeadMs: defaultLeadMs,
};
export function CaptionVideo({
  project,
  src,
}: {
  project: Project;
  src: string;
}) {
  const time = captionTime(
      useCurrentFrame() / useVideoConfig().fps,
      project.style.captionLeadMs,
    ),
    s = project.style,
    blocks = captionBlocks(project.words, s.wordsPerBlock);
  const b = activeCaptionBlock(blocks, time);
  const split = captionLineSplit(b ?? [], s.firstLineWords);
  const lines = b
    ? s.twoLines
      ? [b.slice(0, split), b.slice(split)]
      : [b]
    : [];
  return (
    <AbsoluteFill style={{ background: "#090a0b" }}>
      <OffthreadVideo
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      {b && (
        <div
          data-caption-text="true"
          style={{
            position: "absolute",
            top: `${s.y}%`,
            left: `${s.x ?? 50}%`,
            width: "88%",
            textAlign: "center",
            transform: "translate(-50%, -50%)",
            fontWeight: 900,
            fontSize: s.fontSize,
            lineHeight: 1.2,
            letterSpacing: s.letterSpacing ?? 0,
            textTransform: s.uppercase ? "uppercase" : "none",
            paintOrder: "stroke fill",
            WebkitTextStroke: `${Math.max(1, s.fontSize / 18)}px ${s.outline}`,
            textShadow: "0 3px 8px #0008",
          }}
        >
          {lines.map((line, index) => {
            const animation =
              index === 1 ? (s.secondAnimation ?? s.animation) : s.animation;
            const activeColor =
              index === 1
                ? (s.secondActiveColor ?? s.activeColor)
                : s.activeColor;
            const outline =
              index === 1 ? (s.secondOutline ?? s.outline) : s.outline;
            const uppercase =
              index === 1 ? (s.secondUppercase ?? s.uppercase) : s.uppercase;
            const size =
              index === 1 ? (s.secondFontSize ?? s.fontSize) : s.fontSize;
            const motion = lineMotion(animation, time - b[0].start, index);
            return (
              <div
                key={index}
                style={{
                  fontFamily: `${index === 1 ? (s.secondFontFamily ?? "Impact") : (s.fontFamily ?? "Arial")}, sans-serif`,
                  fontSize: size,
                  marginTop: index > 0 ? (s.lineGap ?? 0) : 0,
                  letterSpacing:
                    index === 1
                      ? (s.secondLetterSpacing ?? s.letterSpacing ?? 0)
                      : (s.letterSpacing ?? 0),
                  textTransform: uppercase ? "uppercase" : "none",
                  WebkitTextStroke: `${Math.max(1, size / 18)}px ${outline}`,
                  ...motion,
                }}
              >
                {line.map((w, wordIndex) => {
                  const characters = captionCharacters(
                    w.text,
                    s.hidePunctuation,
                  );
                  if (!characters.length) return null;
                  const wordAnimation = w.style?.animation ?? animation;
                  const wordSize = w.style?.fontSize ?? size;
                  const wordEffect = wordMotion(
                    wordAnimation,
                    time,
                    w,
                    wordSize,
                    wordIndex,
                    b[0].start,
                  );
                  return (
                    <span
                      key={w.id}
                      style={{
                        display: "inline-block",
                        margin: "0 0.13em",
                        fontSize: w.style?.fontSize,
                        fontFamily: w.style?.fontFamily,
                        textTransform:
                          w.style?.uppercase === undefined
                            ? undefined
                            : w.style.uppercase
                              ? "uppercase"
                              : "none",
                        color:
                          w.style?.color ??
                          (wordAnimation === "karaoke" &&
                          time >= w.start &&
                          time < w.end
                            ? activeColor
                            : index === 1
                              ? (s.secondColor ?? s.color)
                              : s.color),
                        opacity: wordEffect.opacity,
                        transform: wordEffect.transform,
                      }}
                    >
                      {wordAnimation === "typewriter"
                        ? characters.map(({ letter, index: letterIndex }) => (
                            <span
                              key={letterIndex}
                              style={{
                                visibility:
                                  letterIndex < wordEffect.visibleCharacters
                                    ? "visible"
                                    : "hidden",
                              }}
                            >
                              {letter}
                            </span>
                          ))
                        : characters.map(({ letter }) => letter).join("")}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
}
