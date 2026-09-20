# ============================================================
# compress-figures.ps1 —— 报告插图批量压缩
#
# 把截图统一缩到长边 1920、裁掉浏览器自带的标签栏与地址栏，输出到同级
# compressed/ 目录。原图一个字都不动，处理完可以逐张对比再决定用哪个。
#
# 用法（在 docs/project-report 下执行）：
#   powershell -ExecutionPolicy Bypass -File tools/compress-figures.ps1
#   powershell -ExecutionPolicy Bypass -File tools/compress-figures.ps1 `
#              -SourceDir figures/07-final-showcase -MaxLongSide 1600
#
# 为什么是 1920：图在报告里最宽占 12.75cm（版心宽的 0.85 倍），1920 像素
# 对应约 383 DPI，比印刷 300 DPI 的标准还有富余。再往上加分辨率，加的全
# 是 PDF 体积，屏幕上一点看不出来。
#
# 为什么用 JPEG 而不是 PNG：游戏截图里有大量雨丝和渐变，属于高频细节，
# PNG 的无损压缩在这种内容上效率极差——缩到 1920 之后每张仍有 2.5MB，
# 十二张就是 30MB。同一张图存 JPEG 质量 92 只要 400KB 上下，而在报告里
# 的显示尺寸（宽 12.75cm）下两者肉眼没有区别。真要看区别，得把 PDF 放大
# 到 400% 盯像素，那不是读报告的方式。
#
# 裁剪判定：浏览器界面是浅色，游戏画面是深色（--bg #07090e）。自上而下
# 逐行取平均亮度，亮到暗的分界就是浏览器界面的下沿；底部同理。判错了用
# -SkipCrop 关掉裁剪，只做缩放。
# ============================================================

[CmdletBinding()]
param(
    [string]$SourceDir = "figures/07-final-showcase",
    [string]$OutSubDir = "compressed",
    [int]$MaxLongSide = 1920,
    [ValidateSet("Jpeg", "Png")][string]$OutFormat = "Jpeg",
    [int]$Quality = 92,
    [switch]$SkipCrop
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing

# 源目录相对 report 根解析，和从哪个目录调用脚本无关
$reportRoot = Split-Path $PSScriptRoot -Parent
$srcDir = Join-Path $reportRoot $SourceDir
if (-not (Test-Path $srcDir)) {
    Write-Host "找不到源目录：$srcDir" -ForegroundColor Red
    exit 1
}
$srcFull = (Resolve-Path $srcDir).Path
$outFull = Join-Path $srcFull $OutSubDir

# ---------- 关键参数全部打印，别让人猜脚本在对谁动手 ----------
Write-Host "===== 插图压缩 =====" -ForegroundColor Cyan
Write-Host "项目根目录 : $reportRoot"
Write-Host "源目录     : $srcFull"
Write-Host "输出目录   : $outFull"
Write-Host "长边上限   : $MaxLongSide px"
Write-Host "输出格式   : $OutFormat$(if ($OutFormat -eq 'Jpeg') { "（质量 $Quality）" })"
Write-Host "裁剪浏览器界面 : $(if ($SkipCrop) { '否' } else { '是' })"
Write-Host ""

if (-not (Test-Path $outFull)) { New-Item -ItemType Directory -Path $outFull | Out-Null }

# 判断某一行是不是浅色（浏览器界面）。每行等距采样若干点求平均亮度，
# 不逐像素取色：3072 宽的图逐像素要 560 万次调用，慢到没法用。
function Test-RowIsLight {
    param(
        [System.Drawing.Bitmap]$Bmp,
        [int]$Y,
        [int]$Samples = 40
    )
    $sum = 0.0
    for ($i = 0; $i -lt $Samples; $i++) {
        $x = [int]($i * ($Bmp.Width - 1) / ($Samples - 1))
        $c = $Bmp.GetPixel($x, $Y)
        $sum += 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B
    }
    return ($sum / $Samples) -gt 200
}

$files = Get-ChildItem -Path $srcFull -Filter *.png -File | Sort-Object Name
if ($files.Count -eq 0) {
    Write-Host "源目录里没有 PNG，什么都没做。" -ForegroundColor Yellow
    exit 0
}

$totalBefore = 0
$totalAfter = 0
$rows = @()

foreach ($f in $files) {
    $totalBefore += $f.Length
    $src = [System.Drawing.Bitmap]::FromFile($f.FullName)

    try {
        $w = $src.Width
        $h = $src.Height

        # ---------- 裁掉浏览器界面 ----------
        $top = 0
        $bottom = $h - 1
        if (-not $SkipCrop) {
            $limit = [int]($h * 0.25)   # 最多裁四分之一，判错了不至于把图裁没
            while ($top -lt $limit -and (Test-RowIsLight -Bmp $src -Y $top)) { $top++ }
            while ($bottom -gt ($h - 1 - $limit) -and (Test-RowIsLight -Bmp $src -Y $bottom)) { $bottom-- }
        }
        $cropH = $bottom - $top + 1

        # ---------- 缩放到长边上限 ----------
        $scale = [Math]::Min(1.0, $MaxLongSide / [Math]::Max($w, $cropH))
        $newW = [int][Math]::Round($w * $scale)
        $newH = [int][Math]::Round($cropH * $scale)

        $dst = New-Object System.Drawing.Bitmap($newW, $newH, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $g = [System.Drawing.Graphics]::FromImage($dst)
        try {
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $rectDst = New-Object System.Drawing.Rectangle(0, 0, $newW, $newH)
            $g.DrawImage($src, $rectDst, 0, $top, $w, $cropH, [System.Drawing.GraphicsUnit]::Pixel)
        }
        finally { $g.Dispose() }

        $ext = if ($OutFormat -eq "Jpeg") { ".jpg" } else { ".png" }
        $outName = [IO.Path]::GetFileNameWithoutExtension($f.Name) + $ext
        $outPath = Join-Path $outFull $outName

        if ($OutFormat -eq "Jpeg") {
            $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
                     Where-Object { $_.MimeType -eq "image/jpeg" }
            $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
                [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
            $dst.Save($outPath, $codec, $encParams)
            $encParams.Dispose()
        }
        else {
            $dst.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        }
        $dst.Dispose()

        $after = (Get-Item $outPath).Length
        $totalAfter += $after
        $rows += [PSCustomObject]@{
            文件   = $outName
            原始   = "$w x $h"
            裁剪   = if ($SkipCrop) { "-" } else { "上 $top / 下 $($h - 1 - $bottom) px" }
            输出   = "$newW x $newH"
            体积前 = "{0:N1} MB" -f ($f.Length / 1MB)
            体积后 = "{0:N0} KB" -f ($after / 1KB)
        }
    }
    finally { $src.Dispose() }
}

$rows | Format-Table -AutoSize

Write-Host ""
Write-Host ("合计：{0:N1} MB → {1:N1} MB，压掉 {2:P0}" -f ($totalBefore / 1MB), ($totalAfter / 1MB), (1 - $totalAfter / $totalBefore)) -ForegroundColor Green
Write-Host ""
Write-Host "对比过效果满意之后，把第七章里的路径改成 $OutSubDir/ 下的文件即可，"
Write-Host "例如 figures/07-final-showcase/$OutSubDir/entry.png"
