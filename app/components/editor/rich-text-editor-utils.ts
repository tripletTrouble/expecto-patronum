import sanitizeHtml from 'sanitize-html'

import {
  BODY_ALLOWED_TAGS,
  INLINE_ALLOWED_TAGS,
  sanitizer,
} from '../../../shared/question-validation'

export function sanitizeEditorContent(html: string, mode: 'body' | 'option') {
  if (mode === 'body') return sanitizer.body(html)
  return sanitizer.option(sanitizePastedContent(html, mode))
}

export function sanitizePastedContent(html: string, mode: 'body' | 'option') {
  const allowedTags = mode === 'body' ? BODY_ALLOWED_TAGS : INLINE_ALLOWED_TAGS
  const sanitized = sanitizeHtml(html, {
    allowedTags: [...allowedTags],
    allowedAttributes: {},
    allowedSchemes: [],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  })

  if (mode === 'option') {
    return stripBlockElements(sanitized)
  }

  return sanitized
}

function stripBlockElements(html: string) {
  return html.replace(/<\/?(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|section|article|header|footer)[^>]*>/gi, '')
}
