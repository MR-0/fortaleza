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

