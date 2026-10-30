import { bootstrapAdmin } from '../utils/bootstrap-admin'

export default defineTask({
  meta: {
    name: 'bootstrap-admin',
    description: 'Create the first administrator from ADMIN_EMAIL and ADMIN_PASSWORD',
  },
  async run() {
    return { result: await bootstrapAdmin() }
  },
})
