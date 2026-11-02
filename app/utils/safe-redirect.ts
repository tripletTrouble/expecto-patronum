export function safeRedirect(value: unknown) {
  const hasUnsafeCharacter = typeof value === 'string'
    && [...value].some(character => character === '\\' || character.charCodeAt(0) < 0x20 || character.charCodeAt(0) === 0x7F)

  if (
    typeof value !== 'string'
    || !value.startsWith('/')
    || value.startsWith('//')
    || hasUnsafeCharacter
  ) return '/'

  return value
}
