import 'dotenv/config'
import 'reflect-metadata'
import { join } from 'node:path'
import { DataSource, DataSourceOptions } from 'typeorm'
import { ENTITIES } from './entities'

export function dataSourceOptions(url = process.env.DATABASE_URL): DataSourceOptions {
  return {
    type: 'postgres',
    url,
    entities: ENTITIES,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false
  }
}

export default new DataSource(dataSourceOptions())
