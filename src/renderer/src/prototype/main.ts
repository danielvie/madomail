// PROTOTYPE — throwaway entry point. Runs in a plain browser via `pnpm prototype`.
import { mount } from 'svelte'
import '../assets/main.css'
import Shell from './Shell.svelte'

export default mount(Shell, { target: document.getElementById('app')! })
