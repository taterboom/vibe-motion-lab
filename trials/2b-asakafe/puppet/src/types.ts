/** tts/epNNN.json：一集的台词与文案 */
export type Line = {role: string; tag: string; lang: string; text: string; zh?: string; speed?: number};

export type Episode = {episode: string; n?: number; title?: string; scene?: string; hook?: string; stage?: StageSpec; lines: Line[]};

export type Expr = 'neutral' | 'smile' | 'happy' | 'surprised' | 'troubled';
export type Emote = 'dots' | 'q' | 'sweat';

/** 场上一个人：对应台词里的哪个 role、用哪套外形、坐在哪 */
export type CastMember = {
  role: string;
  look: string;            // looks 里的键；写 "you" 时按目录后缀 _m / _f 选男女版
  x: number;               // 场景画布（1008×800）里的横坐标
  y?: number;              // 底边纵坐标，不写用场景的 seatY；站着的人写小一点就更高
  face: -1 | 1;            // 脸朝左还是朝右
  scale?: number;
  holding?: 'beer' | 'coffee';   // 拿在朝向那一侧的手里，对方反应环节会举起来
};

/** 某个环节的演出覆盖：只写和默认演出表不同的部分 */
export type BeatOverride = {expr?: Record<string, Expr>; emote?: Emote | null; emoteOn?: string};

/** tts/epNNN.json 的 stage 段：这一集的画面用哪个场景、谁在场、哪些环节的演出要改 */
export type StageSpec = {
  scene: string;           // scenes 里的键
  variant?: string;        // 场景自己的变体，如办公室的 morning / evening
  cast: CastMember[];
  beats?: Partial<Record<SegmentKind, BeatOverride>>;
};

/** prep_audio.py 写出的 _clips.json：每句归一后的文件与时长 */
export type Clip = {file: string; dur: number};
export type Clips = {clips: Record<string, Clip>};

/** 各环节之间的留白（秒），Remotion Studio 参数面板里可调 */
export type Gaps = {
  afterAsk: number;      // ① 问完等你反应
  hostPlaceholder: number; // 没有主角音频时的占位
  afterHost: number;     // ② 主角问完到答案
  betweenPlays: number;  // ② 两遍之间
  shadow: number;        // ② 跟读留白
  countdown: number;     // ③ 倒计时
  beforeReact: number;   // ③ 参考答案到对方反应
  tail: number;          // 片尾停留
};

export type SegmentKind =
  | 'ask' | 'wait' | 'host' | 'hostPause' | 'play1' | 'gap' | 'play2' | 'shadow'
  | 'ask2' | 'countdown' | 'answer' | 'beforeReact' | 'react' | 'tail';

/** 时间线上的一段：有 audio 就在这段开头播那句 */
export type Segment = {kind: SegmentKind; label: string; start: number; dur: number; audio?: string; tag?: string};

export type EpisodeProps = {dir: string; gaps: Gaps; episode: Episode | null; clips: Clips | null};
export type LoadedProps = {dir: string; gaps: Gaps; episode: Episode; clips: Clips};
