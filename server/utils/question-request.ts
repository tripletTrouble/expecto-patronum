import { getHeader, readRawBody } from 'h3'
import type { H3Event } from 'h3'

export const QUESTION_REQUEST_MAX_BYTES = 256 * 1024

export async function readQuestionBody(event: H3Event) {
  const contentLength = getHeader(event, 'content-length')
  if (contentLength !== undefined) {
    const byteLength = Number(contentLength)
    if (!Number.isSafeInteger(byteLength) || byteLength < 0) {
      throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Ukuran data soal tidak valid' })
    }
    if (byteLength > QUESTION_REQUEST_MAX_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Payload Too Large', message: 'Data soal terlalu besar' })
    }
  }

  const rawBody = await readRawBody(event, false)
  if (!rawBody || rawBody.length > QUESTION_REQUEST_MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Payload Too Large', message: 'Data soal terlalu besar' })
  }

  try {
    return JSON.parse(rawBody.toString('utf8')) as unknown
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Data soal tidak valid' })
  }
}
