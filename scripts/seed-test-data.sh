#!/bin/bash

# 환경변수 로드
source .env

echo "🌱 Creating test seed data..."

# PostgreSQL에 연결해서 simple-seed.sql 실행
psql "$DATABASE_URL" -f scripts/simple-seed.sql

echo "✅ Test data seeded successfully!"
echo "🧪 JWT 토큰 테스트용 payload:"
echo '   { "sub": "test-user-001", "iat": 1234567890 }'