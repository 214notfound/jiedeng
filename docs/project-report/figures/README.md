# figures/ —— 图片资源

图片按**章节**分目录存放，目录名与 `chapters/` 下的章节文件一一对应：

```
figures/
├── 01-overview/
├── 02-game-design/
├── 03-aesthetics-ux/
├── 04-technical/
├── 05-management/
├── 06-testing-feedback/
├── 07-final-showcase/
├── 08-team-summary/
├── 09-individual-summary/
├── 10-award-application/
└── 11-final-score/
```

需要哪一章的图就建哪个目录，用不到的不要提前建。

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
