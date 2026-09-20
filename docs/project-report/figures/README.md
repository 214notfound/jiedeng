# figures/ —— 图片资源

图片按**章节**分目录存放。目前实际有图的目录：

```
figures/
├── 01-overview/                   # 石涧村设计图、主角矛盾人生
├── 02-design/                     # 剧情结构总览
├── 03-art-and-experience/         # 站点地图、祠堂灯亮、探索分支背景
├── 04-technics/                   # 技术章插图
├── 06-test-and-feedback/          # 回帖情况（feedback.pdf）
├── 07-final-showcase/
│   ├── *.png                      # 原始截图，不提交进仓库
│   └── compressed/                # 压缩后的成品图，正文引用这一份
└── 010-award/                     # 评优申请的系统全景图（AI 生成）
```

第五、八、九、十一章暂时没有插图。需要哪一章的图就建哪个目录，用不到的不要提前建。

## 截图怎么处理

第七章的截图**直接扔进 `07-final-showcase/`**，标签栏和分辨率都不用管，截完一批跑一次：

```powershell
powershell -ExecutionPolicy Bypass -File tools/compress-figures.ps1
```

自动裁掉浏览器界面、缩到长边 1920、存成 JPEG 输出到 `compressed/`，每张约 250–400 KB。
正文里引用 `compressed/` 下的 `.jpg`，不要引用原始截图（一张 4–6 MB）。

## 第十章那张 AI 图

`figures/010-award/tech-overview.png`，正文引用在 `10-award-application.tex` 引言之后（标签 `fig:tech-overview`，宽 0.9）。六个模块环绕中央的状态核心——主线、探索、小游戏、账户、成就、介绍页，与第四章「七个模块」的说法一一对应。图上模块只与核心通信，模块之间没有连线，这正是第十章 10.1 的论点。

图已就位，下面是当初的提示词，需要重画时用：

> An isometric technical diagram of a modular software system. Seven small geometric module blocks are arranged in a ring around one single glowing central core. Thin amber light lines run from every module inward to the core; there are no lines between the modules themselves. Style: precise flat isometric engineering diagram, thin outlines, no glossy or 3D-photoreal effects. Palette: very dark navy background (#07090E), module blocks in slightly lighter navy (#0D1118), all lines and highlights in warm amber (#F5F0E3 and #C9922A). Mood: quiet night, faint mist. Labels: seven short English words, uppercase, small sans-serif, placed next to their blocks with thin leader lines. No other text anywhere in the image. Composition: centered, generous margins, wide 16:9.

重画之后存成 `figures/010-award/tech-overview.png` 覆盖原图即可，正文那一行不用动。

目前这张 PNG 有 1.4 MB，偏大。真要压的话注意加 `-SkipCrop`：这张是 AI 生成的位图而不是浏览器截图，顶边是浅色，脚本默认会按「顶部是不是浅色行」把它当成浏览器标签栏裁掉。

```powershell
powershell -ExecutionPolicy Bypass -File tools/compress-figures.ps1 -SourceDir figures/010-award -SkipCrop
```

**AI 生图的通病是文字拼错。** 重画之后放大看一遍那六个模块名，有拼错就重新生成。宁可没有标签，也不要留下拼错的字。

## 在正文里插图

```latex
\fig[0.8]{figures/07-final-showcase/cover.png}{游戏封面效果}{cover}
```

- 第一个参数（可省略，默认 `0.8`）是图片宽度占版心宽度的比例
- 第三个参数是图注
- 第四个参数是引用标签，正文中用 `图\ref{fig:cover}` 引用，编号自动生成

## 命名约定

- 全小写英文 + 连字符，不用空格和中文，例如 `menu-page-mobile.png`
- 同一组对比图加后缀区分，例如 `menu-before.png` / `menu-after.png`
- 优先使用 PNG；照片类可用 JPG；矢量流程图用 PDF 插入更清晰
