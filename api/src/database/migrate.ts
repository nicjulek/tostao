import dataSource from './data-source'

async function run() {
  await dataSource.initialize()
  const done = await dataSource.runMigrations()
  console.log(done.length ? `Migrações aplicadas: ${done.map((m) => m.name).join(', ')}` : 'Banco já está atualizado')
  await dataSource.destroy()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
