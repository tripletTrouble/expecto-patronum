import { spawn } from 'node:child_process'

import { z } from 'zod'

const adminEnvironmentSchema = z.object({
  ADMIN_EMAIL: z.string({ error: 'ADMIN_EMAIL is required' }).email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z.string({ error: 'ADMIN_PASSWORD is required' }).min(12, 'ADMIN_PASSWORD must be at least 12 characters'),
})

const host = '127.0.0.1'
const port = '3456'
const baseUrl = `http://${host}:${port}`

const environment = adminEnvironmentSchema.safeParse({
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
})

if (!environment.success) {
  const messages = environment.error.issues.map(issue => issue.message).join('; ')
  throw new Error(`Cannot bootstrap admin: ${messages}`)
}

const server = spawn(process.execPath, ['x', 'nuxt', 'dev', '--host', host, '--port', port], {
  stdio: 'ignore',
  env: process.env,
})

function stopServer() {
  if (!server.killed) {
    server.kill('SIGTERM')
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await fetch(`${baseUrl}/api/health`)
      return
    }
    catch {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  throw new Error('The temporary Nuxt server did not start within 30 seconds')
}

try {
  await waitForServer()

  const task = spawn(process.execPath, [
    'x',
    'nuxt',
    'task',
    'run',
    'bootstrap-admin',
    '--url',
    baseUrl,
  ], {
    stdio: 'inherit',
    env: process.env,
  })

  const exitCode = await new Promise<number>((resolve) => {
    task.on('close', code => resolve(code ?? 1))
    task.on('error', (error) => {
      console.error(error.message)
      resolve(1)
    })
  })

  if (exitCode !== 0) {
    throw new Error(`The admin bootstrap task failed with exit code ${exitCode}`)
  }
}
finally {
  stopServer()
}
