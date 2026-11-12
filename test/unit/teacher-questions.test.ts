import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteTeacherQuestion, listTeacherQuestions, updateTeacherQuestion } from '../../server/utils/teacher-questions'

const { findMany, count, findFirst, updateMany, transaction, update, deleteMany, validateTeacherQuestion } = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  validateTeacherQuestion: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    question: { findMany, count, findFirst, updateMany, create: vi.fn() },
    $transaction: transaction,
  },
}))

vi.mock('../../server/utils/question-validation', () => ({ validateTeacherQuestion }))

const question = {
  id: 'question-1',
  categoryId: 'category-1',
  type: 'MULTIPLE',
  body: '<p>Soal</p>',
  bodyText: 'Soal',
  explanation: null,
  points: 2,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  options: [{ id: 'option-1', text: 'A', isCorrect: true, side: null, matchKey: null, sortOrder: 0 }],
}

describe('teacher questions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    transaction.mockImplementation(async (callback: (client: unknown) => unknown) => callback({
      question: { findFirst, update },
      questionOption: { deleteMany },
    }))
  })

  it('lists active questions with filters and bounded pagination', async () => {
    findMany.mockResolvedValue([question])
    count.mockResolvedValue(1)

    await expect(listTeacherQuestions('teacher-1', {
      categoryId: 'category-1', type: 'MULTIPLE', search: 'Soal', page: 2, pageSize: 10,
    })).resolves.toMatchObject({
      data: [{ id: 'question-1', points: 2 }],
      pagination: { page: 2, pageSize: 10, total: 1, totalPages: 1 },
    })
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ teacherId: 'teacher-1', deletedAt: null, categoryId: 'category-1', type: 'MULTIPLE' }),
      skip: 10,
      take: 10,
    }))
  })

  it('does not soft-delete another teacher question', async () => {
    updateMany.mockResolvedValue({ count: 0 })

    await expect(deleteTeacherQuestion('teacher-1', 'question-2')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'question-2', teacherId: 'teacher-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it('replaces options inside one transaction after validation', async () => {
    validateTeacherQuestion.mockResolvedValue({
      categoryId: 'category-1', type: 'MULTIPLE', body: '<p>New</p>', bodyText: 'New',
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: true }],
    })
    findFirst.mockResolvedValue({ id: 'question-1' })
    update.mockResolvedValue({ ...question, bodyText: 'New', points: 2 })

    await updateTeacherQuestion('teacher-1', 'question-1', { type: 'MULTIPLE' })

    expect(transaction).toHaveBeenCalledOnce()
    expect(deleteMany).toHaveBeenCalledWith({ where: { questionId: 'question-1' } })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'question-1' },
      data: expect.objectContaining({ bodyText: 'New', points: 2, options: expect.any(Object) }),
    }))
  })
})
