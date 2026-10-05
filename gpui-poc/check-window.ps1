param([switch]$ReaderDemo, [switch]$Demo, [int]$ProcessId, [switch]$VerifyBody, [ValidatePattern('^[0-9a-fA-F]{6}$')][string]$ExpectedPanel = 'ffffff')
$ErrorActionPreference = 'Stop'
$exe = Join-Path $PSScriptRoot 'target\release\mado-mail-poc.exe'
if ($ProcessId) {
    $candidate = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    $debugExe = Join-Path $PSScriptRoot 'target\debug\mado-mail-poc.exe'
    if ($candidate -and $candidate.Path -eq $debugExe) { $exe = $debugExe }
}
$app = Get-Process mado-mail-poc -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe -and (-not $ProcessId -or $_.Id -eq $ProcessId) -and (-not $ReaderDemo -or $_.MainWindowTitle -eq 'Mado Mail - Message reader PoC') -and (-not $Demo -or $_.MainWindowTitle -eq 'Mado Mail - Demo') } | Select-Object -First 1
if ($ProcessId -and -not $app) { throw 'The requested PoC process is not running.' }
if ($VerifyBody) {
    if (-not $ReaderDemo -or -not $ProcessId) { throw 'Body verification requires an explicit synthetic reader process.' }
    $command = (Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId").CommandLine
    if ($command -notmatch '--reader-check(?:\s|$)') { throw 'Body verification is restricted to --reader-check mode.' }
}
if (-not $app) {
    if ($ReaderDemo) {
        $app = Start-Process -FilePath $exe -ArgumentList '--reader-demo' -PassThru
    } elseif ($Demo) {
        $app = Start-Process -FilePath $exe -ArgumentList '--demo' -PassThru
    } else {
        $app = Start-Process -FilePath $exe -PassThru
    }
    $app.WaitForInputIdle(15000) | Out-Null
    Start-Sleep -Seconds 3
    $app.Refresh()
}
if ($app.HasExited -or $app.MainWindowHandle -eq 0) { throw 'GPUI did not open a main window.' }
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class PocCapture {
    [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Rect r);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll", EntryPoint = "GetClassLongPtrW")] public static extern IntPtr GetClassLongPtr(IntPtr h, int index);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr LoadLibraryExW(string path, IntPtr file, uint flags);
    [DllImport("kernel32.dll", EntryPoint = "FindResourceW")] public static extern IntPtr FindResource(IntPtr module, IntPtr name, IntPtr type);
    [DllImport("kernel32.dll")] public static extern bool FreeLibrary(IntPtr module);
}
'@
$module = [PocCapture]::LoadLibraryExW($exe, [IntPtr]::Zero, 2)
if ($module -eq [IntPtr]::Zero) { throw 'Could not inspect executable resources.' }
try {
    if ([PocCapture]::FindResource($module, [IntPtr]1, [IntPtr]14) -eq [IntPtr]::Zero) { throw 'Application icon resource 1 is missing from the executable.' }
} finally { [PocCapture]::FreeLibrary($module) | Out-Null }
if ([PocCapture]::GetClassLongPtr($app.MainWindowHandle, -14) -eq [IntPtr]::Zero) { throw 'GPUI did not load the application window icon.' }
[PocCapture]::SetProcessDPIAware() | Out-Null
$rect = New-Object PocCapture+Rect
[PocCapture]::GetWindowRect($app.MainWindowHandle, [ref]$rect) | Out-Null
Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap(($rect.Right - $rect.Left), ($rect.Bottom - $rect.Top))
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$dc = $graphics.GetHdc()
try {
    # Capture only this window, never unrelated desktop contents or overlapping applications.
    $captured = [PocCapture]::PrintWindow($app.MainWindowHandle, $dc, 2)
} finally {
    $graphics.ReleaseHdc($dc)
}
if (-not $captured) { Write-Warning 'Window opened, but this GPU window cannot be captured with PrintWindow.' }
$shot = Join-Path $PSScriptRoot $(if ($ReaderDemo) { 'target\reader-window.png' } elseif ($Demo) { 'target\triage-window.png' } else { 'target\poc-window.png' })
$bitmap.Save($shot, [System.Drawing.Imaging.ImageFormat]::Png)
$bannerSamples = 0
$themeSamples = 0
if ($VerifyBody) {
    # Sample only the synthetic reader header, not the white HTML body beneath it.
    $panelRgb = [Convert]::ToInt32($ExpectedPanel, 16)
    for ($y = 60; $y -lt [Math]::Min(120, $bitmap.Height); $y += 4) {
        for ($x = 30; $x -lt [Math]::Min(500, $bitmap.Width); $x += 4) {
            if (($bitmap.GetPixel($x, $y).ToArgb() -band 0xffffff) -eq $panelRgb) { $themeSamples++ }
        }
    }
    # Detect the fixture's solid blue banner in the parent window, not a browser-only capture.
    for ($y = 0; $y -lt $bitmap.Height; $y += 4) {
        for ($x = 0; $x -lt $bitmap.Width; $x += 4) {
            $color = $bitmap.GetPixel($x, $y)
            if (($color.R -eq 9 -and $color.G -eq 49 -and $color.B -eq 109) -or
                ($color.R -eq 25 -and $color.G -eq 106 -and $color.B -eq 246)) { $bannerSamples++ }
        }
    }
}
$graphics.Dispose()
$bitmap.Dispose()
if ($VerifyBody -and $bannerSamples -lt 500) { throw 'WebView2 rendered the document, but its banner is not visible in the GPUI parent window.' }
if ($VerifyBody -and $themeSamples -lt 500) { throw "Reader header did not apply theme panel #$ExpectedPanel." }
$app.Refresh()
[pscustomobject]@{ ProcessId = $app.Id; Window = $app.MainWindowTitle; ApplicationIcon = 'embedded and loaded'; PrivateMiB = [math]::Round($app.PrivateMemorySize64 / 1MB, 1); WorkingSetMiB = [math]::Round($app.WorkingSet64 / 1MB, 1); Screenshot = $shot } | Format-List
