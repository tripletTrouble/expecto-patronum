import prisma from '../server/utils/prisma'

async function main() {
  const count = await prisma.user.count()
  console.log(JSON.stringify({ ok: true, userCount: count }))
}

main()
  .catch((e) => {
    console.error('ERR', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
