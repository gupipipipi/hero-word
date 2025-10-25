const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

const authToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '認証ヘッダの形式が不正です。' });
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: '認証失敗' });
        }
        req.userId = decoded.userId;
        next();
    });
};

module.exports = authToken;