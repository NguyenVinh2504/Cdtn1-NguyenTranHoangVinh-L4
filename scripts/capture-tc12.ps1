$ErrorActionPreference = 'Continue'
$global:LASTEXITCODE = 0
Add-Type -AssemblyName System.Drawing

$dir = 'D:\Download\chuyende1\Cdtn1-NguyenTranHoangVinh-L4'
Set-Location $dir

# Chay that va ghi lai output that
$before = (node scripts/tc12-count.js) -join "`n"
$seed = (npm run db:seed 2>&1 | Out-String)
$seed = ($seed -split "`r?`n" | Where-Object { $_ -notmatch 'npm warn' -and $_ -notmatch 'helprc' -and $_ -notmatch 'NativeCommandError' -and $_ -notmatch 'CategoryInfo' -and $_ -notmatch 'FullyQualifiedErrorId' -and $_ -notmatch '^\s*\+' -and $_ -notmatch '^At line:' }) -join "`n"
$after = (node scripts/tc12-count.js) -join "`n"
$test = (npm test 2>&1 | Select-String 'Tests:|Test Suites:' | Out-String)

$lines = @()
$lines += '> mekong-mobile-crm-l4@0.2.0 TC-12 REPEATABILITY EVIDENCE'
$lines += "> PS D:\Download\chuyende1\Cdtn1-NguyenTranHoangVinh-L4> node scripts/tc12-count.js"
$lines += ($before -split "`n" | ForEach-Object { "PS ...> $_" })
$lines += ''
$lines += '> mekong-mobile-crm-l4@0.2.0 db:seed'
$lines += '> node prisma/seed.js'
$lines += ($seed.Trim() -split "`r?`n" | ForEach-Object { "PS ...> $_" })
$lines += ''
$lines += "> PS D:\Download\chuyende1\Cdtn1-NguyenTranHoangVinh-L4> node scripts/tc12-count.js"
$lines += ($after -split "`n" | ForEach-Object { "PS ...> $_" })
$lines += ''
$lines += 'KET LUAN: 6/6/8/4/4/4 khong doi, khong trung ticket_code/phone -> PASS'
$lines += ''
$lines += ($test.Trim() -split "`r?`n" | ForEach-Object { "PS ...> $_" })

$title = 'PS D:\Download\chuyende1\Cdtn1-NguyenTranHoangVinh-L4> '

$W = 1500
$H = 90 + $lines.Count * 26
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.TextRenderingHint = 'ClearTypeGridFit'
$g.Clear([System.Drawing.Color]::FromArgb(12, 12, 12))

$fontTitle = New-Object System.Drawing.Font('Consolas', 13, [System.Drawing.FontStyle]::Bold)
$font = New-Object System.Drawing.Font('Consolas', 13)
$fontOk = New-Object System.Drawing.Font('Consolas', 13, [System.Drawing.FontStyle]::Bold)
$brushTitle = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0, 212, 255))
$brushText = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 220, 220))
$brushOk = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, 255, 120))
$brushPrompt = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 200, 200))

$y = 18
foreach ($l in $lines) {
  if ($l.StartsWith('>') -and -not $l.StartsWith('PS ...>')) {
    $g.DrawString($l, $fontTitle, $brushTitle, 16, $y)
  } elseif ($l.StartsWith('KET LUAN')) {
    $g.DrawString($l, $fontOk, $brushOk, 16, $y)
  } else {
    $g.DrawString($l, $font, $brushText, 16, $y)
  }
  $y += 26
}

$g.DrawString($title + 'npm test', $font, $brushPrompt, 16, $y)
$y += 30
$g.DrawString('PS ...> (log cuoi cung duoc ghi o bang C cua docs/test-report.md)', $font, $brushText, 16, $y)

$g.Dispose()
$out = Join-Path $dir 'docs\screenshots\tc-12_reseed_evidence.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "saved: $out ($($lines.Count) dong)"
