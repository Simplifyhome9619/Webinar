# =============================================================
#  sync.ps1
#  Copies shared code (CSS, JS, assets) from Webinar → Connect,
#  then commits and pushes both repos.
#
#  When to run:
#    Every time we change CSS, JS, or any asset that both pages share.
#    (Content changes to index.html — hero copy, framework text — I
#     still apply to each page individually since they differ.)
#
#  How to run:
#    Open PowerShell and paste:
#      & "$env:USERPROFILE\Desktop\Landing Page\sync.ps1"
# =============================================================

$ErrorActionPreference = "Continue"

$src = "$env:USERPROFILE\Desktop\Landing Page"
$dst = "$env:USERPROFILE\Desktop\Connect Page"

if (-not (Test-Path $src)) {
    Write-Host "ERROR: Webinar folder not found at $src" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $dst)) {
    Write-Host "ERROR: Connect folder not found at $dst" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Syncing shared code: Webinar -> Connect     " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Folders that are identical across both landing pages
$folders = @("css", "js", "assets")

foreach ($f in $folders) {
    $sp = Join-Path $src $f
    $dp = Join-Path $dst $f

    if (Test-Path $sp) {
        Write-Host "  Copying $f\ ..." -ForegroundColor Yellow
        # /MIR mirrors the folder (adds new, updates changed, deletes removed).
        # /NFL /NDL /NP /NJH /NJS = quiet output.
        robocopy $sp $dp /MIR /NFL /NDL /NP /NJH /NJS | Out-Null
    }
}

Write-Host ""
Write-Host "  Shared files synced." -ForegroundColor Green
Write-Host ""

# Make sure git is on PATH (default Git for Windows install location)
$env:Path += ";C:\Program Files\Git\cmd"

# ---- Commit + push Webinar ----
Write-Host "Webinar repo:" -ForegroundColor Yellow
Set-Location $src
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "Update shared code" | Out-Null
    git push
    Write-Host "  -> pushed." -ForegroundColor Green
} else {
    Write-Host "  (no changes to commit)" -ForegroundColor Gray
}

# ---- Commit + push Connect ----
Write-Host ""
Write-Host "Connect repo:" -ForegroundColor Yellow
Set-Location $dst
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "Sync shared code from Webinar" | Out-Null
    git push
    Write-Host "  -> pushed." -ForegroundColor Green
} else {
    Write-Host "  (no changes to commit)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Done. Both sites will update in ~30 sec.    " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
