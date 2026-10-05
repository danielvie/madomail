$ErrorActionPreference = 'Stop'
$exe = Join-Path $PSScriptRoot 'target\release\mado-mail-poc.exe'
$report = Join-Path $PSScriptRoot 'target\reader-check.json'
Remove-Item $report -ErrorAction SilentlyContinue
# Start only the synthetic mode. It never restores authorization or calls Gmail.
$app = Start-Process -FilePath $exe -ArgumentList '--reader-check' -PassThru
try {
    if (-not $app.WaitForExit(30000)) { throw 'Synthetic reader check timed out.' }
    if (-not (Test-Path $report)) { throw "Reader produced no report. Exit code: $($app.ExitCode)" }
    $result = Get-Content $report -Raw | ConvertFrom-Json
    if (-not $result.ok) { throw "Reader check failed: $($result.error)" }
    Write-Output 'Reader check passed: HTML, embedded image visible in the parent window, remote-image permission/reblocking, disabled scripts/host objects, stale-completion rejection, resize, and scrolling.'
    Write-Output "Synthetic browser capture: $(Join-Path $PSScriptRoot 'target\reader-body.png')"
    Write-Output "Synthetic parent-window capture: $(Join-Path $PSScriptRoot 'target\reader-window.png')"
} finally {
    if (-not $app.HasExited) {
        $app.CloseMainWindow() | Out-Null
        if (-not $app.WaitForExit(5000)) { $app.Kill() }
    }
}
