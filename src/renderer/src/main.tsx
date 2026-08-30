import { createRoot } from 'react-dom/client'
import './assets/main.css'
import App from './App'

const root = createRoot(document.getElementById('app')!)
root.render(<App />)
export default root
