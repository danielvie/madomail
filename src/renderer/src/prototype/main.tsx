// PROTOTYPE — throwaway entry point. Runs in a plain browser via `npm run prototype`.
import { createRoot } from 'react-dom/client'
import '../assets/main.css'
import Shell from './Shell'
const root = createRoot(document.getElementById('app')!)
root.render(<Shell />)
export default root
