process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://tostao:tostao@localhost:5432/tostao_test'
process.env.JWT_SECRET = 'segredo-de-teste-com-tamanho-suficiente'
process.env.WEB_ORIGIN = 'http://localhost:5173'
