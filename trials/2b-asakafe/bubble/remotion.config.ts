import {Config} from '@remotion/cli/config';

// 素材目录就是管线的输出目录：out/<ep>_<you>/ 里有 _episode.json、_rough.json、_rough.wav
Config.setPublicDir('../shared');
Config.setOverwriteOutput(true);
Config.setVideoImageFormat('jpeg');
