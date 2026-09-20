# 《借灯》项目文档（LaTeX）

课程项目文档的 LaTeX 工程，11 章，对应 [项目文档最终版.md](项目文档最终版.md) 里的十一个一级标题。

**当前状态：83 页，编译零错误。8 章完成，3 章有明确的待补项（第三章 3.3 线框图、第六章分辨率测试、第九章罗晨菲一节）。**

---

## 一、当前进度

| 章 | 状态 | 说明 |
|---|---|---|
| 一 · 项目概述 | 完成 | |
| 二 · 游戏设计详解 | 完成 | 有一处数字要改，见待办 |
| 三 · 美学与用户体验 | **缺一节** | 3.3 线框图 |
| 四 · 技术实现 | 完成 | |
| 五 · 项目管理与进度 | 完成 | |
| 六 · 测试与回帖情况 | **缺一节 + 6 张图** | 见待办 |
| 七 · 最终显示效果 | **6 / 12 张图** | 见待办 |
| 八 · 团队总结 | 完成 | |
| 九 · 个人总结 | **4 / 5** | 罗晨菲一节待补 |
| 十 · 评优申请 | 完成 | 七节：边界约束、状态提交、数据分离、演出解耦、内核复用、技术权衡、交付完整度 |
| 十一 · 最终得分 | 完成 | |

---

## 二、待办清单

### 交稿前必须完成

- [ ] **第九章 罗晨菲一节**——其余四人已完成，结构照抄同章其他小节；该节文件头注释里留了 V1–V4 的事实要点
- [ ] **第六章 分辨率兼容测试**——当前是占位乱码（`chapters/06-testing-feedback.tex` 第 54–63 行），需要重写
- [ ] **第六章 六个兼容测试截图**——Chrome / Edge / 夸克 / Windows / Mac / Android，当前是红色占位框，图片就位后换成 `\fig`
- [ ] **第三章 3.3 线框图**——留了标题，内容待补
- [ ] **第七章 补 4 张截图**——逃离数据机房、证据处置界面、成就页、移动端主游戏页（最后一张宽度参数是 `0.22` 不是 `0.85`）
- [ ] **第七章 拼 2 张图**——五个结局拼一张、五种转场各取三帧拼一张。这两张没有现成截图，需要自己合
- [ ] **全局搜索 `\pending`**，确认清空。编译出来是红色加粗的【待补充】，肉眼能扫到

### 数据核对

- [ ] 第二章第 69 行写「全篇共十六余个场景」，但同章的场景清单表是 18 行，第七章也写 18 个。**以 18 为准**，改第二章
- [ ] `index.html` 里显示的版本号还是 `V1.0`
- [ ] `menu.html` 页脚写的是「V4 · 本地存档」，与最终版本号不一致

### 提交仓库前

- [ ] **原始截图不要提交。** 现在 6 张就 27.8 MB，截满 12 张约 55 MB。只提交 `figures/07-final-showcase/compressed/` 里的压缩版（每张 250–400 KB）
- [ ] `figures/README.md` 里列的目录名与实际不符（写的是 `02-game-design`，实际是 `02-design`；`03-aesthetics-ux` 实际是 `03-art-and-experience`），照着实际目录改一下

---

## 三、文件组织

```
docs/project-report/
├── main.tex                  # 主控文件：只做加载配置 + 拼装章节，正文不写在这里
├── build.sh                  # 构建脚本，产出 out/main.pdf
├── README.md                 # 本文件
├── .gitignore                # 忽略 out/ 与 LaTeX 中间文件
│
├── tex/                      # 配置层（改样式只动这里）
│   ├── info.tex              # 项目元信息：项目名、组员、课程、日期
│   ├── preamble.tex          # 页面、颜色、章节标题格式、代码样式、页眉页脚
│   ├── commands.tex          # 自定义命令：\pending \fig \figph \swatch
│   └── cover.tex             # 封面
│
├── chapters/                 # 内容层（写作只动这里）
│   ├── 01-overview.tex       … 11-final-score.tex
│
├── figures/                  # 图片资源，按章节分目录，见 figures/README.md
├── tools/
│   └── compress-figures.ps1  # 插图批量压缩（Windows，无需装任何东西）
│
├── 项目文档最终版.md          # 原始大纲，作为格式参照保留
└── out/                      # 编译产物（已 gitignore）
```

**三层的边界**：想改文档长什么样 → `tex/`；想改文档写了什么 → `chapters/`；想加图 → `figures/`。三者互不干扰。

---

## 四、编译

```bash
bash build.sh
```

产物为 `out/main.pdf`。脚本会打印引擎、主文件绝对路径和输出目录。

输出目录选 `out/` 是为了与这台机器上 VS Code 的全局设置
`"latex-workshop.latex.outDir": "%DIR%/out"` 一致——编辑器和脚本产出同一个 PDF，
不会出现两份互相矛盾的构建结果。

第一次编译需要跑两遍以上才能生成正确的目录页码，`latexmk` 已自动处理。

### 编辑器配置

