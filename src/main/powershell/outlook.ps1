param(
  [Parameter(Mandatory = $true)] [string]$Command,
  [string]$Payload = '{}'
)

$ErrorActionPreference = 'Stop'

function Write-Success($data) {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  @{ success = $true; data = $data } | ConvertTo-Json -Depth 8 -Compress
}

function Write-Failure($message) {
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
  @{ success = $false; error = $message } | ConvertTo-Json -Depth 8 -Compress
}

function Get-PayloadObject {
  if ([string]::IsNullOrWhiteSpace($Payload)) {
    return @{}
  }

  $parsed = $Payload | ConvertFrom-Json
  if ($null -eq $parsed) {
    return @{}
  }

  return $parsed
}

function Invoke-WithRetry([scriptblock]$action, [string]$context, [int]$attempt_count = 6, [int]$delay_ms = 250) {
  $last_error = $null

  for ($attempt_index = 0; $attempt_index -lt $attempt_count; $attempt_index++) {
    try {
      return & $action
    } catch {
      $last_error = $_
      $message = $_.Exception.Message
      if ($message -notmatch 'RPC_E_CALL_REJECTED' -and $message -notmatch 'Call was rejected by callee') {
        throw "${context}: $message"
      }
      Start-Sleep -Milliseconds $delay_ms
    }
  }

  throw "${context}: $($last_error.Exception.Message)"
}

function Require-Value([object]$value, [string]$context) {
  if ($null -eq $value) {
    throw "${context}: received null value"
  }
  return $value
}

function Get-OutlookNamespace {
  $outlook = Require-Value (Invoke-WithRetry -context 'Create Outlook.Application' -action {
    New-Object -ComObject Outlook.Application
  }) 'Create Outlook.Application'

  return Require-Value (Invoke-WithRetry -context 'Get Outlook MAPI namespace' -action {
    $outlook.GetNamespace('MAPI')
  }) 'Get Outlook MAPI namespace'
}

function Normalize-PathSegment([string]$value) {
  return $value.Trim() -replace '\\', '/'
}

function Get-CombinedSender([object]$item) {
  $parts = @()
  try {
    $sender_name = Invoke-WithRetry -context 'Read MailItem.SenderName' -action {
      if ($item.SenderName) { [string]$item.SenderName } else { '' }
    }
    if ($sender_name) { $parts += $sender_name }
  } catch {
  }

  try {
    $sender_email = Invoke-WithRetry -context 'Read MailItem.SenderEmailAddress' -action {
      if ($item.SenderEmailAddress) { [string]$item.SenderEmailAddress } else { '' }
    }
    if ($sender_email -and ($parts -notcontains $sender_email)) {
      $parts += $sender_email
    }
  } catch {
  }

  if ($parts.Count -eq 0) {
    return 'Unknown Sender'
  }

  if ($parts.Count -eq 1) {
    return $parts[0]
  }

  return "$($parts[0]) <$($parts[1])>"
}

function Get-FolderChildren([object]$folder, [string]$context) {
  return Invoke-WithRetry -context "$context -> Folder.Folders" -action {
    $folder.Folders
  }
}

function Get-FolderPath([object]$folder, [string]$currentPath, [int]$depth, [int]$depth_max, [int]$folder_count_max, [System.Collections.Generic.List[object]]$results) {
  if ($depth -gt $depth_max) { return }
  if ($folder_count_max -gt 0 -and $results.Count -ge $folder_count_max) { return }

  $children = Get-FolderChildren -folder $folder -context "Enumerate folders at '$currentPath'"
  if ($null -eq $children) { return }

  $count = Invoke-WithRetry -context "Enumerate folders at '$currentPath' -> Count" -action {
    [int]$children.Count
  }

  $item_index = 1
  while ($item_index -le $count) {
    if ($folder_count_max -gt 0 -and $results.Count -ge $folder_count_max) {
      break
    }
    try {
      $child = Invoke-WithRetry -context "Enumerate folders at '$currentPath' -> Item($item_index)" -action {
        $children.Item($item_index)
      }
      if ($null -eq $child) {
        $item_index++
        continue
      }

      $name = Invoke-WithRetry -context "Enumerate folders at '$currentPath' -> Child.Name" -action {
        [string]$child.Name
      }
      if ([string]::IsNullOrWhiteSpace($name)) {
        $item_index++
        continue
      }

      $path = if ([string]::IsNullOrWhiteSpace($currentPath)) { $name } else { "$currentPath/$name" }
      $results.Add(@{ name = $name; path = $path })
      Get-FolderPath -folder $child -currentPath $path -depth ($depth + 1) -depth_max $depth_max -folder_count_max $folder_count_max -results $results
    } catch {
    }

    $item_index++
  }
}

