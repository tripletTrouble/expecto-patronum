import { beforeEach, describe, expect, it, vi } from 'vitest'

import { validateTeacherQuestion } from '../../server/utils/question-validation'

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }))

vi.mock('../../server/utils/prisma', () => ({
  prisma: { category: { findFirst } },
}))

describe('server question validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires the category to belong to the teacher', async () => {
    findFirst.mockResolvedValue(null)

    await expect(validateTeacherQuestion('teacher-1', {
      categoryId: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'SINGLE',
      body: '<p>Soal</p>',
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
    })).rejects.toMatchObject({ message: 'Kategori tidak ditemukan' })
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'clxxxxxxxxxxxxxxxxxxxxxxxx', teacherId: 'teacher-1' },
      select: { id: true },
    })
  })

  it('returns sanitized content for an owned category', async () => {
    findFirst.mockResolvedValue({ id: 'category-1' })

    await expect(validateTeacherQuestion('teacher-1', {
      categoryId: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'SINGLE',
      body: '<p>Soal</p><script>alert(1)</script>',
      options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
    })).resolves.toMatchObject({
      body: '<p>Soal</p>',
      bodyText: 'Soal',
    })
  })
})