- **VS Code + LaTeX Workshop**：这台机器已全局配置好 `latexmk (xelatex)` 配方和 `%DIR%/out` 输出目录，打开 `main.tex` 保存即可自动编译。**唯一需要确认的**是插件能否把 `main.tex` 认作 Root File——如果它误把某个 `chapters/*.tex` 当成主文件，在 `main.tex` 里右键选 "Set as LaTeX root"。
- **Overleaf**：上传整个 `project-report/` 目录，在 Menu → Compiler 里选 **XeLaTeX**（`main.tex` 首行已写 `% !TeX program = xelatex`，一般会自动识别）。
- 手动编译：`xelatex -output-directory=out main.tex`，重复两到三次。

---

## 五、插图

### 从截图到正文里的图

第七章的截图**直接扔进 `figures/07-final-showcase/` 就行**，浏览器标签栏和地址栏不用自己裁，原始分辨率也不用管。截完一批跑一次：

```powershell
powershell -ExecutionPolicy Bypass -File tools/compress-figures.ps1
```

脚本做三件事：裁掉顶部的浏览器界面、缩到长边 1920、存成 JPEG 质量 92，输出到 `figures/07-final-showcase/compressed/`。实测 6 张从 27.8 MB 压到 1.7 MB。

`\fig` 里引用的是 `compressed/` 下的 `.jpg`，不是目录里的原始截图。直接引用原图也能编译，但十二张会把 PDF 撑到 50 MB 以上。

裁剪靠判断「顶部是不是浅色行」——浏览器界面是浅灰，游戏画面是深色。用了深色模式浏览器截图的话这个判断会失效，加 `-SkipCrop` 关掉裁剪、自己裁好再放进去。想换格式或质量：`-OutFormat Png -Quality 95`。

### 占位框 `\figph`

截图没到位时用 `\figph` 顶着，它不依赖任何图片文件，编译能过：

```latex
\figph[0.85]{截图说明文字}{图注}{标签}
```

第一个参数是宽度比例，第二个是给截图的人看的操作说明（换成 `\fig` 之后自然消失）。

**图片就位后改成 `\fig`，注意是四个参数，别漏掉图注：**

```latex
% 改之前
\figph[0.85]{村口：中枢场景，画面上有多个可点热点}{村口·村庄中枢}{scene-village}

% 改之后：第二参数换成图片路径（要带扩展名），后两个原样不动
\fig[0.85]{figures/07-final-showcase/compressed/scene-village.jpg}{村口·村庄中枢}{scene-village}
```

最容易漏的是把说明文字替换成路径之后，连图注一起删掉——`\fig` 少一个参数，TeX 直接报 `Runaway argument`，图整张消失。

### 一般插图

```latex
\fig[0.8]{figures/07-final-showcase/cover.png}{游戏封面效果}{cover}
```

- 第一个参数（可省略，默认 `0.8`）是图片宽度占版心宽度的比例
- 第三个参数是图注
- 第四个参数是引用标签，正文中用 `图\ref{fig:cover}` 引用，编号自动生成

---

## 六、写作约定

### 章标题

用 `\chapter{项目概述}`。编号自动生成为中文数字「一、二、……十一」，**不要手写「第一章」**。

### 小节

```latex
\section{游戏简介}
\subsection{叙事结构}
```

### 未完成的内容用 `\pending` 标记

```latex
\section{测试与回帖情况总结}
\pending
```

编译出来是红色加粗的【待补充】。定稿前全局搜索 `\pending` 确认已清空——这样不会出现「某章其实还空着但没人发现」的情况。

需要标注具体事项时可用 `\pending[待补截图]`。

### 表格

已加载 `booktabs`，三线表写法：

```latex
\begin{table}[htbp]
  \centering
  \caption{迭代排期}
  \begin{tabular}{lll}
    \toprule
    阶段 & 时间 & 交付物 \\
    \midrule
    V2   & 第 1 周 & 核心玩法闭环 \\
    V3   & 第 2 周 & 探索与对话系统 \\
    \bottomrule
  \end{tabular}
\end{table}
```

18 行的长表格用 `xltabular` 而不是 `table` + `tabularx`，否则浮动体会被推到下一页、和上面的小标题分家。写法见第二章的场景清单表。

### 代码片段

已加载 `listings`，并在 `tex/preamble.tex` 里补了一份 JavaScript 语言定义（listings 不自带 JavaScript），所以写 `language=JavaScript` 就能给关键字上色。代码块里除游戏台词外不要写中文，等宽字体下中英混排对不齐；说明文字写到正文或 `caption` 里。

```latex
\begin{lstlisting}[language=JavaScript, caption={状态机核心}, label={lst:fsm}]
function transition(state, event) { ... }
\end{lstlisting}
```

### 中文排版

- 中文**不要用 `\itshape`**：ctex 下没有真正的斜体，只会得到难看的伪斜体。要弱化就用 `{\small\color{black!55} ...}`
- 中文引号用全角弯引号 “ ”，不要用直引号
- `\href` 的显示文字里 `#` 写成 `\#`
- 表格里的 token 名（如 `--bg`）写成 `-{}-bg`，否则 TeX 连字会把两个连字符排成破折号

---

## 七、已知提示

编译时 stderr 会出现一次 `xdvipdfmx:warning: Object @page.1 already defined`。
这是 `hyperref` + `xdvipdfmx` 的已知无害提示，不影响 PDF 内容与书签，`.log` 文件里没有任何警告。

另外第五章的表格会报一批 `Underfull \hbox`，是列宽导致的字符间距拉伸，无害，不影响观感。
