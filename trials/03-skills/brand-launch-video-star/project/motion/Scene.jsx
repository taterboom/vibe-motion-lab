import React, { useEffect } from "react";
import { Img, staticFile } from "remotion";
import { COLORS } from "./timeline.js";

const MARK_SRC = staticFile("brand/orbitask-mark.svg");
const WORD_SRC = staticFile("brand/orbitask-wordmark.svg");
const SANS = '-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif';

const abs = { position: "absolute" };
const Dot = ({ x, y, r, color, opacity = 1 }) => (
  <div style={{ ...abs, left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: color, opacity }} />
);
const Ghosts = ({ ghosts, r, color }) =>
  ghosts.map((g, k) => <Dot key={k} x={g.x} y={g.y} r={r * (1 - k * 0.12)} color={color} opacity={0.32 - k * 0.05} />);

export const MotionScene = ({ state: s, onAutoLayoutReady }) => {
  useEffect(() => {
    onAutoLayoutReady?.();
  }, [onAutoLayoutReady]);

  const m = s.mark;
  const mask = `conic-gradient(from 45deg, #000 ${m.sweepDeg}deg, transparent ${m.sweepDeg}deg)`;
  const it = s.intent;

  return (
    <div style={{ ...abs, inset: 0, overflow: "hidden", background: s.base, fontFamily: SANS, color: COLORS.ink }}>
      {/* colour-state wipes */}
      {s.wipes.map((w, i) => (
        <div key={i} style={{ ...abs, left: w.x - w.r, top: w.y - w.r, width: w.r * 2, height: w.r * 2, borderRadius: "50%", background: w.color }} />
      ))}

      {/* mark + wordmark group (official-file images, only masked/transformed) */}
      {m.visible && (
        <div style={{ ...abs, inset: 0, transformOrigin: "0 0", transform: `translate(${m.groupX}px, ${m.groupY}px) scale(${m.groupScale})`, opacity: m.opacity }}>
          <div style={{ ...abs, left: s.markC.x - s.markSize / 2, top: s.markC.y - s.markSize / 2, width: s.markSize, height: s.markSize, transform: `scale(${m.markScale})`, WebkitMaskImage: mask, maskImage: mask }}>
            <Img src={MARK_SRC} style={{ width: "100%", height: "100%" }} />
          </div>
          <div style={{ ...abs, left: s.markC.x + s.markSize / 2 + 30 + m.wordX, top: s.markC.y - 75, width: 630, height: 150, clipPath: `inset(0 ${m.wordClip * 100}% 0 0)` }}>
            <Img src={WORD_SRC} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      )}
      {s.hookDot && (
        <>
          <Ghosts ghosts={s.hookDot.ghosts} r={s.hookDot.r} color={COLORS.blue} />
          <Dot {...s.hookDot} color={COLORS.blue} />
        </>
      )}

      {/* intent */}
      {it.visible && (
        <div style={{ ...abs, inset: 0, opacity: it.opacity }}>
          <div style={{ ...abs, left: 0, right: 0, top: it.label.y - 24, textAlign: "center", fontSize: 34, fontWeight: 500, opacity: it.label.opacity * 0.75, letterSpacing: 0.5 }}>Tell it the goal.</div>
          <div style={{ ...abs, left: 960 - it.width / 2, top: it.y - 60, width: it.width, height: 120, borderRadius: 60, background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.22)", transform: `scale(${it.scale})`, overflow: "hidden" }}>
            <div style={{ ...abs, left: 60, top: 0, height: 116, display: "flex", alignItems: "center", fontSize: 48, fontWeight: 500, whiteSpace: "nowrap" }}>
              {it.text}
              <span style={{ display: "inline-block", width: 4, height: 54, marginLeft: 6, background: COLORS.blue, opacity: it.caret ? 1 : 0 }} />
            </div>
          </div>
          <div style={{ ...abs, left: 1450 - 42, top: it.y - 42, width: 84, height: 84, borderRadius: "50%", background: COLORS.blue, transform: `scale(${it.sendScale})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 ${it.sendFlash * 40}px rgba(124,140,255,${it.sendFlash * 0.35})` }}>
            <svg width="38" height="38" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="#0E0F13" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <svg style={{ ...abs, left: it.cursor.x, top: it.cursor.y, opacity: it.cursor.opacity }} width="44" height="56" viewBox="0 0 22 28"><path d="M2 2 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 15.8 L18.5 15.8 Z" fill="#fff" stroke="#0E0F13" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </div>
      )}

      {/* routing trail + nodes -> column headers */}
      {s.trail && <div style={{ ...abs, left: s.trail.x0, top: s.trail.y - 2, width: s.trail.x1 - s.trail.x0, height: 4, background: COLORS.violet, opacity: s.trail.opacity, borderRadius: 2 }} />}
      {s.columns.map((c, i) => <div key={i} style={{ ...abs, left: c.x - 170, top: 340, width: 340, height: 560, borderRadius: 24, background: "#fff", opacity: c.opacity }} />)}
      {s.nodes.map((n, i) => n.visible && (
        <React.Fragment key={i}>
          <div style={{ ...abs, left: n.x - n.w / 2, top: n.y - n.h / 2, width: n.w, height: n.h, borderRadius: n.h / 2, border: `3px solid ${n.lit ? COLORS.violet : "rgba(244,241,234,0.35)"}`, background: n.fill, transform: `scale(${n.scale})`, opacity: n.opacity, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 600 }}>
            <span style={{ opacity: n.colLabel.opacity }}>{n.colLabel.text}</span>
          </div>
          <div style={{ ...abs, left: n.x - 150, width: 300, top: n.nodeLabel.y - 24, textAlign: "center", fontSize: 40, fontWeight: 600, opacity: n.nodeLabel.opacity }}>{n.nodeLabel.text}</div>
        </React.Fragment>
      ))}
      <div style={{ ...abs, left: 0, right: 0, top: s.headline1.y - 40, textAlign: "center", fontSize: 72, fontWeight: 700, letterSpacing: -1.5, opacity: s.headline1.opacity }}>{s.headline1.text}</div>
      {s.routeDot && (
        <>
          <Ghosts ghosts={s.routeDot.ghosts} r={s.routeDot.r} color={COLORS.violet} />
          <Dot {...s.routeDot} color="#fff" />
        </>
      )}

      {/* cards */}
      {s.cards.map((c, i) => c.visible && (
        <div key={i} style={{ ...abs, left: c.x - 165, top: c.y - 42, width: 330, height: 84, borderRadius: 16, background: COLORS.ink, color: COLORS.dark, transform: `rotate(${c.rot}deg) scale(${c.scale})`, opacity: c.opacity, boxShadow: `0 ${8 + 22 * c.shadow}px ${20 + 30 * c.shadow}px rgba(0,0,0,${0.25 + 0.2 * c.shadow})`, display: "flex", alignItems: "center", fontSize: 25, fontWeight: 600, overflow: "hidden" }}>
          <div style={{ width: 10, alignSelf: "stretch", background: c.color }} />
          <div style={{ paddingLeft: 20, flex: 1, whiteSpace: "nowrap" }}>{c.title}</div>
          <div style={{ width: 34, height: 34, marginRight: 18, borderRadius: "50%", background: "#3FC1A5", transform: `scale(${c.check})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      ))}

      {/* result: week */}
      {s.dayCols.map((d, i) => <div key={i} style={{ ...abs, left: d.x - 85, top: 470, width: 170, height: 400, borderRadius: 16, background: "rgba(26,18,6,0.08)", opacity: d.opacity }} />)}
      {s.days.map((d, i) => <div key={i} style={{ ...abs, left: d.x - 85, width: 170, top: 420, textAlign: "center", fontSize: 30, fontWeight: 700, color: COLORS.dark, opacity: d.opacity }}>{d.text}</div>)}
      {s.blocks.map((b, i) => b.visible && (
        <div key={i} style={{ ...abs, left: b.x - b.w / 2, top: b.y - b.h / 2, width: b.w, height: Math.max(0, b.h), borderRadius: b.radius, background: b.color, opacity: b.opacity, color: b.color === "#1A1206" ? COLORS.ink : "#fff", fontSize: 21, fontWeight: 600, padding: "12px 14px", boxSizing: "border-box", overflow: "hidden", lineHeight: 1.2 }}>
          <span style={{ opacity: b.textOpacity }}>{b.title}</span>
        </div>
      ))}
      <div style={{ ...abs, left: 0, right: 0, top: 230, textAlign: "center", fontSize: 104, fontWeight: 800, letterSpacing: -3, color: COLORS.dark }}>
        {s.headline2.map((w, i) => <span key={i} style={{ display: "inline-block", margin: "0 18px", opacity: w.opacity, transform: `translateY(${w.y}px)` }}>{w.text}</span>)}
      </div>

      {/* lockup */}
      {s.lockDot && <Dot {...s.lockDot} color={COLORS.blue} />}
      <div style={{ ...abs, left: 0, right: 0, top: 690 + s.cta.y, textAlign: "center", fontSize: 40, fontWeight: 500, opacity: s.cta.opacity }}>Plan your next launch.</div>
      <div style={{ ...abs, left: 0, right: 0, top: 1000, textAlign: "center", fontSize: 22, letterSpacing: 1, opacity: s.disclaimer.opacity }}>Fictional product · concept film · not a real brand</div>
    </div>
  );
};
