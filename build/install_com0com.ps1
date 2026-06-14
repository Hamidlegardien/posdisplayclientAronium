param([string]$Port1="COM20",[string]$Port2="COM21")

$logF = Join-Path $env:TEMP "com0com_install_log.txt"
function Log([string]$msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    Add-Content -Path $logF -Value $line -ErrorAction SilentlyContinue
}

Log "=== AroniumPOS COM setup START ==="
Log "Port1=$Port1  Port2=$Port2"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Log "User=$env:USERNAME  IsAdmin=$isAdmin"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$driverDir = Join-Path $scriptDir "com0com_driver"
Log "scriptDir=$scriptDir"
Log "driverDir=$driverDir  exists=$(Test-Path $driverDir)"

if (-not (Test-Path $driverDir)) { Log "ERROR: driver folder missing"; exit 1 }

# ── Find existing com0com installation ───────────────────────────────────
# com0com may already be installed (setupc.exe in Program Files)
$knownPaths = @(
    "C:\Program Files\com0com\setupc.exe",
    "C:\Program Files (x86)\com0com\setupc.exe"
)
$installedSetupc = $null
foreach ($kp in $knownPaths) {
    if (Test-Path $kp) { $installedSetupc = $kp; break }
}
Log "Existing com0com setupc: $(if($installedSetupc){'FOUND: '+$installedSetupc}else{'NOT FOUND'})"

# ── Copy driver to temp (needed for setupc.exe + setup.dll together) ──────
$tempDir = Join-Path $env:TEMP ("com0com_" + [System.Guid]::NewGuid().ToString("N").Substring(0,8))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Copy-Item (Join-Path $driverDir "*") -Destination $tempDir -Force
$fileList = (Get-ChildItem $tempDir | Select-Object -ExpandProperty Name) -join ", "
Log "Copied to: $tempDir  Files: $fileList"

$bundledSetupc = Join-Path $tempDir "setupc.exe"

# ── Decide which setupc to use ────────────────────────────────────────────
# If com0com is already installed, use its setupc (driver already in kernel)
# If not, run the full installer first then use installed setupc
$setupcExe  = $null
$setupcWDir = $null

if ($installedSetupc) {
    Log "Using INSTALLED setupc (driver already in kernel)"
    $setupcExe  = $installedSetupc
    $setupcWDir = Split-Path -Parent $installedSetupc
} else {
    Log "com0com not installed — running bundled setup.exe first..."
    $bundledSetup = Join-Path $scriptDir "com0com-setup.exe"
    if (-not (Test-Path $bundledSetup)) {
        # fallback: look in parent of scriptDir
        $bundledSetup = Join-Path (Split-Path -Parent $scriptDir) "com0com-setup.exe"
    }
    Log "bundled setup.exe: $bundledSetup  exists=$(Test-Path $bundledSetup)"

    if (Test-Path $bundledSetup) {
        # Extract setup to its own temp so it finds its .inf
        $setupTemp = Join-Path $env:TEMP ("com0com_setup_" + [System.Guid]::NewGuid().ToString("N").Substring(0,8))
        New-Item -ItemType Directory -Path $setupTemp -Force | Out-Null
        Copy-Item $bundledSetup -Destination (Join-Path $setupTemp "com0com-setup.exe") -Force
        Log "Running installer silently from: $setupTemp"
        $inst = Start-Process (Join-Path $setupTemp "com0com-setup.exe") `
            -ArgumentList "/S" `
            -WorkingDirectory $setupTemp `
            -Wait -PassThru -WindowStyle Hidden
        Log "Installer exit=$([int]$inst.ExitCode)"
        Remove-Item $setupTemp -Recurse -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3

        # Find newly installed setupc
        foreach ($kp in $knownPaths) {
            if (Test-Path $kp) { $installedSetupc = $kp; break }
        }
        if ($installedSetupc) {
            $setupcExe  = $installedSetupc
            $setupcWDir = Split-Path -Parent $installedSetupc
            Log "Using newly installed setupc: $setupcExe"
        }
    }

    # Last resort: use bundled setupc (may work if pnputil got the driver in)
    if (-not $setupcExe) {
        Log "Falling back to bundled setupc"
        # Register the driver properly first
        $inf = Join-Path $tempDir "com0com.inf"
        $pnp = Start-Process "pnputil.exe" `
            -ArgumentList "/add-driver `"$inf`" /install /force" `
            -Wait -PassThru -WindowStyle Hidden -ErrorAction SilentlyContinue
        Log "pnputil (force) exit=$([int]$pnp.ExitCode)"
        Start-Sleep -Milliseconds 2000
        $setupcExe  = $bundledSetupc
        $setupcWDir = $tempDir
    }
}

if (-not (Test-Path $setupcExe)) {
    Log "ERROR: No setupc.exe available"
    exit 1
}
Log "setupcExe=$setupcExe  wdir=$setupcWDir"

# ── Helper ────────────────────────────────────────────────────────────────
function Run-Setupc([string]$argStr) {
    Log "  > setupc $argStr"
    $p = Start-Process `
        -FilePath $setupcExe `
        -ArgumentList $argStr `
        -WorkingDirectory $setupcWDir `
        -Wait -PassThru -WindowStyle Hidden
    $code = [int]$p.ExitCode
    Log "  < exit=$code"
    return $code
}

# ── Remove ALL existing pairs first ──────────────────────────────────────
Log "Removing existing pairs (0..5)..."
for ($i = 0; $i -le 5; $i++) {
    $r = Run-Setupc "remove $i"
    if ($r -ne 0) { break }
}
Start-Sleep -Milliseconds 500

# ── Create new pair ───────────────────────────────────────────────────────
Log "Creating pair: $Port1 <-> $Port2"
$exitCode = Run-Setupc "install PortName=$Port1 PortName=$Port2"
Log "Final exitCode=$exitCode"

# Cleanup temp
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

if ($exitCode -eq 0) {
    Log "=== SUCCESS: $Port1 <-> $Port2 ==="
    exit 0
} else {
    Log "=== FAILED: exitCode=$exitCode ==="
    exit 1
}
