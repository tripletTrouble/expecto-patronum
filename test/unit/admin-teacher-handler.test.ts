import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getQuery, getRouterParam, requireRole, listPendingTeachers, changeTeacherStatus } = vi.hoisted(() => ({
  getQuery: vi.fn(),
  getRouterParam: vi.fn(),
  requireRole: vi.fn(),
  listPendingTeachers: vi.fn(),
  changeTeacherStatus: vi.fn(),
}))

vi.mock('h3', () => ({ getQuery, getRouterParam }))
vi.mock('../../server/utils/require-role', () => ({ requireRole }))
vi.mock('../../server/utils/admin-teachers', () => ({
  listPendingTeachers,
  changeTeacherStatus,
  TeacherStatusChangeError: class TeacherStatusChangeError extends Error {},
  teacherIdSchema: { safeParse: (value: unknown) => ({ success: Boolean((value as { id?: string }).id?.startsWith('c')), data: value }) },
  teacherPaginationSchema: { safeParse: (value: unknown) => ({ success: true, data: { page: 1, pageSize: 20, ...value as object } }) },
}))

describe('admin teacher endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('createError', (error: unknown) => error)
    getQuery.mockReturnValue({})
    getRouterParam.mockReturnValue('ckz5h0p8x0000s0m4b3q7r2k1')
    listPendingTeachers.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })
    changeTeacherStatus.mockResolvedValue({ id: 'teacher-1', status: 'APPROVED' })
  })

  it.each([
    ['anonymous', { statusCode: 401 }],
    ['student', { statusCode: 403 }],
    ['teacher', { statusCode: 403 }],
  ])('does not execute listing for a %s request', async (_actor, error) => {
    requireRole.mockRejectedValue(error)
    const handler = (await import('../../server/api/admin/teachers/pending.get')).default

    await expect(handler({} as never)).rejects.toMatchObject(error)
    expect(listPendingTeachers).not.toHaveBeenCalled()
  })

  it('lists teachers after admin authorization', async () => {
    requireRole.mockResolvedValue({ role: 'ADMIN', status: 'APPROVED' })
    const handler = (await import('../../server/api/admin/teachers/pending.get')).default

    await expect(handler({} as never)).resolves.toMatchObject({ data: [] })
    expect(requireRole).toHaveBeenCalledWith({}, ['ADMIN'])
    expect(listPendingTeachers).toHaveBeenCalledWith(1, 20)
  })

  it('requires admin authorization for status changes', async () => {
    requireRole.mockRejectedValue({ statusCode: 403 })
    const handler = (await import('../../server/api/admin/teachers/[id]/approve.post')).default

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })
    expect(changeTeacherStatus).not.toHaveBeenCalled()
  })
})
