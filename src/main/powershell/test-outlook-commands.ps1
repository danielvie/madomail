param(
  [string]$ScriptPath = 'src/main/powershell/outlook.ps1'
)

$ErrorActionPreference = 'Stop'

function Invoke-OutlookCommand([string]$command, [string]$payload_json = '{}') {
  Write-Host ''
  Write-Host ">>> Testing command: $command" -ForegroundColor Cyan
  Write-Host "Payload: $payload_json"

  $output = & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $ScriptPath -Command $command -Payload $payload_json
  if ($LASTEXITCODE -ne 0) {
    throw "Command '$command' exited with code $LASTEXITCODE"
  }

  Write-Host 'Raw output:' -ForegroundColor DarkGray
  Write-Host $output

  $parsed = $output | ConvertFrom-Json
  if (-not $parsed.success) {
    Write-Host "Command failed: $($parsed.error)" -ForegroundColor Red
    return $parsed
  }

  Write-Host 'Command succeeded.' -ForegroundColor Green
  return $parsed
}

try {
  if (-not (Test-Path $ScriptPath)) {
    throw "Script path not found: $ScriptPath"
  }

  Write-Host 'Running direct harness against outlook.ps1' -ForegroundColor Yellow
  Write-Host "Script: $ScriptPath"

  $folders_result = Invoke-OutlookCommand -command 'ListFolders'
  $inbox_result = Invoke-OutlookCommand -command 'ListInbox' -payload_json '{"maxResults":10}'

  Write-Host ''
  Write-Host 'Summary' -ForegroundColor Yellow

  if ($folders_result.success) {
    $folder_count = @($folders_result.data).Count
    Write-Host "Folders returned: $folder_count"
    if ($folder_count -gt 0) {
      Write-Host 'First folders:'
      @($folders_result.data | Select-Object -First 10) | ConvertTo-Json -Depth 6
    }
  }

  if ($inbox_result.success) {
    $message_count = @($inbox_result.data).Count
    Write-Host "Inbox rows returned: $message_count"
    if ($message_count -gt 0) {
      Write-Host 'First inbox rows:'
      @($inbox_result.data | Select-Object -First 5) | ConvertTo-Json -Depth 6
    }
  }

  if ($folders_result.success -and $inbox_result.success) {
    Write-Host ''
    Write-Host 'Direct command harness completed successfully.' -ForegroundColor Green
  } else {
    Write-Host ''
    Write-Host 'One or more commands failed. See output above.' -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host ''
  Write-Host 'Direct command harness failed.' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
