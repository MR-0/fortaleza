export function toJson(str: string) {
  console.log('json inital ->', str)
  str = str.replace(/^\s*```json\s*/, '')
  str = str.replace(/$\s*```\s*/, '')
  console.log('json final ->', str)
  try {
    return JSON.parse(str)
  }
  catch {
    return {}
  }
}

