import './style.css'
import { chat } from './chat.ts'

const entry = document.querySelector<HTMLDivElement>('#app')

if (entry) entry.appendChild(chat())
