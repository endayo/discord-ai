# 軽量 & 安定
FROM node:20-alpine

# PID1 問題対策（tiniを使う場合）
RUN apk add --no-cache tini curl

# 実行ディレクトリ
WORKDIR /app

# 依存のみ先にインストール（キャッシュ有効化）
# ※ ビルドコンテキストはプロジェクトルートなので "app/..." で参照
COPY app/package.json app/package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# アプリ本体をコピー
COPY app/ ./

# 実行ユーザ（任意）
USER node

# 起動（tini経由）
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","src/index.js"]