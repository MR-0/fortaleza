import { VirtualNode } from "./vnode";
import style from './chatInput.module.css'

export class ChatInput extends VirtualNode {
  private _input

  constructor() {
    super('form')
    this.class(style.form)

    this.add('p')
      .content('What do you want to do?')

    this._input = this.add<HTMLInputElement>('input')
      .attrs({ type: 'text' })
  }

  submit(handler: (prompt: string) => Promise<void>) {
    this.on('submit', (e) => {
      e.preventDefault()
      const { value: prompt } = this._input.dom
      this._input.dom.value = ''
      if (prompt) handler(prompt)
    })

  }
}
