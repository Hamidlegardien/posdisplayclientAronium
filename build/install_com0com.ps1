param([string]$Port1="COM20",[string]$Port2="COM21")
$ErrorActionPreference="SilentlyContinue"
Write-Host "[AroniumPOS] Starting com0com setup..."
Write-Host "[AroniumPOS] Ports: $Port1 <-> $Port2"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bundled   = Join-Path $scriptDir "com0com-setup.exe"
Write-Host "[AroniumPOS] Script dir: $scriptDir"
Write-Host "[AroniumPOS] Bundled exe exists: $(Test-Path $bundled)"
$known = @("C:\Program Files\com0com\setupc.exe","C:\Program Files (x86)\com0com\setupc.exe")
$setupc = $null
foreach ($p in $known) { if (Test-Path $p) { $setupc=$p; Write-Host "[AroniumPOS] Found: $setupc"; break } }
if (-not $setupc) {
    if (Test-Path $bundled) {
        Write-Host "[AroniumPOS] Installing bundled com0com silently..."
        $proc = Start-Process -FilePath $bundled -ArgumentList "/S" -Wait -PassThru -Verb RunAs
        Write-Host "[AroniumPOS] Install exit code: $($proc.ExitCode)"
        Start-Sleep -Seconds 4
        foreach ($p in $known) { if (Test-Path $p) { $setupc=$p; break } }
    } else {
        Write-Host "[AroniumPOS] ERROR: bundled exe not found at $bundled"
        exit 1
    }
}
if (-not $setupc) { Write-Host "[AroniumPOS] ERROR: setupc.exe not found after install"; exit 1 }
Write-Host "[AroniumPOS] Using: $setupc"
& $setupc remove 0 2>&1 | Out-Null
& $setupc remove 1 2>&1 | Out-Null
Start-Sleep -Seconds 1
$r = & $setupc install "PortName=$Port1" "PortName=$Port2" 2>&1
Write-Host "[AroniumPOS] Result: $r"
Write-Host "[AroniumPOS] SUCCESS: $Port1 <-> $Port2 ready"
exit 0
