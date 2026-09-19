# 《借灯》项目文档（LaTeX）

课程项目文档的 LaTeX 工程。章节骨架对应 [项目文档最终版.md](项目文档最终版.md) 中的十一个一级标题。

## 文件组织

```
docs/project-report/
├── main.tex                  # 主控文件：只做加载配置 + 拼装章节，正文不写在这里
├── build.sh                  # 构建脚本，产出 out/main.pdf
├── README.md                 # 本文件
├── .gitignore                # 忽略 out/ 与 LaTeX 中间文件
│
├── tex/                      # 配置层（改样式只动这里）
│   ├── info.tex              # 项目元信息：项目名、组员、课程、日期 ← 需要你填写
│   ├── preamble.tex          # 页面、颜色、章节标题格式、代码样式、页眉页脚
│   ├── commands.tex          # 自定义命令：\pending 待补充标记、\fig 插图
│   └── cover.tex             # 封面
│
├── chapters/                 # 内容层（写作只动这里）
│   ├── 01-overview.tex
│   ├── 02-game-design.tex
│   ├── 03-aesthetics-ux.tex
│   ├── 04-technical.tex
│   ├── 05-management.tex
│   ├── 06-testing-feedback.tex
│   ├── 07-final-showcase.tex
│   ├── 08-team-summary.tex
│   ├── 09-individual-summary.tex
│   ├── 10-award-application.tex
│   └── 11-final-score.tex
│
├── figures/                  # 图片资源，按章节分目录，见 figures/README.md
│
├── 项目文档最终版.md          # 原始大纲，作为格式参照保留
└── out/                      # 编译产物（已 gitignore）
```

**三层的边界**：想改文档长什么样 → `tex/`；想改文档写了什么 → `chapters/`；想加图 → `figures/`。三者互不干扰。

## 编译

```bash
bash build.sh
```

产物为 `out/main.pdf`。脚本会打印引擎、主文件绝对路径和输出目录。

输出目录选 `out/` 是为了与你这台机器上 VS Code 的全局设置
`"latex-workshop.latex.outDir": "%DIR%/out"` 一致——编辑器和脚本产出同一个 PDF，
不会出现两份互相矛盾的构建结果。

第一次编译需要跑两遍以上才能生成正确的目录页码，`latexmk` 已自动处理。

### 编辑器配置

- **VS Code + LaTeX Workshop**：这台机器已全局配置好 `latexmk (xelatex)` 配方和 `%DIR%/out` 输出目录，打开 `main.tex` 保存即可自动编译。**唯一需要确认的**是插件能否把 `main.tex` 认作 Root File——如果它误把某个 `chapters/*.tex` 当成主文件，在 `main.tex` 里右键选 "Set as LaTeX root"。
- **Overleaf**：上传整个 `project-report/` 目录，在 Menu → Compiler 里选 **XeLaTeX**（`main.tex` 首行已写 `% !TeX program = xelatex`，一般会自动识别）。
- 手动编译：`xelatex -output-directory=out main.tex`，重复两到三次。

## 已知提示

编译时 stderr 会出现一次 `xdvipdfmx:warning: Object @page.1 already defined`。
这是 `hyperref` + `xdvipdfmx` 的已知无害提示，不影响 PDF 内容与书签，`.log` 文件里没有任何警告。

## 写作约定

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

### 插图

```latex
\fig[0.8]{figures/07-final-showcase/cover.png}{游戏封面效果}{cover}
```

详见 [figures/README.md](figures/README.md)。

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

### 代码片段

已加载 `listings`：

```latex
\begin{lstlisting}[language=JavaScript, caption={状态机核心}, label={lst:fsm}]
function transition(state, event) { ... }
\end{lstlisting}
```

## 待填写

`tex/info.tex` 中的以下字段目前是占位文本，需要补上：

- `\TeamName` —— 项目组名称
- `\TeamMembers` —— 小组成员名单
- `\DocVersion` —— 文档版本号
- `\ProjectSubtitle` —— 副标题（已给出一句，可替换）
