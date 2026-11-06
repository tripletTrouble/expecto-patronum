declare module 'sanitize-html' {
  export interface SanitizeHtmlOptions {
    allowedTags?: string[]
    allowedAttributes?: Record<string, string[]>
    allowedSchemes?: string[]
    allowProtocolRelative?: boolean
    disallowedTagsMode?: 'discard' | 'completelyDiscard' | 'escape' | 'recursiveEscape'
    textFilter?: (text: string, tagName: string) => string
  }

  export default function sanitizeHtml(html: string, options?: SanitizeHtmlOptions): string
}
