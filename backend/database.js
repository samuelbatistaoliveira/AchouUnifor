const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'achou_unifor',
  password: 'A_SUA_SENHA', // Coloque aqui a senha do seu banco
  port: 5432,
});

module.exports = pool;