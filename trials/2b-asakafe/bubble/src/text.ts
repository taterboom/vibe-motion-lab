import type {Episode} from './types';

/** 去掉 Fish 的方括号情绪标签，字幕只显示台词 */
export const clean = (t: string) => t.replace(/\[[^\]]*\]\s*/g, '').trim();

export const pick = (ep: Episode, tag: string) => ep.lines.find((l) => l.tag === tag);

export const ja = (ep: Episode, tag: string) => clean(pick(ep, tag)?.text ?? '');
export const zh = (ep: Episode, tag: string) => pick(ep, tag)?.zh ?? '';
