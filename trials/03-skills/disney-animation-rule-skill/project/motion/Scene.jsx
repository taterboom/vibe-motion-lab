import React, { useEffect } from "react";
import { REST_POSE } from "./timeline.js";

// 纯代码画的小团子：圆角身体 + 两只眼睛 + 地面阴影。只吃 pose，不读帧号。
export const MotionScene = ({ pose = REST_POSE, layout, onAutoLayoutReady }) => {
  useEffect(() => {
    onAutoLayoutReady?.();
  }, [onAutoLayoutReady]);

  const W = layout?.videoWidth ?? 1080;
  const H = layout?.videoHeight ?? 1080;
  const s = W / 1080;

  const p = { ...REST_POSE, ...pose };
  const groundY = H * 0.78;
  const bodyW = 300 * s;
  const bodyH = 260 * s;

  // 阴影随高度缩小、变淡
  const shadowK = 1 / (1 + p.lift / 420);
  const shadowW = bodyW * 1.05 * p.scaleX * shadowK;

  const eyeH = 46 * s * Math.max(0.08, p.eyeOpen);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: "#f4efe6" }}
    >
      {/* 地面 */}
      <div
        className="absolute left-0 right-0"
        style={{ top: groundY, height: H - groundY, backgroundColor: "#e6dccb" }}
      />
      {/* 阴影 */}
      <div
        className="absolute rounded-[50%]"
        style={{
          left: W / 2 - shadowW / 2,
          top: groundY - 14 * s,
          width: shadowW,
          height: 28 * s,
          backgroundColor: `rgba(60, 40, 20, ${0.28 * shadowK})`,
        }}
      />
      {/* 身体：以脚底中点为原点做缩放和倾斜 */}
      <div
        className="absolute"
        style={{
          left: W / 2 - bodyW / 2,
          top: groundY - bodyH - p.lift * s,
          width: bodyW,
          height: bodyH,
          transformOrigin: "50% 100%",
          transform: `rotate(${p.tiltDeg}deg) scale(${p.scaleX}, ${p.scaleY})`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "48% 48% 42% 42% / 58% 58% 42% 42%",
            background: "radial-gradient(circle at 35% 30%, #ffb38a 0%, #f2784b 55%, #d95a32 100%)",
            boxShadow: `inset ${-14 * s}px ${-18 * s}px 0 rgba(150, 50, 20, 0.18)`,
          }}
        />
        {[-1, 1].map((side) => (
          <div
            key={side}
            className="absolute rounded-full"
            style={{
              left: bodyW / 2 + side * 52 * s - 15 * s,
              top: 92 * s + p.eyeOffsetY * s - eyeH / 2,
              width: 30 * s,
              height: eyeH,
              backgroundColor: "#2b1d16",
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                left: 7 * s,
                top: Math.min(eyeH * 0.2, 8 * s) + p.pupilOffsetY * s,
                width: 10 * s,
                height: Math.min(10 * s, eyeH * 0.3),
                backgroundColor: "#fff",
              }}
            />
          </div>
        ))}
        {/* 腮红 */}
        {[-1, 1].map((side) => (
          <div
            key={`c${side}`}
            className="absolute rounded-full"
            style={{
              left: bodyW / 2 + side * 92 * s - 20 * s,
              top: 140 * s + p.eyeOffsetY * s,
              width: 40 * s,
              height: 16 * s,
              backgroundColor: "rgba(255, 120, 120, 0.45)",
            }}
          />
        ))}
      </div>
    </div>
  );
};
