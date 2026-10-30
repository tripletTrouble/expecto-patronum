import { spawn } from 'node:child_process'

import { z } from 'zod'

const adminEnvironmentSchema = z.object({
  ADMIN_EMAIL: z.string({ error: 'ADMIN_EMAIL is required' }).email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z.string({ error: 'ADMIN_PASSWORD is required' }).min(12, 'ADMIN_PASSWORD must be at least 12 characters'),
})

const host = '127.0.0.1'
const port = process.env.BOOTSTRAP_ADMIN_PORT ?? '3456'
const baseUrl = process.env.BOOTSTRAP_ADMIN_URL ?? `http://${host}:${port}`

const environment = adminEnvironmentSchema.safeParse({
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
})

if (!environment.success) {
  const messages = environment.error.issues.map(issue => issue.message).join('; ')
  throw new Error(`Cannot bootstrap admin: ${messages}`)
}

const startsServer = !process.env.BOOTSTRAP_ADMIN_URL
const server = startsServer
  ? spawn(process.execPath, ['x', 'nuxt', 'dev', '--host', host, '--port', port], {
      stdio: 'inherit',
      env: process.env,
    })
  : undefined

function stopServer() {
  if (server && !server.killed) {
    server.kill('SIGTERM')
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/_nitro/tasks`)

      if (response.ok) {
        return
      }

      throw new Error(`Nitro returned HTTP ${response.status}`)
    }
    catch (error) {
      if (server?.exitCode !== null && server?.exitCode !== undefined) {
        throw new Error(`The temporary Nuxt server exited with code ${server.exitCode}`, { cause: error })
      }

      if (attempt === 59) {
        const reason = error instanceof Error ? `: ${error.message}` : ''
        throw new Error(`The temporary Nuxt server did not expose Nitro tasks within 30 seconds${reason}`, { cause: error })
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
}

async function runBootstrapTask() {
  const response = await fetch(`${baseUrl}/_nitro/tasks/bootstrap-admin`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload: {} }),
  })

  const body = await response.text()

  if (!response.ok) {
    throw new Error(`The admin bootstrap task failed with HTTP ${response.status}: ${body}`)
  }

  let result: unknown

  try {
    result = JSON.parse(body).result
  }
  catch (error) {
    throw new Error('The admin bootstrap task returned invalid JSON', { cause: error })
  }

  if (typeof result !== 'object' || result === null || !('created' in result)) {
    throw new Error('The admin bootstrap task returned an unexpected result')
  }

  if (result.created === true) {
    console.info('Administrator created successfully.')
  }
  else if (result.created === false && 'reason' in result && result.reason === 'already_exists') {
    console.info('Administrator already exists; no changes made.')
  }
  else {
    throw new Error('The admin bootstrap task returned an unexpected result')
  }
}

try {
  console.info(`Waiting for Nitro at ${baseUrl}...`)
  await waitForServer()
  console.info('Running administrator bootstrap...')
  await runBootstrapTask()
  console.info('Administrator bootstrap complete.')
}
catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  }
  else {
    console.error('The admin bootstrap task failed.')
  }
  process.exitCode = 1
}
finally {
  stopServer()
}
