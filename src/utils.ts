export function toJson(str: string) {
  const hasJsonBlock = /^\s*```json\s*/.test(str)
  str = str.replace(/^\s*```json\s*/, '')
  str = hasJsonBlock
    ? str.split(/\s*```\s*/).shift() || '{}'
    : str
  try {
    return JSON.parse(str)
  }
  catch {
    return {}
  }
}

export function paragraphText(text: string) {
  return `<p>${text.split('\n').join('</p>\n<p>')}</p>`
}

export function autoScroll() {
  window.scrollTo({
    top: document.body.clientHeight,
    behavior: 'smooth'
  })
}

