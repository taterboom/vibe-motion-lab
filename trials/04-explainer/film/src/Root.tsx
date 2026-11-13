import React from 'react';
import {Composition, Still} from 'remotion';
import plan from './data/choreography-plan.json';
import {explainerSchema, ExplainerProps, FramePipelineExplainer} from './FramePipelineExplainer';

const c = plan.productionContract;
const defaults: ExplainerProps = {
  beats: plan.beats.map(({id, startFrame, endFrame, statement}) => ({id, startFrame, endFrame, statement})),
  period: plan.demoMotion.period,
  holdFrom: 630,
  colors: {frame: '#c9f36a', x: '#6ab7ff', squash: '#ff7658', color: '#ffd464', camera: '#b59cff'},
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="FramePipelineExplainer"
      component={FramePipelineExplainer}
      schema={explainerSchema}
      defaultProps={defaults}
      durationInFrames={c.durationInFrames}
      fps={c.fps}
      width={c.width}
      height={c.height}
    />
    {/* step 2: maximum-information hero frame (state of frame 400, all objects present) */}
    <Still id="HeroFrame" component={FramePipelineExplainer} schema={explainerSchema} defaultProps={{...defaults, freezeAt: 400}} width={c.width} height={c.height} />
  </>
);
