// app.js
require('dotenv').config(); // process.envに環境変数を読み込む。auth.jsを読み込む前に必要。
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const authToken = require('./auth'); // 認証ミドルウェアの読み込み

const app = express();
const host = '0.0.0.0';
const port = 3000;
// ミドルウェア
// CORSを設定して、異なるオリジンからのリクエストを許可
app.use(cors());
// リクエストのボディをJSONとして解析
app.use(bodyParser.json());
// シークレットキー。本番環境では環境変数として管理すべきです。
const SECRET_KEY = process.env.JWT_SECRET;

// 日時を取得する関数
const formatTimestamp = function() {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    // YYYYMMDDHHmmss_ms 形式
    return `${YYYY}${MM}${DD}${HH}${mm}${ss}_${ms}`;
}

// 画像ファイルのアップロード先とファイル名を設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueFilename = formatTimestamp() + '-' + uuidv4() + ext;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

// アカウント登録API
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'ユーザ名、メールアドレス、パスワードは必須です。' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (account_name, mail_address, password) VALUES (?, ?, ?)';
    
    const [result] = await pool.query(sql, [username, email, hashedPassword]);
    
    res.status(201).json({ message: 'アカウントが正常に登録されました。' });
  } catch (err) {
    // エラー処理
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'このメールアドレスは既に登録されています。' });
    }
    
    console.error('エラー:', err);
    res.status(500).json({ message: '登録に失敗しました。' });
  }
});

// ログインAPI
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try{
    const sql = 'SELECT * FROM users WHERE mail_address = ?';
    const [results] = await pool.query(sql, [email]);
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
    const token = jwt.sign({ userId: user.user_id }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ message: 'ログインに成功しました。', token: token });

  }catch(err){
    console.error('エラー:', err);
    res.status(500).json({ message: 'ログインに失敗しました。' });
  }
});

// 商品登録API
app.post('/api/register_items', authToken, upload.single('itemimage'), async (req, res) => {
  const { itemname, description, price } = req.body;
  const imagefilename = req.file ? req.file.filename : null;
  const userid = req.userId;

  try {
    const sql = 'INSERT INTO items (item_name, item_description, price, imagefilename, user_id) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [itemname, description, price, imagefilename, userid]);
    res.status(201).json({ message: '商品が正常に登録されました。' });
  } catch (err) {
    console.error('エラー:', err);
    res.status(500).json({ message: '登録に失敗しました。' });
  }
});

// 商品情報取得API
app.get('/api/items', async (req, res) => {
  try{
    const sql = 'SELECT item_name, price, created_at FROM items';
    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    console.error('商品取得エラー:', err);
    res.status(500).json({ error: '商品取得に失敗しました' });
  }
});

// --- 1) locations 一覧 ---
app.get('/api/locations', async (req, res) => {
  try{
    const sql = 'SELECT location_id, name, address, created_at FROM locations ORDER BY name';
    const [results] = await pool.query(sql);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'ロケーション取得に失敗しました' });
  }
});

// --- 2) events: location_id 指定でイベント一覧取得 ---
// 例: GET /api/events?location_id=1
app.get('/api/events', async (req, res) => {
  const locationId = req.query.location_id;
  let sql = '';
  let params = [];
  try{
    if (locationId) {
      sql = `
        SELECT event_id, event_name, event_description, price, imagefilename, location_id, user_id, created_at
        FROM events
        WHERE location_id = ?
        ORDER BY event_name
      `;
      params = [locationId];
    } else {
      sql = 'SELECT event_id, event_name, event_description, price, imagefilename, location_id, user_id, created_at FROM events';
    }
    const [results] = await pool.query(sql, params);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'イベント取得に失敗しました' });
  }
});

// --- 3) event 一つ取得（既存） ---
app.get('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try{
    const sql = 'SELECT event_id, event_name, event_description, price, imagefilename, location_id FROM events WHERE event_id = ?';
    const [results] = await pool.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }
    return res.json(results[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'イベント取得に失敗しました' });
  }
});

// --- 4) schedules: event_id 指定でスケジュール一覧取得 ---
// 例: GET /api/schedules?event_id=10
app.get('/api/schedules', async (req, res) => {
  const eventId = req.query.event_id;
  if (!eventId) {
    return res.status(400).json({ error: 'event_id が必要です' });
  }
  try{
    const sql = `
      SELECT schedule_id, event_id, event_date, capacity, created_at
      FROM schedules
      WHERE event_id = ?
      ORDER BY event_date
    `;
    const [results] = await pool.query(sql, [eventId]);
    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'スケジュール取得に失敗しました' });
  }
});

// --- 5) 既存の体験購入 (POST /api/buyevent) ---
// リクエスト例: { schedule_id, user_id, number_of_participants, status }
app.post('/api/buyevent', async (req, res) => {
  const { schedule_id, user_id, number_of_participants, status } = req.body;
  if (!schedule_id || !user_id) {
    return res.status(400).json({ message: 'schedule_id と user_id が必要です' });
  }
  try{
    const sql = `
      INSERT INTO reservations (schedule_id, user_id, number_of_participants, status)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [schedule_id, user_id, number_of_participants || 1, status || 'reserved']);
    return res.status(201).json({ message: '予約が登録されました ✅', reservation_id: result.insertId });
  } catch (err) {
    console.error('データベース挿入エラー:', err);
    return res.status(500).json({ message: '登録に失敗しました' });
  }
});

// サーバーを起動
app.listen(port, host, () => {
  console.log(`サーバーが http://${host}:${port} で起動しました。`);
});


// backend/app.js の末尾に追加するコード

// --- 6) ユーザーの購入履歴/予約履歴を取得 (商品と体験) ---
app.get('/api/myorders', authToken, async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ message: '認証情報が不足しています。' });
  }

  try {
    // 商品注文履歴の取得 (orders, order_items, itemsをJOIN)
    const [ordersResults] = await pool.query(`
      SELECT 
        o.order_id, o.total_amount, o.status AS order_status, o.created_at AS order_date,
        i.item_name, oi.quantity, oi.price_at_purchase
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN items i ON oi.item_id = i.item_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId]);
    res.json({ orders: ordersResults, reservations: reservationsResults });
  } catch (err) {
    console.error('注文/予約取得エラー:', err);
    res.status(500).json({ error: '履歴の取得に失敗しました' });
  }
});

// --- 7) 商品の返品処理 ---
app.post('/api/return/product/:orderId', authToken, async (req, res) => {
  const orderId = req.params.orderId;
  const userId = req.userId;

  try {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE order_id = ? AND user_id = ? AND status != ?',
      ['returned', orderId, userId, 'returned'] // 既に返品済み、または初期状態のものを除く
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '注文が見つからないか、既に返品済みです。' });
    }

    res.status(200).json({ message: `注文ID: ${orderId} の商品を返品しました。` });
  } catch (err) {
    console.error('商品返品エラー:', err);
    res.status(500).json({ message: '商品返品に失敗しました。' });
  }
});


