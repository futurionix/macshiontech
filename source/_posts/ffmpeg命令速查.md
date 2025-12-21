---
title: ffmpeg 命令速查
permalink: ffmpeg-command-cheat-sheet/
date: 2023-06-10 11:00:00 +0800
category: 中文
tags:
  - ffmpeg
  - 操作音
  - 压缩视频指定文件大小
---
# ffmpeg 命令速查

详解与更多场景：

- [FFmpeg：音视频处理终极指南](FFmpeg：音视频处理终极指南.md)

官网：`https://ffmpeg.org/`

安装（macOS）：`brew install ffmpeg`

## 常用命令

### 查看媒体信息

```shell
ffmpeg -i video.mp4 -hide_banner
```

### 格式转换

```shell
ffmpeg -i input.flv output.mp4
```

### 压缩视频

```shell
# 指定输出文件大小（快速兜底）
ffmpeg -i input.mp4 -fs 300MB -threads 2 output.mp4

# 常用：H.264 + CRF（质量/体积平衡）
ffmpeg -i input.mp4 -vf "scale=1280:-1" -c:v libx264 -preset veryslow -crf 24 -c:a aac -b:a 128k output.mp4
```

### macOS 硬件编码（VideoToolbox）

```shell
# H.264 硬件编码
ffmpeg -i input.mov -vcodec h264_videotoolbox -b:v 5M -acodec aac 2025-02-10.mp4

# HEVC 硬件编码 + 缩放 + 帧率
ffmpeg -hwaccel videotoolbox -i input.mov \
  -vf "scale=1920:-1,fps=30" \
  -vcodec hevc_videotoolbox -b:v 3000k \
  -acodec copy \
  2025-05-12.mp4
```

### 截图（抽帧）

```shell
# 20 秒一张
ffmpeg -i input.mp4 -r 0.05 %5d.jpg

# 指定时间段：从 01:03:13 开始，持续 59 秒，20 秒一张
ffmpeg -ss 01:03:13 -t 0:0:59 -i input.mp4 -r 0.05 %5d.jpg
```

### 提取音频

```shell
# 无损拷贝音轨（最快）
ffmpeg -i input.mp4 -vn -c:a copy output.aac

# 转成 MP3
ffmpeg -i input.mp4 -vn -ar 44100 -ac 2 -b:a 320k -f mp3 output.mp3
```

### 裁剪（时间段）

```shell
# 从 00:00:50 开始裁 50 秒（不重编码，快）
ffmpeg -i input.mp4 -ss 00:00:50 -t 50 -codec copy output.mp4
```

### 裁剪（画面 crop）

```shell
ffmpeg -i input.mp4 -vf "crop=640:480:200:150" output.mp4
```

### 切分 / 合并

```shell
# 切分
ffmpeg -i input.mp4 -t 00:00:30 -c copy part1.mp4
ffmpeg -ss 00:00:30 -i input.mp4 -c copy part2.mp4

# 合并：join.txt 内容为：file 'part1.mp4' ...
ffmpeg -f concat -safe 0 -i join.txt -c copy output.mp4
```

### 调速 / 旋转

```shell
# 2 倍速 / 0.25 倍速
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" output.mp4
ffmpeg -i input.mp4 -vf "setpts=4.0*PTS" output.mp4

# 旋转 90°（推荐 transpose）
ffmpeg -i input.mp4 -vf "transpose=1" output.mp4
```
