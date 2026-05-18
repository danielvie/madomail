import { ipcMain } from 'electron'
import { google } from 'googleapis'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

let authClient: any = null

const MADO_PATH = join(homedir(), '.mado', 'mado_mail')
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

function getPaths() {
  return [process.cwd(), join(process.cwd(), '..'), MADO_PATH]
}

function findCredentials() {
  let secretPath = ''
  let tokenPath = ''
  
  for (const p of getPaths()) {
    const s = join(p, 'client_secret.json')
    const t = join(p, 'token.json')
    if (existsSync(s)) secretPath = s
    if (existsSync(t)) tokenPath = t
    if (secretPath && tokenPath) break
  }
  
  return { secretPath, tokenPath }
}

function getAuthClient() {
  if (authClient) return authClient

  const { secretPath, tokenPath } = findCredentials()

  if (!secretPath) {
    const errorMsg = `
🔑 GMAIL AUTHENTICATION REQUIRED

'client_secret.json' could not be found.

How to fix this:
1. Obtain 'client_secret.json' from Google Cloud Console:
   https://console.cloud.google.com/apis/credentials

2. Save it to the following directory:
   📂 ${MADO_PATH}
    `.trim();
    throw new Error(errorMsg)
  }

  const secretContent = readFileSync(secretPath, 'utf8')
  const credentials = JSON.parse(secretContent)
  const { client_secret, client_id } = credentials.installed || credentials.web
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'urn:ietf:wg:oauth:2.0:oob')

  if (!tokenPath) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    })
    
    const errorMsg = `
🎫 TOKEN REQUIRED

'client_secret.json' was found, but you are not authenticated yet.

How to fix this:
1. Open this URL in your browser:
   ${authUrl}

2. Follow the instructions and copy the authorization code from the page.
3. Paste that code into the 'AUTHORIZE' box below.
    `.trim();
    throw new Error(errorMsg)
  }

  const tokenContent = readFileSync(tokenPath, 'utf8')
  const token = JSON.parse(tokenContent)
  oAuth2Client.setCredentials(token)
  
  authClient = oAuth2Client
  return authClient
}

function decodeBase64Url(data?: string | null) {
  if (!data) return ''

  const normalized = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized, 'base64').toString('utf8')
}

function extractPlainTextBody(payload: any): string {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain') {
    return decodeBase64Url(payload.body?.data)
  }

  for (const part of payload.parts || []) {
    const body = extractPlainTextBody(part)
    if (body) return body
  }

  if (payload.mimeType === 'text/html') {
    return decodeBase64Url(payload.body?.data)
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return ''
}

export function setupGmailIPC() {
  ipcMain.handle('gmail-fetch-inbox', async () => {
    try {
      const auth = getAuthClient()
      const gmail = google.gmail({ version: 'v1', auth })
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'label:INBOX',
        maxResults: 400
      })

      const messages = res.data.messages || []
      const detailedMessages = await Promise.all(
        messages.map(async (msg) => {
          const m = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
            metadataHeaders: ['From', 'Subject', 'Date']
          })
          
          let from = '', subject = '', date = ''
          const headers = m.data.payload?.headers || []
          for (const header of headers) {
            if (header.name === 'From') from = header.value || ''
            if (header.name === 'Subject') subject = header.value || ''
            if (header.name === 'Date') date = header.value || ''
          }
          
          return {
            id: m.data.id,
            threadId: m.data.threadId,
            snippet: m.data.snippet,
            body: extractPlainTextBody(m.data.payload) || m.data.snippet,
            from,
            subject,
            date
          }
        })
      )
      
      return { success: true, data: detailedMessages }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('gmail-archive', async (_, ids: string[]) => {
    try {
      const auth = getAuthClient()
      const gmail = google.gmail({ version: 'v1', auth })
      
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids,
          removeLabelIds: ['INBOX', 'UNREAD']
        }
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('gmail-trash', async (_, ids: string[]) => {
    try {
      const auth = getAuthClient()
      const gmail = google.gmail({ version: 'v1', auth })
      
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids,
          addLabelIds: ['TRASH'],
          removeLabelIds: ['INBOX', 'UNREAD']
        }
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('gmail-submit-code', async (_, code: string) => {
    try {
      const { secretPath } = findCredentials()
      if (!secretPath) throw new Error('client_secret.json missing')
      
      const secretContent = readFileSync(secretPath, 'utf8')
      const credentials = JSON.parse(secretContent)
      const { client_secret, client_id } = credentials.installed || credentials.web
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'urn:ietf:wg:oauth:2.0:oob')
      
      const { tokens } = await oAuth2Client.getToken(code)
      
      if (!existsSync(MADO_PATH)) {
        mkdirSync(MADO_PATH, { recursive: true })
      }
      
      const tokenPath = join(MADO_PATH, 'token.json')
      const { writeFileSync } = await import('fs')
      writeFileSync(tokenPath, JSON.stringify(tokens))
      
      oAuth2Client.setCredentials(tokens)
      authClient = oAuth2Client
      
      return { success: true }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: error.message }
    }
  })
}
