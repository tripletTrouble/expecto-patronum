import sanitizeHtml, { type SanitizeHtmlOptions } from 'sanitize-html'
import { z } from 'zod'

export const QUESTION_BODY_MAX_LENGTH = 50_000
export const QUESTION_OPTION_MAX_LENGTH = 10_000

const BODY_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'sub',
  'sup',
  'ul',
  'ol',
  'li',
] as const

const INLINE_ALLOWED_TAGS = ['strong', 'b', 'em', 'i', 'u', 'sub', 'sup'] as const

const baseSanitizerOptions: SanitizeHtmlOptions = {
  allowedAttributes: {},
  allowedSchemes: [],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
}

export type SanitizerTarget = 'body' | 'option'

export interface SanitizerConfig {
  bodyAllowedTags?: readonly string[]
  optionAllowedTags?: readonly string[]
}

export function createSanitizer(config: SanitizerConfig = {}) {
  const bodyAllowedTags = [...(config.bodyAllowedTags ?? BODY_ALLOWED_TAGS)]
  const optionAllowedTags = [...(config.optionAllowedTags ?? INLINE_ALLOWED_TAGS)]

  return {
    body: (html: string) => sanitizeHtml(html, { ...baseSanitizerOptions, allowedTags: bodyAllowedTags }),
    option: (html: string) => sanitizeHtml(html, { ...baseSanitizerOptions, allowedTags: optionAllowedTags }),
  }
}

export const sanitizer = createSanitizer()

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, '\'')
}

export function toPlainText(html: string) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function hasText(html: string) {
  return toPlainText(html).length > 0
}

const richText = z.string().max(QUESTION_BODY_MAX_LENGTH, 'Teks soal terlalu panjang')
const optionText = z.string().max(QUESTION_OPTION_MAX_LENGTH, 'Teks opsi terlalu panjang')
const nonEmptyRichText = richText.refine(hasText, 'Isi soal wajib diisi')
const nonEmptyOptionText = optionText.refine(hasText, 'Teks opsi wajib diisi')

const commonQuestionFields = {
  categoryId: z.string().cuid('Kategori tidak valid'),
  explanation: z.string().max(QUESTION_BODY_MAX_LENGTH, 'Penjelasan terlalu panjang').refine(value => !/<[^>]+>/.test(value), 'Penjelasan harus berupa teks biasa').optional(),
} as const

const singleSchema = z.object({
  ...commonQuestionFields,
  type: z.literal('SINGLE'),
  body: nonEmptyRichText,
  options: z.array(z.object({ text: nonEmptyOptionText, isCorrect: z.boolean() }).strict())
    .min(2, 'Soal pilihan tunggal harus memiliki minimal 2 opsi')
    .superRefine((options, context) => {
      if (options.filter(option => option.isCorrect).length !== 1) {
        context.addIssue({ code: 'custom', message: 'Soal pilihan tunggal harus memiliki tepat 1 jawaban benar' })
      }
    }),
}).strict()

const multipleSchema = z.object({
  ...commonQuestionFields,
  type: z.literal('MULTIPLE'),
  body: nonEmptyRichText,
  options: z.array(z.object({ text: nonEmptyOptionText, isCorrect: z.boolean() }).strict())
    .min(2, 'Soal pilihan ganda harus memiliki minimal 2 opsi')
    .superRefine((options, context) => {
      if (!options.some(option => option.isCorrect)) {
        context.addIssue({ code: 'custom', message: 'Soal pilihan ganda harus memiliki minimal 1 jawaban benar' })
      }
    }),
}).strict()

const trueFalseSchema = z.object({
  ...commonQuestionFields,
  type: z.literal('TRUE_FALSE'),
  body: nonEmptyRichText,
  options: z.array(z.object({ text: nonEmptyOptionText, isCorrect: z.boolean() }).strict())
    .min(1, 'Soal benar atau salah harus memiliki minimal 1 pernyataan')
    .superRefine((options, context) => {
      const normalized = options.map(option => toPlainText(option.text).toLocaleLowerCase())
      if (new Set(normalized).size !== normalized.length) {
        context.addIssue({ code: 'custom', message: 'Pernyataan benar atau salah tidak boleh duplikat' })
      }
    }),
}).strict()

const matchingSchema = z.object({
  ...commonQuestionFields,
  type: z.literal('MATCHING'),
  body: nonEmptyRichText,
  options: z.array(z.object({
    text: nonEmptyOptionText,
    side: z.enum(['LEFT', 'RIGHT'], { error: 'Sisi pasangan tidak valid' }),
    matchKey: z.string().trim().min(1, 'Pasangan wajib diisi'),
    isCorrect: z.boolean().optional(),
  }).strict())
    .min(4, 'Soal mencocokkan harus memiliki minimal 2 pasangan')
    .superRefine((options, context) => {
      const left = options.filter(option => option.side === 'LEFT')
      const right = options.filter(option => option.side === 'RIGHT')
      if (left.length < 2 || right.length < 2) {
        context.addIssue({ code: 'custom', message: 'Soal mencocokkan harus memiliki minimal 2 pasangan' })
      }
      if (left.some(option => !right.some(candidate => candidate.matchKey === option.matchKey))) {
        context.addIssue({ code: 'custom', message: 'Setiap item kiri harus memiliki pasangan kanan' })
      }
      const leftKeys = left.map(option => option.matchKey)
      const rightKeys = right.map(option => option.matchKey)
      if (new Set(leftKeys).size !== left.length || new Set(rightKeys).size !== right.length || left.length !== right.length) {
        context.addIssue({ code: 'custom', message: 'Setiap item harus memiliki tepat satu pasangan' })
      }
    }),
}).strict()

export const questionSchema = z.discriminatedUnion('type', [singleSchema, multipleSchema, trueFalseSchema, matchingSchema])

export type QuestionInput = z.infer<typeof questionSchema>

export function sanitizeQuestion(input: QuestionInput, config: SanitizerConfig = {}) {
  const configuredSanitizer = createSanitizer(config)
  const body = configuredSanitizer.body(input.body)
  const explanation = input.explanation === undefined ? undefined : toPlainText(input.explanation) ? configuredSanitizer.body(input.explanation) : ''
  const options = input.options.map(option => ({
    ...option,
    text: configuredSanitizer.option(option.text),
  }))

  return {
    ...input,
    body,
    bodyText: toPlainText(body),
    ...(explanation === undefined ? {} : { explanation }),
    options,
  }
}
