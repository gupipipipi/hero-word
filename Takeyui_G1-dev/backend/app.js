// app.js
const express = require('express');
const cors = require('cors'); // 追加
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 追加
const db = require('./db'); // データベース接続をインポート

const app = express();
const port = 3000;

// ミドルウェア
// CORSを設定して、異なるオリジンからのリクエストを許可
app.use(cors());
// リクエストのボディをJSONとして解析
app.use(bodyParser.json());
// シークレットキー。本番環境では環境変数として管理すべきです。
const SECRET_KEY = 'your_super_secret_key';

// アカウント登録API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'ユーザ名、メールアドレス、パスワードは必須です。' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (account_name, mail_address, password) VALUES (?, ?, ?)';
    
    db.query(sql, [username, email, hashedPassword], (err, result) => {
      if (err) {
        // メールアドレス(UNIQUE)が重複している場合
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'このメールアドレスは既に登録されています。' });
        }
        console.error('データベース挿入エラー:', err);
        return res.status(500).json({ message: '登録に失敗しました。' });
      }
      res.status(201).json({ message: 'アカウントが正常に登録されました。' });
    });
  } catch (error) {
    console.error('bcryptハッシュ化エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// ログインAPI
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE mail_address = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('データベース検索エラー:', err);
      return res.status(500).json({ message: 'ログインに失敗しました。' });
    }
    
    const user = results[0];

    // ユーザーが存在しない場合
    if (!user) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません。' });
    }

    // パスワードの比較
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません。' });
    }

    // ログイン成功: JWTトークンを発行
    const token = jwt.sign({ id: user.user_id, email: user.mail_address }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ message: 'ログインに成功しました。', token: token });
  });
});

// サーバーを起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました。`);
});