# 逆道西行 - 开篇宣传动画使用说明

## 概述

《逆道西行》开篇宣传动画共60秒，分为4段×15秒，采用上美影水墨风格 × 暗黑国风。

## 文件结构

```
demo/
├── video/
│   ├── intro_01_changan.mp4    # 开场动画 第一段 长安·逆命 (0-15s)
│   ├── intro_02_liudao.mp4     # 开场动画 第二段 六道·抉择 (15-30s)
│   ├── intro_03_81nan.mp4      # 开场动画 第三段 八十一难·肉鸽 (30-45s)
│   ├── intro_04_lingshan.mp4   # 开场动画 第四段 灵山·终章 (45-60s)
│   ├── intro_full.mp4           # 开场动画 完整60秒合成版 (可选)
│   ├── ending_zhengguo.mp4      # 结局动画 正果·金蝉东归 (15s)
│   ├── ending_nidao.mp4         # 结局动画 逆道·难簿焚尽 (15s)
│   ├── ending_dasheng.mp4       # 结局动画 大圣脱局·齐天再临 (15s)
│   ├── download_videos.ps1      # 视频一键下载脚本
│   └── README.md                # 本说明文档
├── audio/
│   ├── intro_bgm.mp3            # 背景音乐 - 水墨国风黑暗西游 (60s)
│   ├── intro_voice_01.mp3       # 旁白第一段 - 长安·逆命
│   ├── intro_voice_02.mp3       # 旁白第二段 - 六道·抉择
│   ├── intro_voice_03.mp3       # 旁白第三段 - 八十一难·肉鸽
│   ├── intro_voice_04.mp3       # 旁白第四段 - 灵山·终章
│   └── download_audio.ps1       # 音频一键下载脚本
├── js/
│   └── intro_video.js           # 宣传动画播放模块
└── css/
    └── style.css                # 含宣传动画样式
```

## 视频下载链接

由于视频文件较大，请从以下链接下载后放置到 `demo/video/` 目录：

| 片段 | 文件名 | 时长 | 下载链接 |
|---|---|---|---|
| 第一段 | intro_01_changan.mp4 | 15s | https://aka.doubaocdn.com/s/dupPhuGVtQ |
| 第二段 | intro_02_liudao.mp4 | 15s | https://aka.doubaocdn.com/s/jt1f3PcM23 |
| 第三段 | intro_03_81nan.mp4 | 15s | https://aka.doubaocdn.com/s/Ugb7YdVhVc |
| 第四段 | intro_04_lingshan.mp4 | 15s | https://aka.doubaocdn.com/s/5EKBHlOO4X |

**下载方法**：在浏览器中打开链接，右键"视频另存为"，保存为对应文件名到 `demo/video/` 目录。

**一键下载**：在 PowerShell 中执行 `cd demo\video; .\download_videos.ps1`

## 音频下载链接

背景音乐和旁白配音请从以下链接下载后放置到 `demo/audio/` 目录：

| 类型 | 文件名 | 时长 | 下载链接 |
|---|---|---|---|
| 背景音乐 | intro_bgm.mp3 | 60s | https://aka.doubaocdn.com/s/Y3X32uAhCq |
| 旁白第一段 | intro_voice_01.mp3 | 12s | https://aka.doubaocdn.com/s/SqaRRGrejf |
| 旁白第二段 | intro_voice_02.mp3 | 14s | https://aka.doubaocdn.com/s/eBo2eWdxFM |
| 旁白第三段 | intro_voice_03.mp3 | 12s | https://aka.doubaocdn.com/s/1Av7URlwOh |
| 旁白第四段 | intro_voice_04.mp3 | 12s | https://aka.doubaocdn.com/s/1sPeDEvpKp |

**一键下载**：在 PowerShell 中执行 `cd demo\audio; .\download_audio.ps1`

**音频说明**：
- 背景音乐：水墨国风，古琴+大提琴+钟声+鼓点，音量0.3，循环播放
- 旁白配音：沉稳中年男性，语速缓慢低沉，每段视频开始后延迟播放，音量0.8
- 旁白文案与字幕同步，即使音频加载失败也会显示字幕

## 使用方法

### 1. 首页按钮播放

游戏首页已添加"观看宣传动画"按钮，点击即可播放完整60秒宣传动画。

### 2. 代码调用

