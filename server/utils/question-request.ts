import { getHeader, getRequestWebStream } from 'h3'
import type { H3Event } from 'h3'

export const QUESTION_REQUEST_MAX_BYTES = 256 * 1024

async function readLimitedBody(event: H3Event) {
  const stream = getRequestWebStream(event)
  if (!stream) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Data soal tidak tersedia' })
  }

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const result = await reader.read()
      if (result.done) break

      totalBytes += result.value.byteLength
      if (totalBytes > QUESTION_REQUEST_MAX_BYTES) {
        await reader.cancel()
        throw createError({ statusCode: 413, statusMessage: 'Payload Too Large', message: 'Data soal terlalu besar' })
      }
      chunks.push(result.value)
    }
  }
  finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

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

  const rawBody = await readLimitedBody(event)

  try {
    return JSON.parse(new TextDecoder().decode(rawBody)) as unknown
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Data soal tidak valid' })
  }
}
