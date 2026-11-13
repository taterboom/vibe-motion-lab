import React from 'react';
import {DEMO, DemoValues, demoTimeline} from '../timeline';

// The "Scene" being explained: draws ONLY from values. Logical size 1280x720, scaled to `width`.
export const DemoScene: React.FC<{values: DemoValues; width: number; ballOpacity?: number}> = ({
  values,
  width,
  ballOpacity = 1,
}) => {
  const k = width / DEMO.sceneW;
  const r = 70;
  return (
    <div style={{position: 'relative', width, height: DEMO.sceneH * k, overflow: 'hidden', background: '#0b0d0a'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: DEMO.sceneW,
          height: DEMO.sceneH,
          transformOrigin: '0 0',
          transform: `scale(${k})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: `640px ${DEMO.ground}px`,
            transform: `scale(${values.camera})`,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.05) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.05) 2px,transparent 2px)',
            backgroundSize: '80px 80px',
          }}
        >
          <div style={{position: 'absolute', left: 0, right: 0, top: DEMO.ground, height: 4, background: '#4a5046'}} />
          <div
            style={{
              position: 'absolute',
              left: values.x - r * 1.1,
              top: DEMO.ground - 10,
              width: r * 2.2,
              height: 20,
              borderRadius: '50%',
              background: 'rgba(0,0,0,.55)',
              opacity: ballOpacity * (0.4 + 0.6 * (1 - (DEMO.ground - values.y) / DEMO.jump)),
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: values.x - r,
              top: values.y - 2 * r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: '50%',
              background: values.color,
              transformOrigin: '50% 100%',
              transform: `scale(${1 / Math.sqrt(values.squash)}, ${values.squash})`,
              opacity: ballOpacity,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const Thumb: React.FC<{d: number; width: number; period: number}> = ({d, width, period}) => (
  <DemoScene values={demoTimeline(d, period)} width={width} />
);
