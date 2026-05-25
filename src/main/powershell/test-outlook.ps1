$ErrorActionPreference = 'Stop'

function Convert-MailItem([object]$item) {
  $sender_name = ''
  $sender_email = ''
  $subject = ''
  $entry_id = ''
  $received_time = ''

  try { if ($item.SenderName) { $sender_name = [string]$item.SenderName } } catch {}
  try { if ($item.SenderEmailAddress) { $sender_email = [string]$item.SenderEmailAddress } } catch {}
  try { if ($item.Subject) { $subject = [string]$item.Subject } } catch {}
  try { if ($item.EntryID) { $entry_id = [string]$item.EntryID } } catch {}
  try { if ($item.ReceivedTime) { $received_time = ([datetime]$item.ReceivedTime).ToString('o') } } catch {}

  return @{
    entry_id = $entry_id
    sender_name = $sender_name
    sender_email = $sender_email
    subject = $subject
    received_time = $received_time
  }
}

function Get-FolderTree([object]$folder, [string]$current_path, [int]$depth, [System.Collections.Generic.List[object]]$results) {
  if ($depth -gt 3) { return }

  $children = $folder.Folders
  $count = $children.Count
  for ($i = 1; $i -le $count; $i++) {
    $child = $children.Item($i)
    $name = [string]$child.Name
    $path = if ([string]::IsNullOrWhiteSpace($current_path)) { $name } else { "$current_path/$name" }
    $results.Add(@{ name = $name; path = $path })
    Get-FolderTree -folder $child -current_path $path -depth ($depth + 1) -results $results
  }
}

try {
  Write-Host 'Creating Outlook COM application...'
  $outlook = New-Object -ComObject Outlook.Application

  Write-Host 'Getting MAPI namespace...'
  $namespace = $outlook.GetNamespace('MAPI')

  Write-Host 'Reading default store...'
  $default_store = $namespace.DefaultStore
  $root_folder = $default_store.GetRootFolder()
  $inbox = $namespace.GetDefaultFolder(6)

  Write-Host ''
  Write-Host 'Outlook COM connection succeeded.' -ForegroundColor Green
  Write-Host "Default store: $($default_store.DisplayName)"
  Write-Host "Root folder: $($root_folder.Name)"
  Write-Host "Inbox folder: $($inbox.Name)"

  Write-Host ''
  Write-Host 'Listing first 10 inbox items...'
  $items = $inbox.Items
  $items.Sort('[ReceivedTime]', $true)
  $message_list = New-Object 'System.Collections.Generic.List[object]'
  $count = $items.Count
  for ($i = 1; $i -le $count -and $message_list.Count -lt 10; $i++) {
    $item = $items.Item($i)
    if ($null -eq $item) { continue }
    try {
      $message_list.Add((Convert-MailItem $item))
    } catch {
    }
  }

  Write-Host ''
  Write-Host 'Listing folders up to depth 3...'
  $folder_list = New-Object 'System.Collections.Generic.List[object]'
  Get-FolderTree -folder $root_folder -current_path '' -depth 0 -results $folder_list

  $report = @{
    ok = $true
    default_store = $default_store.DisplayName
    root_folder = $root_folder.Name
    inbox_folder = $inbox.Name
    inbox_count = $count
    sample_messages = $message_list
    sample_folders = @($folder_list | Select-Object -First 50)
  }

  Write-Host ''
  Write-Host 'JSON report:' -ForegroundColor Cyan
  $report | ConvertTo-Json -Depth 6
} catch {
  Write-Host ''
  Write-Host 'Outlook COM validation failed.' -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
