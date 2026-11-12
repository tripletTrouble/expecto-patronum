import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { TeacherQuestionError } from '../../server/utils/teacher-questions'

const {
  getQuery,
  getRouterParam,
  requireRole,
  readQuestionBody,
  listTeacherQuestions,
  createTeacherQuestion,
  getTeacherQuestion,
  updateTeacherQuestion,
  deleteTeacherQuestion,
} = vi.hoisted(() => ({
  getQuery: vi.fn(),
  getRouterParam: vi.fn(),
  requireRole: vi.fn(),
  readQuestionBody: vi.fn(),
  listTeacherQuestions: vi.fn(),
  createTeacherQuestion: vi.fn(),
  getTeacherQuestion: vi.fn(),
  updateTeacherQuestion: vi.fn(),
  deleteTeacherQuestion: vi.fn(),
}))

vi.mock('h3', () => ({ getQuery, getRouterParam }))
vi.mock('../../server/utils/require-role', () => ({ requireRole }))
vi.mock('../../server/utils/question-request', () => ({ readQuestionBody }))
vi.mock('../../server/utils/teacher-questions', async () => {
  const actual = await vi.importActual<typeof import('../../server/utils/teacher-questions')>('../../server/utils/teacher-questions')
  return {
    ...actual,
    listTeacherQuestions,
    createTeacherQuestion,
    getTeacherQuestion,
    updateTeacherQuestion,
    deleteTeacherQuestion,
  }
})
vi.mock('../../server/utils/question-validation', () => ({ QuestionValidationError: class extends Error {} }))

const questionId = 'ckz5h0p8x0000s0m4b3q7r2k1'

describe('teacher question endpoints', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (error: unknown) => error)
    getQuery.mockReturnValue({})
    getRouterParam.mockReturnValue(questionId)
    requireRole.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER', status: 'APPROVED' })
    readQuestionBody.mockResolvedValue({ type: 'SINGLE' })
  })

  it.each([
    ['anonymous', { statusCode: 401 }],
    ['student', { statusCode: 403 }],
  ])('does not list questions for a %s request', async (_actor, error) => {
    requireRole.mockRejectedValue(error)
    const handler = (await import('../../server/api/teacher/questions/index.get')).default

    await expect(handler({} as never)).rejects.toMatchObject(error)
    expect(listTeacherQuestions).not.toHaveBeenCalled()
  })

  it('passes the authenticated teacher to list and item handlers', async () => {
    listTeacherQuestions.mockResolvedValue({ data: [], pagination: {} })
    getTeacherQuestion.mockResolvedValue({ id: questionId, options: [{ isCorrect: true, matchKey: '1' }] })
    const listHandler = (await import('../../server/api/teacher/questions/index.get')).default
    const itemHandler = (await import('../../server/api/teacher/questions/[id].get')).default

    await listHandler({} as never)
    await itemHandler({} as never)

    expect(listTeacherQuestions).toHaveBeenCalledWith('teacher-1', expect.any(Object))
    expect(getTeacherQuestion).toHaveBeenCalledWith('teacher-1', questionId)
  })

  it('returns 400 for a validated create failure', async () => {
    createTeacherQuestion.mockRejectedValue(new z.ZodError([]))
    const handler = (await import('../../server/api/teacher/questions/index.post')).default

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('does not update or delete an item when the utility reports it is not owned', async () => {
    updateTeacherQuestion.mockRejectedValue(new TeacherQuestionError('NOT_FOUND', 'Soal tidak ditemukan'))
    deleteTeacherQuestion.mockRejectedValue(new TeacherQuestionError('NOT_FOUND', 'Soal tidak ditemukan'))
    const updateHandler = (await import('../../server/api/teacher/questions/[id].patch')).default
    const deleteHandler = (await import('../../server/api/teacher/questions/[id].delete')).default

    await expect(updateHandler({} as never)).rejects.toMatchObject({ statusCode: 404 })
    await expect(deleteHandler({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('rejects an invalid question ID before calling the utility', async () => {
    getRouterParam.mockReturnValue('not-a-cuid')
    const handler = (await import('../../server/api/teacher/questions/[id].delete')).default

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
    expect(deleteTeacherQuestion).not.toHaveBeenCalled()
  })
})
