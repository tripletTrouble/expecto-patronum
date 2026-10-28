import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')

  const timeoutMs = 2000

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('healthcheck timeout')), timeoutMs),
      ),
    ])

    setResponseStatus(event, 200)
    return { status: 'ok' }
  }
  catch {
    console.error('healthcheck: database query failed')
    setResponseStatus(event, 503)
    return { status: 'error' }
  }
})
