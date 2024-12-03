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

export function unique(arr: any[]) {
  return arr.filter((d, i) => arr.indexOf(d) === i)
}

export function randomPick(arr: any[]) {
  const i = Math.round((arr.length - 1) * Math.random())
  return arr[i]
}
