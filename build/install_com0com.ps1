param([string]$Port1="COM20",[string]$Port2="COM21")
$ErrorActionPreference = "SilentlyContinue"

Write-Host "[AroniumPOS] COM port setup starting..."
Write-Host "[AroniumPOS] Target: $Port1 <-> $Port2"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "[AroniumPOS] Script dir: $scriptDir"

# Known com0com install paths
$known = @(
    "C:\Program Files\com0com\setupc.exe",
    "C:\Program Files (x86)\com0com\setupc.exe"
)
$setupc = $null
foreach ($p in $known) {
    if (Test-Path $p) { $setupc = $p; Write-Host "[AroniumPOS] setupc found: $setupc"; break }
}

# If not installed, run bundled setup
if (-not $setupc) {
    $bundled = Join-Path $scriptDir "com0com-setup.exe"
    Write-Host "[AroniumPOS] Bundled setup: $bundled (exists: $(Test-Path $bundled))"

    if (Test-Path $bundled) {
        Write-Host "[AroniumPOS] Running bundled installer silently..."

        # Run with /S flag for silent install
        $proc = Start-Process -FilePath $bundled `
            -ArgumentList "/S" `
            -Verb RunAs `
            -Wait `
            -PassThru

        Write-Host "[AroniumPOS] Installer exit code: $($proc.ExitCode)"
        Start-Sleep -Seconds 5

        # Check again after install
        foreach ($p in $known) {
            if (Test-Path $p) { $setupc = $p; Write-Host "[AroniumPOS] Found after install: $setupc"; break }
        }

        # If still not found, search the entire Program Files
        if (-not $setupc) {
            Write-Host "[AroniumPOS] Searching for setupc.exe..."
            $found = Get-ChildItem "C:\Program Files*" -Filter "setupc.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $setupc = $found.FullName; Write-Host "[AroniumPOS] Found via search: $setupc" }
        }
    } else {
        Write-Host "[AroniumPOS] ERROR: com0com-setup.exe not found at $bundled"
        exit 1
    }
}

if (-not $setupc) {
    Write-Host "[AroniumPOS] ERROR: setupc.exe not found. com0com may need a reboot to finish installing."
    exit 1
}

# Remove existing pairs to avoid conflicts
Write-Host "[AroniumPOS] Cleaning existing virtual pairs..."
& $setupc remove 0 2>&1 | Out-Null
& $setupc remove 1 2>&1 | Out-Null
Start-Sleep -Milliseconds 800

# Create the new pair
Write-Host "[AroniumPOS] Creating pair: $Port1 <-> $Port2"
$result = & $setupc install "PortName=$Port1" "PortName=$Port2" 2>&1
Write-Host "[AroniumPOS] Result: $result"

Write-Host "[AroniumPOS] SUCCESS: $Port1 <-> $Port2 ready"
exit 0
