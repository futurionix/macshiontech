---
title: FFmpeg：音视频处理终极指南
permalink: ffmpeg-ultimate-guide/
date: 2023-06-10 10:00:00 +0800
category: 中文
tags:
  - ffmpeg
  - 音视频处理终极指南
  - 简介
---
# FFmpeg：音视频处理终极指南

## 简介

FFmpeg 是一个强大的工具，用于处理音频和视频文件。本指南旨在提供一个全面的资源，以帮助初学者和中级用户掌握其基础和高级功能。本文将覆盖格式转换、压缩、裁剪、截图、切分、合并、调速等多个方面。

## 安装

### Windows

请访问 FFmpeg 的官方网站(https://ffmpeg.org/)下载适用于 Windows 的安装包。

### macOS

macOS 用户可以通过 Homebrew 轻松安装 FFmpeg：

```shell
brew install ffmpeg
```

### Linux

在基于 Debian 的系统中，使用以下命令：

```shell
sudo apt-get install ffmpeg
```

## 查看媒体信息

要查看音频或视频文件的详细信息，使用以下命令：

```shell
# 使用 -hide_banner 隐藏不必要的输出，专注于媒体信息
ffmpeg -i input.mp4 -hide_banner
```

这里，`-hide_banner` 参数用于隐藏启动信息和其他非关键输出，让你更容易找到需要的信息。

## 格式转换

### 基础转换

最简单的格式转换可以通过以下命令实现：

```shell
# 将 FLV 文件转换为 MP4
ffmpeg -i input.flv output.mp4
```

### 高质量转换

如果你希望在转换过程中保持尽可能高的质量，可以使用 `-qscale 0` 参数：

```shell
# 使用 -qscale 0 以最高质量转换
ffmpeg -i input.webm -qscale 0 output.mp4
```

在这里，`-qscale 0` 参数指示 FFmpeg 以最高可能质量进行转换。

## 视频压缩

### 基础压缩

最简单的视频压缩可以通过降低帧率来实现：

```shell
# 将帧率设置为每秒 30 帧
ffmpeg -i input.mp4 -r 30 output.mp4
```

### 高级压缩

对于更高级的压缩，你可以使用 `-crf` 和 `-preset` 参数：

```shell
# 使用 -crf 和 -preset 进行高级压缩
ffmpeg -i input.mp4 \
-vf scale=1280:-1 \
-c:v libx264 \
-preset veryslow \
-crf 24 \
-ac 2 \
-c:a aac \
-strict -2 \
-b:a 128k \
output.mp4
```

这里，`-crf` 参数的取值范围是 0-51，数值越大，视频质量越低但文件大小越小。`-preset` 参数控制编码速度和压缩率的平衡，`veryslow` 选项会最大限度地压缩视频，但需要更长的时间。

## macOS 硬件编码（VideoToolbox）

在 macOS 上，如果你希望利用硬件加速进行转码（更省电、更快），可以使用 `h264_videotoolbox` / `hevc_videotoolbox`。

```shell
# H.264 硬件编码（VideoToolbox）
ffmpeg -i input.mov -c:v h264_videotoolbox -b:v 5M -c:a aac 2025-02-10.mp4

# HEVC 硬件编码 + 设置帧率（部分选项对硬件编码器可能被忽略）
ffmpeg -hwaccel videotoolbox -i input.mov \
  -vf "fps=30" \
  -c:v hevc_videotoolbox -b:v 2M \
  -c:a copy \
  2025-02-10.mp4

# HEVC 硬件编码 + 缩放 + 帧率
ffmpeg -hwaccel videotoolbox -i input.mov \
  -vf "scale=1920:-1,fps=30" \
  -c:v hevc_videotoolbox -b:v 3000k \
  -c:a copy \
  2025-05-12.mp4
```

## 音频压缩

### 基础音频压缩

最简单的音频压缩可以通过设置音频比特率来实现：

```shell
# 设置音频比特率为 128 kbps
ffmpeg -i input.mp3 -ab 128k output.mp3
```

这里，`-ab 128k` 设置音频比特率为 128 kbps，这通常足够用于大多数应用场景。

## 截图

### 基础截图

你可以使用以下命令从视频中截取图片：

```shell
# 每 100 秒截取一张图片
ffmpeg -i input.mp4 -r 0.01 -q:v 2 %5d.jpg
```

### 高级截图

如果你需要在特定时间段内截取图片，可以使用 `-ss` 和 `-t` 参数：

```shell
# 从第 1 小时 3 分 13 秒开始，持续 59 秒，每 20 秒截取一张图片
ffmpeg -ss 01:03:13 -t 0:0:59 -i input.mp4 -r 0.05 -q:v 2 %5d.jpg
```

## 音频提取

### 提取为同样的格式

如果你只是想从视频中提取音频，并保持其原始格式，可以使用以下命令：

```shell
# 使用 -vn 禁用视频，-c:a copy 保持原始音频编码
ffmpeg -i input.mp4 -vn -c:a copy output.aac
```

### 提取并转换格式

如果你想在提取过程中转换音频格式，可以使用更多的参数：

```shell
# 使用 -vn 禁用视频，-ar 设置音频采样率，-ac 设置音频通道，-ab 设置音频比特率
ffmpeg -i input.mp4 -vn -ar 44100 -ac 2 -ab 320k -f mp3 output.mp3
```

## 视频裁剪

### 基础裁剪

最简单的视频裁剪可以通过 `crop` 过滤器来实现：

```shell
# 裁剪出一个 640x480 的区域，左上角坐标为 (200, 150)
ffmpeg -i input.mp4 -vf "crop=640:480:200:150" output.mp4
```

### 时间段裁剪

如果你想裁剪视频的某个时间段，可以使用 `-ss` 和 `-t` 参数：

```shell
# 从视频的第 50 秒开始，裁剪 50 秒
ffmpeg -i input.mp4 -ss 00:00:50 -codec copy -t 50 output.mp4
```

## 视频切分

### 基础切分

如果你想将一个长视频切分成多个小段，可以使用 `-t` 和 `-ss` 参数：

```shell
# 第一部分从视频开始到第 30 秒
# 第二部分从第 30 秒开始到视频结束
ffmpeg -i input.mp4 -t 00:00:30 -c copy part1.mp4
ffmpeg -ss 00:00:30 -i input.mp4 -c copy part2.mp4
```

## 视频合并

### 使用文本文件合并

要合并多个视频文件，首先创建一个文本文件（例如 `join.txt`），并列出所有要合并的视频文件：

```txt
file 'part1.mp4'
file 'part2.mp4'
file 'part3.mp4'
```

然后，使用以下命令进行合并：

```shell
# 使用 concat 协议和 -c copy 选项进行无损合并
ffmpeg -f concat -safe 0 -i join.txt -c copy output.mp4
```

## 调整播放速度

### 加速或减速

你可以通过调整播放速度来加速或减速视频：

```shell
# 将视频加速到两倍速度
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" output.mp4

# 将视频减速到四倍时间
ffmpeg -i input.mp4 -vf "setpts=4.0*PTS" output.mp4
```

## 视频旋转

### 顺时针旋转

如果你想将视频顺时针旋转 90 度，可以使用以下命令：

```shell
# 使用 -vf "transpose=1" 顺时针旋转 90 度
ffmpeg -i input.mp4 -vf "transpose=1" output.mp4
```

### 逆时针旋转

如果你想将视频逆时针旋转 90 度，可以使用以下命令：

```shell
# 使用 -vf "transpose=2" 逆时针旋转 90 度
ffmpeg -i input.mp4 -vf "transpose=2" output.mp4
```

## 添加封面图像

### 音频文件添加封面

如果你有一个音频文件，并希望添加一个封面图像，可以使用以下命令：

```shell
# 使用 -loop 1 循环图像，使其持续与音频一样长
ffmpeg -loop 1 -i cover.jpg -i audio.mp3 -c:v libx264 -c:a aac -strict experimental -b:a 192k -shortest output.mp4
```

## 批处理

### 批量转换格式

如果你有多个 `.mov` 文件，并希望将它们转换为 `.mp4` 格式，可以使用以下批处理脚本：

```shell
for i in *.mov; do
  ffmpeg -i "$i" -vcodec libx264 -preset fast -crf 20 -y -vf "scale=1920:-1" -acodec libmp3lame -ab 128k "${i%.mov}.mp4"
done
```

## 高级技巧

### 添加字幕

如果你有一个 SRT 字幕文件，并希望将其嵌入到视频中，可以使用以下命令：

```shell
# 使用 -scodec mov_text 将字幕嵌入 MP4 文件
ffmpeg -i input.mp4 -i subtitle.srt -c:v copy -c:a copy -scodec mov_text output.mp4
```

### 水印添加

你可以使用 FFmpeg 添加水印到视频：

```shell
# 使用 overlay 过滤器添加水印
ffmpeg -i input.mp4 -i watermark.png -filter_complex "overlay=W-w-10:H-h-10" output.mp4
```

这里，`W-w-10:H-h-10` 确保水印位于视频的右下角，并且距离边缘有 10 像素的间距。

### 音频混合

如果你有两个音频文件并希望将它们混合成一个文件，可以使用以下命令：

```shell
# 使用 amix 过滤器混合两个音频文件
ffmpeg -i audio1.mp3 -i audio2.mp3 -filter_complex amix=inputs=2:duration=first:dropout_transition=2 mixed_audio.mp3
```

### 批量裁剪

如果你有多个视频文件，并希望批量裁剪它们，可以使用以下脚本：

```shell
# 批量裁剪从第 30 秒到第 60 秒的内容
for i in *.mp4; do
  ffmpeg -ss 00:00:30 -i "$i" -to 00:01:00 -c:v copy -c:a copy "clipped_${i}"
done
```

## 常见问题与解决方案

### 无法识别输入/输出格式

如果 FFmpeg 无法识别输入或输出格式，确保你已经安装了所有必要的编解码器和库。

### 视频和音频不同步

如果在转换或编辑过程中，视频和音频出现不同步的情况，尝试使用 `-async` 参数：

```shell
# 使用 -async 1 校正音频同步
ffmpeg -i input.mp4 -async 1 output.mp4
```

## 更多实用小技巧

### 批量改变分辨率

如果你有多个视频文件，并希望统一它们的分辨率，可以使用以下脚本：

```shell
# 批量将视频分辨率改为 1280x720
for i in *.mp4; do
  ffmpeg -i "$i" -vf "scale=1280:720" "resized_${i}"
done
```

### 音量调整

如果你的视频或音频文件音量太低或太高，你可以使用 `volume` 过滤器来调整：

```shell
# 将音量提高 2 倍
ffmpeg -i input.mp4 -c:v copy -af "volume=2" output.mp4
```

### 音频和视频的混合

如果你有一个视频文件和一个音频文件，并希望将音频替换视频中的原始音频，可以使用以下命令：

```shell
# 使用 -c:v copy 保留原始视频流，-c:a aac 转码音频
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac output.mp4
```

## 结论和进一步阅读

FFmpeg 是一个非常强大的工具，适用于多种多样的音频和视频处理任务。本指南仅涉及其功能的冰山一角。为了更深入地了解 FFmpeg，你可以参考其官方文档: https://ffmpeg.org/documentation.html。

