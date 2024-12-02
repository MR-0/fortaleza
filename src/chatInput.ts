import { VirtualNode } from "./vnode";
import style from './chatInput.module.css'
import flourishSvg from '../assets/flourish.svg?raw'

export class ChatInput extends VirtualNode {
  private _input

  constructor() {
    super('form')
    this.class(style.form)

    this.add('p')
      .class(style.question)
      .content('What do you want to do?')

    this.add('div')
      .class(style.flourish)
      .class(style.flourishTop)
      .content(flourishSvg)

    this._input = this.add('div')
      .class(style.inputWrapper)
      .add<HTMLTextAreaElement>('textarea')
      .class(style.input)
      .attrs({ type: 'text' })

    this.add('div')
      .class(style.flourish)
      .class(style.flourishBottom)
      .content(flourishSvg)

  }

  submit(handler: (prompt: string) => Promise<void>) {
    this.on('submit', (e) => {
      e.preventDefault()
      const { value: prompt } = this._input.dom
      this._input.dom.value = ''
      if (prompt) handler(prompt)
    })

    this._input.on('keydown', (e) => {
      const ke = e as KeyboardEvent
      if (ke.key === 'Enter' && !ke.shiftKey) {
        e.preventDefault()
        const { value: prompt } = this._input.dom
        this._input.dom.value = ''
        if (prompt) handler(prompt)
      }
    })

  }
}
