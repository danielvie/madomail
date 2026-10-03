import { ElectronAPI } from '@electron-toolkit/preload'
import type { SettingsAPI } from '../shared/settings'

declare global {
  interface Window {
    electron: ElectronAPI
    api: { settings: SettingsAPI }
  }
}
