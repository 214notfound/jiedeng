#!/usr/bin/env bash
# ============================================================
# 构建《借灯》项目文档 PDF
#
# 用法：bash build.sh
# 依赖：TeX Live 或 MiKTeX，需含 xelatex 与 latexmk
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"

ENGINE="xelatex"
MAIN="main.tex"
# 与 VS Code 全局设置 latex-workshop.latex.outDir = "%DIR%/out" 保持一致，
# 避免出现两个输出目录、预览的 PDF 与脚本产出的 PDF 不是同一个文件。
OUTDIR="out"

echo "==================================================="
echo " 《借灯》项目文档 · 构建"
echo " 编译引擎 : ${ENGINE}"
echo " 主文件   : $(pwd)/${MAIN}"
echo " 输出目录 : $(pwd)/${OUTDIR}"
echo " 输出文件 : $(pwd)/${OUTDIR}/main.pdf"
echo "==================================================="

mkdir -p "${OUTDIR}"

latexmk \
  -"${ENGINE}" \
  -interaction=nonstopmode \
  -file-line-error \
  -halt-on-error \
  -outdir="${OUTDIR}" \
  "${MAIN}"

echo
echo "构建完成 -> $(pwd)/${OUTDIR}/main.pdf"