```javascript
// 播放完整宣传动画
IntroVideo.play(function() {
  console.log('宣传动画播放完成');
});

// 带选项播放
IntroVideo.play(callback, {
  autoPlay: true,        // 是否自动播放
  showSkip: true,        // 是否显示跳过按钮
  showSubtitles: true    // 是否显示字幕
});

// 检查是否已观看过
if (!IntroVideo.hasSeenIntro()) {
  // 首次进入自动播放
  IntroVideo.play(function() {
    IntroVideo.markAsSeen();
    // 进入游戏
  });
}

// 跳过
IntroVideo.skip();

// 暂停/继续
IntroVideo.pause();
IntroVideo.resume();

// 检查视频文件是否可用
const status = await IntroVideo.checkVideosAvailable();
console.log(status);
```

### 3. 首次进入自动播放（可选）

在 `main.js` 的 `startGame()` 函数中添加：

```javascript
function startGame() {
  // 首次进入自动播放宣传动画
  if (!IntroVideo.hasSeenIntro()) {
    IntroVideo.play(function() {
      IntroVideo.markAsSeen();
      // 继续游戏初始化
      initGame();
    });
  } else {
    initGame();
  }
}
```

## 功能特性

- ✅ 4段15秒视频连续播放
- ✅ 内置旁白字幕（时间戳同步）
- ✅ 跳过按钮（可配置显示/隐藏）
- ✅ 进度条（实时显示播放进度）
- ✅ 点击视频暂停/继续
- ✅ 自动播放失败降级（静音播放）
- ✅ 视频加载失败自动跳过
- ✅ 预加载下一段视频
- ✅ 入场/出场淡入淡出动画
- ✅ 手机横屏适配
- ✅ localStorage 记忆观看状态

## 四段内容结构

| 时间段 | 章节 | 核心内容 | 旁白 |
|---|---|---|---|
| 00:00-00:15 | 长安·逆命 | 长安城头，看穿取经真相 | "他们说，西行是为了普度众生。可我看见的，是一条通往牢笼的路。" |
| 00:15-00:30 | 六道·抉择 | 四场景快切，六道光芒汇聚太极 | "渡，是顺从；战，是反抗；缘，是羁绊；夺，是贪婪；隐，是逃避；逆——是逆天而行。" |
| 00:30-00:45 | 八十一难·肉鸽 | 六难场景快切，唐僧站起 | "八十一难，八十一次死亡。每一次倒下，都不是终点——而是下一次逆道而行的起点。" |
| 00:45-01:00 | 灵山·终章 | 凌云渡前，撕裂佛光，Logo定格 | "他们说，到了灵山，就完成了救赎。可我要说——真正的救赎，从不是抵达，而是质疑。" |

## 视频合成（可选）

如需将4段合成为完整60秒视频，使用 ffmpeg：

```bash
# 1. 创建文件列表 list.txt
file 'intro_01_changan.mp4'
file 'intro_02_liudao.mp4'
file 'intro_03_81nan.mp4'
file 'intro_04_lingshan.mp4'

# 2. 拼接
ffmpeg -f concat -safe 0 -i list.txt -c copy intro_full.mp4

# 3. 添加淡入淡出
ffmpeg -i intro_full.mp4 -vf "fade=t=in:st=0:d=1,fade=t=out:st=59:d=1" -c:a copy intro_final.mp4
```

## 后续优化方向

- [ ] 添加旁白配音（低沉男声）
- [ ] 添加背景音乐（水墨国风BGM）
- [ ] 添加音效（钟声、风声、战斗声）
- [ ] 视频字幕动效优化
- [ ] 多版本裁剪（15s/30s用于短视频投放）
- [ ] 4K高清版本
- [ ] 微信小游戏版本适配

## 技术规格

- **分辨率**：1280×720 (720p)
- **比例**：16:9 横版
- **格式**：MP4 (H.264)
- **帧率**：30fps
- **总时长**：60秒 (4×15s)
- **风格**：上美影水墨 × 暗黑国风
- **模型**：Seedance 2.5

## 故障排查

### Q: 视频不播放？
A: 检查视频文件是否放置在 `demo/video/` 目录，文件名是否正确。浏览器控制台查看是否有404错误。

### Q: 自动播放被阻止？
A: 浏览器策略要求用户交互后才能播放带声音的视频。模块已内置降级：自动播放失败时自动静音播放。如需带声音播放，需用户点击按钮触发。

### Q: 手机上显示不全？
A: 模块已适配手机横屏，视频会按比例缩放。确保游戏处于横屏模式。

### Q: 如何重置"已观看"状态？
A: 在浏览器控制台执行 `IntroVideo.resetSeenStatus()`，或清除 localStorage 中的 `nidao_has_seen_intro`。

---

**版本**：v1.0
**创建日期**：2026-09-13
**状态**：已集成到游戏，待放置视频文件