function Resolve-FolderByPath([object]$namespace, [string]$folderPath) {
  $default_store = Require-Value (Invoke-WithRetry -context 'Resolve target folder -> DefaultStore' -action {
    $namespace.DefaultStore
  }) 'Resolve target folder -> DefaultStore'

  $root = Require-Value (Invoke-WithRetry -context 'Resolve target folder -> RootFolder' -action {
    $default_store.GetRootFolder()
  }) 'Resolve target folder -> RootFolder'

  $current = $root
  $segments = (Normalize-PathSegment $folderPath).Split('/') | Where-Object { $_ -and $_.Trim() }
  if ($segments.Count -eq 0) {
    throw 'Resolve target folder: folder path is empty after normalization'
  }

  foreach ($segment in $segments) {
    $folders = Get-FolderChildren -folder $current -context "Resolve target folder -> segment '$segment'"
    if ($null -eq $folders) {
      throw "Resolve target folder -> segment '$segment': folder has no children"
    }
    $current = Invoke-WithRetry -context "Resolve target folder -> segment '$segment'" -action {
      $folders.Item($segment)
    }
    $current = Require-Value $current "Resolve target folder -> segment '$segment'"
  }

  return $current
}

function Get-InboxItems([object]$namespace) {
  $inbox = Require-Value (Invoke-WithRetry -context 'Get default Inbox folder' -action {
    $namespace.GetDefaultFolder(6)
  }) 'Get default Inbox folder'

  return Require-Value (Invoke-WithRetry -context 'Get Inbox items collection' -action {
    $inbox.Items
  }) 'Get Inbox items collection'
}

function Invoke-ListFolders {
  $payloadObject = Get-PayloadObject
  $depth_max = 1
  $folder_count_max = 50
  $top_level_only = $true
  if ($payloadObject.depthMax -or $payloadObject.depthMax -eq 0) {
    $depth_max = [int]$payloadObject.depthMax
  }
  if ($payloadObject.folderCountMax) {
    $folder_count_max = [int]$payloadObject.folderCountMax
  }
  if ($payloadObject.topLevelOnly -or $payloadObject.topLevelOnly -eq $false) {
    $top_level_only = [bool]$payloadObject.topLevelOnly
  }

  $namespace = Get-OutlookNamespace
  $default_store = Require-Value (Invoke-WithRetry -context 'List folders -> DefaultStore' -action {
    $namespace.DefaultStore
  }) 'List folders -> DefaultStore'

  $root = Require-Value (Invoke-WithRetry -context 'List folders -> RootFolder' -action {
    $default_store.GetRootFolder()
  }) 'List folders -> RootFolder'

  $results = New-Object 'System.Collections.Generic.List[object]'

  if ($top_level_only) {
    $children = Get-FolderChildren -folder $root -context 'List folders -> top level'
    if ($null -eq $children) {
      return $results
    }

    $count = Invoke-WithRetry -context 'List folders -> top level count' -action {
      [int]$children.Count
    }

    $item_index = 1
    while ($item_index -le $count) {
      if ($folder_count_max -gt 0 -and $results.Count -ge $folder_count_max) {
        break
      }

      try {
        $child = Invoke-WithRetry -context "List folders -> top level item($item_index)" -action {
          $children.Item($item_index)
        }
        if ($null -eq $child) {
          $item_index++
          continue
        }

        $name = Invoke-WithRetry -context "List folders -> top level child name($item_index)" -action {
          [string]$child.Name
        }
        if ([string]::IsNullOrWhiteSpace($name)) {
          $item_index++
          continue
        }

        $results.Add(@{ name = $name; path = $name })
      } catch {
      }

      $item_index++
    }

    return $results
  }

  Get-FolderPath -folder $root -currentPath '' -depth 0 -depth_max $depth_max -folder_count_max $folder_count_max -results $results
  return $results
}

