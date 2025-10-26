# ベースイメージ
FROM node:20

# 作業ディレクトリ設定
WORKDIR /app

# Vue開発サーバが使用するポート
EXPOSE 5173

# 開発用コマンド（composeの command: で上書きされる想定）
CMD ["npm", "run", "dev", "--", "--host"]
