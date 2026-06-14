param([string]$Port1="COM20", [string]$Port2="COM21")

$logF = Join-Path $env:TEMP "vspe_install_log.txt"
function Log([string]$msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content -Path $logF -Value $line -ErrorAction SilentlyContinue
}

Log "=== VSPE port setup START ==="
Log "Port1=$Port1  Port2=$Port2"

# Find VSPE install dir
$vspePaths = @(
    "C:\Program Files\Eterlogic.com\VSPE",
    "C:\Program Files (x86)\Eterlogic.com\VSPE",
    "C:\Program Files\VSPE",
    "C:\Program Files (x86)\VSPE"
)
$vspeDir = $null
foreach ($p in $vspePaths) {
    if (Test-Path (Join-Path $p "VspeMulator.exe")) { $vspeDir = $p; break }
}

if (-not $vspeDir) {
    Log "ERROR: VSPE not found"
    exit 1
}
Log "VSPE found at: $vspeDir"

# Build config file
$cfgPath = Join-Path $env:TEMP "aroniumpos_pair.vspe"
$xml = @"
<?xml version="1.0" encoding="UTF-8"?>
<VSPE_CONFIGURATION version="1">
  <DEVICE type="NullModem" enabled="1">
    <PORT index="0">$Port1</PORT>
    <PORT index="1">$Port2</PORT>
  </DEVICE>
</VSPE_CONFIGURATION>
"@
[System.IO.File]::WriteAllText($cfgPath, $xml, [System.Text.Encoding]::UTF8)
Log "Config written: $cfgPath"

# Load config via VspeMulator.exe
$vspe = Join-Path $vspeDir "VspeMulator.exe"
Log "Launching VSPE with config..."
$p = Start-Process $vspe -ArgumentList "-silent -load `"$cfgPath`"" -Wait -PassThru -WindowStyle Hidden
Log "VSPE exit: $($p.ExitCode)"

if ($p.ExitCode -eq 0) {
    Log "=== SUCCESS: $Port1 <-> $Port2 ==="
    exit 0
} else {
    Log "=== FAILED: exit=$($p.ExitCode) ==="
    exit 1
}