function Invoke-ListInbox {
  $payloadObject = Get-PayloadObject
  $maxResults = 200
  if ($payloadObject.maxResults) {
    $maxResults = [int]$payloadObject.maxResults
  }

  $namespace = Get-OutlookNamespace
  $items = Get-InboxItems -namespace $namespace

  $results = New-Object 'System.Collections.Generic.List[object]'
  $count = Invoke-WithRetry -context 'Read Inbox items count' -action {
    [int]$items.Count
  }

  for ($i = 1; $i -le $count -and $results.Count -lt $maxResults; $i++) {
    $item = Invoke-WithRetry -context "Read Inbox item at index $i" -action {
      $items.Item($i)
    }
    if ($null -eq $item) { continue }

    try {
      $entry_id = Invoke-WithRetry -context "Read MailItem.EntryID at index $i" -action {
        [string]$item.EntryID
      }
      if ([string]::IsNullOrWhiteSpace($entry_id)) { continue }

      $subject = Invoke-WithRetry -context "Read MailItem.Subject at index $i" -action {
        if ($item.Subject) { [string]$item.Subject } else { '' }
      }

      $body = Invoke-WithRetry -context "Read MailItem.Body at index $i" -action {
        if ($item.Body) { [string]$item.Body } else { '' }
      }

      $snippet = (($body -replace '\s+', ' ').Trim())
      if ($snippet.Length -gt 240) {
        $snippet = $snippet.Substring(0, 240)
      }

      $sender_match = Get-CombinedSender $item
      $date = ''
      $received_time = Invoke-WithRetry -context "Read MailItem.ReceivedTime at index $i" -action {
        $item.ReceivedTime
      }
      if ($received_time) {
        $date = ([datetime]$received_time).ToString('o')
      }

      $results.Add(@{
        id = $entry_id
        threadId = $entry_id
        snippet = $snippet
        from = $sender_match
        subject = $subject
        date = $date
        senderMatch = $sender_match
      })
    } catch {
      continue
    }
  }

  return $results
}

function Invoke-MoveMessages {
  $payloadObject = Get-PayloadObject
  $ids = @($payloadObject.ids)
  $folderPath = [string]$payloadObject.folderPath
  $namespace = Get-OutlookNamespace
  $targetFolder = Resolve-FolderByPath -namespace $namespace -folderPath $folderPath

  $results = New-Object 'System.Collections.Generic.List[object]'
  foreach ($id in $ids) {
    try {
      $item = Require-Value (Invoke-WithRetry -context "Resolve MailItem by EntryID '$id'" -action {
        $namespace.GetItemFromID([string]$id)
      }) "Resolve MailItem by EntryID '$id'"

      Invoke-WithRetry -context "Move MailItem '$id' to '$folderPath'" -action {
        $item.Move($targetFolder)
      } | Out-Null

      $results.Add(@{ id = [string]$id; success = $true })
    } catch {
      $results.Add(@{ id = [string]$id; success = $false; error = $_.Exception.Message })
    }
  }

  return $results
}

try {
  switch ($Command) {
    'ListFolders' { Write-Output (Write-Success (Invoke-ListFolders)); break }
    'ListInbox' { Write-Output (Write-Success (Invoke-ListInbox)); break }
    'MoveMessages' { Write-Output (Write-Success (Invoke-MoveMessages)); break }
    default { Write-Output (Write-Failure "Unknown command: $Command"); break }
  }
} catch {
  Write-Output (Write-Failure $_.Exception.Message)
}
