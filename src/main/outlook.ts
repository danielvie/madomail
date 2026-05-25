import { ipcMain } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { loadMarkedItems, saveMarkedItems } from './marked-items'
import { loadRecentFolders, mergeRecentFolders } from './recent-folders'

type EmailMsg = {
  id: string
  threadId?: string
  snippet: string
  from: string
  subject: string
  date: string
  senderMatch: string
}

type FolderOption = {
  name: string
  path: string
}

type MoveResult = {
  id: string
  success: boolean
  error?: string
}

type ScriptSuccess<T> = {
  request_id?: string
  success: true
  data: T
}

type ScriptFailure = {
  request_id?: string
  success: false
  error: string
}

type ScriptResult<T> = ScriptSuccess<T> | ScriptFailure

type HelperRequest =
  | { request_id: string; command: 'list_inbox'; max_results?: number }
  | {
      request_id: string
      command: 'list_folders'
      depth_max?: number
      folder_count_max?: number
      top_level_only?: boolean
    }
  | { request_id: string; command: 'move_messages'; ids: string[]; folder_path: string }

let folderCache: FolderOption[] = []
let helperProcess: ChildProcessWithoutNullStreams | null = null
let requestCount = 0
const pendingRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }
>()
let stdoutBuffer = ''

function ensureWindows() {
  if (process.platform !== 'win32') {
    throw new Error('Outlook integration is only available on Windows.')
  }
}

function resolveHelperPath() {
  const candidatePaths = [
    join(process.cwd(), 'helper_com_rs', 'target', 'debug', 'helper_com_rs.exe'),
    join(process.cwd(), 'helper_com_rs', 'target', 'release', 'helper_com_rs.exe')
  ]

  for (const candidatePath of candidatePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath
    }
  }

  throw new Error(
    `helper_com_rs executable not found. Build it first. Checked: ${candidatePaths.join(', ')}`
  )
}

function helperStop(errorMessage: string) {
  for (const { reject } of pendingRequests.values()) {
    reject(new Error(errorMessage))
  }
  pendingRequests.clear()
  stdoutBuffer = ''
  helperProcess = null
}

function helperEnsureStarted() {
  if (helperProcess) return helperProcess

  const helperPath = resolveHelperPath()
  helperProcess = spawn(helperPath, [], { windowsHide: true })

  helperProcess.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString()

    let newlineIndex = stdoutBuffer.indexOf('\n')
    while (newlineIndex !== -1) {
      const line = stdoutBuffer.slice(0, newlineIndex).trim()
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1)

      if (line) {
        try {
          const message = JSON.parse(line) as ScriptResult<unknown>
          const requestId = message.request_id
          if (requestId && pendingRequests.has(requestId)) {
            const pending = pendingRequests.get(requestId)
            pendingRequests.delete(requestId)
            if (!pending) continue
            if (message.success) {
              pending.resolve(message.data)
            } else {
              pending.reject(new Error(message.error))
            }
          }
        } catch (error) {
          console.error('Failed to parse helper_com_rs output', error, line)
        }
      }

      newlineIndex = stdoutBuffer.indexOf('\n')
    }
  })

  helperProcess.stderr.on('data', (chunk) => {
    console.error(chunk.toString())
  })

  helperProcess.on('error', (error) => {
    helperStop(`helper_com_rs failed to start: ${error.message}`)
  })

  helperProcess.on('close', (code) => {
    helperStop(`helper_com_rs exited unexpectedly with code ${code ?? 'unknown'}`)
  })

  return helperProcess
}

function runHelperCommand<T>(request: Omit<HelperRequest, 'request_id'>): Promise<T> {
  ensureWindows()
  const process = helperEnsureStarted()
  const requestId = `req_${++requestCount}`
  const message = { ...request, request_id: requestId }

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, {
      resolve: (value) => resolve(value as T),
      reject
    })

    process.stdin.write(`${JSON.stringify(message)}\n`, (error) => {
      if (error) {
        pendingRequests.delete(requestId)
        reject(error)
      }
    })
  })
}

async function listFolders(forceRefresh = false) {
  if (folderCache.length > 0 && !forceRefresh) return folderCache
  const folders = await runHelperCommand<FolderOption[]>({
    command: 'list_folders',
    top_level_only: true,
    depth_max: 1,
    folder_count_max: 50
  })
  folderCache = folders
  return folders
}

async function fetchInbox() {
  return runHelperCommand<EmailMsg[]>({ command: 'list_inbox', max_results: 200 })
}

async function moveMessages(ids: string[], folderPath: string) {
  return runHelperCommand<MoveResult[]>({
    command: 'move_messages',
    ids,
    folder_path: folderPath
  })
}

export function setupMailIPC() {
  ipcMain.handle('mail-fetch-inbox', async () => {
    try {
      const data = await fetchInbox()
      return { success: true, data }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('mail-list-folders', async (_, forceRefresh = false) => {
    try {
      const data = await listFolders(Boolean(forceRefresh))
      return { success: true, data }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('mail-get-recent-folders', async () => {
    try {
      const liveFolders = await listFolders()
      const liveFolderSet = new Set(liveFolders.map((folder) => folder.path.toLowerCase()))
      const data = loadRecentFolders().filter((folderPath) =>
        liveFolderSet.has(folderPath.toLowerCase())
      )
      return { success: true, data }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('mail-get-marked-items', async () => {
    try {
      const data = loadMarkedItems()
      return { success: true, data }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('mail-save-marked-items', async (_, items: unknown[]) => {
    try {
      const data = saveMarkedItems(items as { id: string; from: string; folderPath: string }[])
      return { success: true, data }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('mail-move', async (_, ids: string[], folderPath: string) => {
    try {
      const results = await moveMessages(ids, folderPath)
      const recentFolders = loadRecentFolders()
      const movedAny = results.some((result) => result.success)
      if (movedAny) {
        mergeRecentFolders(recentFolders, folderPath)
      }
      return { success: true, data: results }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })
}
