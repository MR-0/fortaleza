export class VirtualNode {
  private _dom

  constructor(tag: string) {
    this._dom = document.createElement(tag)
  }

  get dom() {
    return this._dom
  }

  content(html: string) {
    // TODO: make safe and keep the tree,
    // parsing and creating tokens from text
    this._dom.innerHTML = html
    return this
  }

  attrs(attrs: { [key: string]: any }) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (typeof value === 'string') {
        if (key === 'class') this.class(value)
        else this._dom.setAttribute(key, value)
      }
      if (typeof value === 'function') this.on(key, value)
      if (value === null || value === undefined) this._dom.removeAttribute(key)
    })
    return this
  }

  on(event: string, handler: (e: Event) => void) {
    this._dom.addEventListener(event, handler)
    return this
  }

  class(cls: string, toggle: boolean = true) {
    cls.split(/\s+/).forEach((part) => {
      this._dom.classList.toggle(part, !!toggle)
    })
    return this
  }

  add(tag: string) {
    const node = new VirtualNode(tag)
    this._dom.appendChild(node.dom)
    return node
  }
}

export function n(tag: string): VirtualNode {
  return new VirtualNode(tag)
}