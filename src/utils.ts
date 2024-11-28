export function toJson(str: string) {
  console.log('json inital ->', str)
  const hasJsonBlock = /^\s*```json\s*/.test(str)
  str = str.replace(/^\s*```json\s*/, '')
  str = hasJsonBlock
    ? str.split(/\s*```\s*/).shift() || '{}'
    : str
  console.log('json final ->', str)
  try {
    return JSON.parse(str)
  }
  catch {
    return {}
  }
}

