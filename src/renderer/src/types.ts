export type EmailMsg = {
  id: string
  threadId?: string
  snippet: string
  body?: string
  from: string
  subject: string
  date: string
  senderMatch: string
}

export type FolderOption = {
  name: string
  path: string
}

export type MarkedItem = {
  id: string
  from: string
  folderPath: string
}

export type CommandResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export type MoveResult = {
  id: string
  success: boolean
  error?: string
}

export type ViewMode = 'emails' | 'marked'
export type SortKey = 'date' | 'from' | 'subject'
