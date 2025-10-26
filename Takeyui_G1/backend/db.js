// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'db',
  user: 'app_user',
  password: 'app_pass',
  database: 'Takeyui'
});

console.log('コネクションプールを作成しました。');

module.exports = pool; // poolインスタンスをエクスポート