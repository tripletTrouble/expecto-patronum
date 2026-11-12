import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QUESTION_REQUEST_MAX_BYTES, readQuestionBody } from '../../server/utils/question-request'

const { getHeader, readRawBody } = vi.hoisted(() => ({ getHeader: vi.fn(), readRawBody: vi.fn() }))

vi.mock('h3', () => ({ getHeader, readRawBody }))

describe('question request body limits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('createError', (options: { statusCode: number, statusMessage: string, message: string }) =>
      Object.assign(new Error(options.message), options))
  })

  it('rejects a request larger than the configured limit before parsing', async () => {
    getHeader.mockReturnValue(String(QUESTION_REQUEST_MAX_BYTES + 1))

    await expect(readQuestionBody({} as Parameters<typeof readQuestionBody>[0])).rejects.toMatchObject({ statusCode: 413 })
    expect(readRawBody).not.toHaveBeenCalled()
  })

  it('rejects malformed content lengths', async () => {
    getHeader.mockReturnValue('not-a-number')

    await expect(readQuestionBody({} as Parameters<typeof readQuestionBody>[0])).rejects.toMatchObject({ statusCode: 400 })
    expect(readRawBody).not.toHaveBeenCalled()
  })

  it('reads a body within the limit', async () => {
    getHeader.mockReturnValue(String(QUESTION_REQUEST_MAX_BYTES))
    readRawBody.mockResolvedValue(Buffer.from('{"type":"SINGLE"}'))

    await expect(readQuestionBody({} as Parameters<typeof readQuestionBody>[0])).resolves.toEqual({ type: 'SINGLE' })
    expect(readRawBody).toHaveBeenCalledOnce()
  })
})
