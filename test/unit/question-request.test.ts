import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QUESTION_REQUEST_MAX_BYTES, readQuestionBody } from '../../server/utils/question-request'

const { getHeader, getRequestWebStream } = vi.hoisted(() => ({ getHeader: vi.fn(), getRequestWebStream: vi.fn() }))

vi.mock('h3', () => ({ getHeader, getRequestWebStream }))

function streamFrom(chunks: Uint8Array[]) {
  let index = 0
  const reader = {
    read: vi.fn(async () => index < chunks.length
      ? { done: false, value: chunks[index++] }
      : { done: true, value: undefined }),
    cancel: vi.fn(),
    releaseLock: vi.fn(),
  }
  return { getReader: () => reader, reader }
}

describe('question request body limits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('createError', (options: { statusCode: number, statusMessage: string, message: string }) =>
      Object.assign(new Error(options.message), options))
  })

  it('rejects a request larger than the configured limit before parsing', async () => {
    getHeader.mockReturnValue(String(QUESTION_REQUEST_MAX_BYTES + 1))

    await expect(readQuestionBody({} as Parameters<typeof readQuestionBody>[0])).rejects.toMatchObject({ statusCode: 413 })
    expect(getRequestWebStream).not.toHaveBeenCalled()
  })

  it('rejects malformed content lengths', async () => {
    getHeader.mockReturnValue('not-a-number')

    await expect(readQuestionBody({} as Parameters<typeof readQuestionBody>[0])).rejects.toMatchObject({ statusCode: 400 })
    expect(getRequestWebStream).not.toHaveBeenCalled()
  })

  it('reads a body within the limit', async () => {
    getHeader.mockReturnValue(String(QUESTION_REQUEST_MAX_BYTES))
    const stream = streamFrom([new TextEncoder().encode('{"type":"SINGLE"}')])
    getRequestWebStream.mockReturnValue(stream)

    await expect(readQuestionBody({} as Parameters<typeof readQuestionBody>[0])).resolves.toEqual({ type: 'SINGLE' })
    expect(stream.reader.read).toHaveBeenCalledTimes(2)
  })

  it('rejects an oversized chunked body while reading it', async () => {
    const stream = streamFrom([
      new Uint8Array(QUESTION_REQUEST_MAX_BYTES),
      new Uint8Array(1),
    ])
    getRequestWebStream.mockReturnValue(stream)

    await expect(readQuestionBody({} as Parameters<typeof readQuestionBody>[0])).rejects.toMatchObject({ statusCode: 413 })
    expect(stream.reader.cancel).toHaveBeenCalledOnce()
  })
})
