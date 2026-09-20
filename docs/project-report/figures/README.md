# figures/ —— 图片资源

图片按**章节**分目录存放。目前实际有图的目录：

```
figures/
├── 01-overview/                   # 石涧村设计图、主角矛盾人生
├── 02-design/                     # 剧情结构总览
├── 03-art-and-experience/         # 站点地图、祠堂灯亮、探索分支背景
├── 04-technics/                   # 技术章插图
├── 06-test-and-feedback/          # 回帖情况（feedback.pdf）
└── 07-final-showcase/
    ├── *.png                      # 原始截图，不提交进仓库
    └── compressed/                # 压缩后的成品图，正文引用这一份
```

第五、八、九、十、十一章暂时没有插图。需要哪一章的图就建哪个目录，用不到的不要提前建。

## 截图怎么处理

第七章的截图**直接扔进 `07-final-showcase/`**，标签栏和分辨率都不用管，截完一批跑一次：

```powershell
powershell -ExecutionPolicy Bypass -File tools/compress-figures.ps1
```

自动裁掉浏览器界面、缩到长边 1920、存成 JPEG 输出到 `compressed/`，每张约 250–400 KB。
正文里引用 `compressed/` 下的 `.jpg`，不要引用原始截图（一张 4–6 MB）。

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
