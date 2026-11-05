import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteTeacherCategory, listTeacherCategories } from '../../server/utils/teacher-categories'

const { findMany, findFirst, count, updateMany, deleteCategory, transaction } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
  updateMany: vi.fn(),
  deleteCategory: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('../../server/utils/prisma', () => ({
  prisma: {
    category: { findMany, findFirst },
    question: { count },
    $transaction: transaction,
  },
}))

describe('teacher categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    transaction.mockImplementation(async (callback: (client: unknown) => unknown) => callback({
      category: { findFirst, delete: deleteCategory },
      question: { count, updateMany },
    }))
  })

  it('lists only the teacher categories with active question counts', async () => {
    findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Aljabar', createdAt: new Date('2026-01-01'), _count: { questions: 3 } },
      { id: 'cat-2', name: 'Geometri', createdAt: new Date('2026-01-02'), _count: { questions: 0 } },
    ])

    await expect(listTeacherCategories('teacher-1')).resolves.toEqual([
      { id: 'cat-1', name: 'Aljabar', createdAt: new Date('2026-01-01'), questionCount: 3 },
      { id: 'cat-2', name: 'Geometri', createdAt: new Date('2026-01-02'), questionCount: 0 },
    ])
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { teacherId: 'teacher-1' },
      orderBy: { name: 'asc' },
    }))
  })

  it('blocks deletion when active questions remain', async () => {
    findFirst.mockResolvedValue({ id: 'cat-1' })
    count.mockResolvedValue(2)

    await expect(deleteTeacherCategory('teacher-1', 'cat-1')).rejects.toMatchObject({
      code: 'HAS_QUESTIONS',
      message: 'Kategori tidak dapat dihapus karena masih memiliki soal aktif',
    })
    expect(updateMany).not.toHaveBeenCalled()
    expect(deleteCategory).not.toHaveBeenCalled()
  })

  it('detaches soft-deleted questions before deleting an empty category', async () => {
    findFirst.mockResolvedValue({ id: 'cat-1' })
    count.mockResolvedValue(0)

    await expect(deleteTeacherCategory('teacher-1', 'cat-1')).resolves.toBeUndefined()
    expect(updateMany).toHaveBeenCalledWith({
      where: { categoryId: 'cat-1', deletedAt: { not: null } },
      data: { categoryId: null },
    })
    expect(deleteCategory).toHaveBeenCalledWith({ where: { id: 'cat-1' } })
  })

  it('does not operate on another teacher category', async () => {
    findFirst.mockResolvedValue(null)

    await expect(deleteTeacherCategory('teacher-1', 'cat-2')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(count).not.toHaveBeenCalled()
    expect(deleteCategory).not.toHaveBeenCalled()
  })
})
