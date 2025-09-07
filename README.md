# AIDL(AI Don't lose)

## Project 세팅

```bash
$ pnpm install

# docker compose를 통하여 postgresql 세팅
$ docker compose -f docker-compose.yml up -d

# docker compose를 통하여 postgresql 세팅 제거
$ docker compose -f docker-compose.yml down
```

## 컴파일 및 시작

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod

# Docker 사용 시작
$ docker build -t aidl . --no-cache && docker run --name aidl -p 8000:3000 -d aidl

# Docker 사용 중지
$ docker stop aidl && docker rm aidl && docker rmi aidl
```

## 테스트

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## env 파일

```bash
$ cp .env.example .env
```

## db migration

```bash
# migration 파일 기준으로 migration (db 연결 되어 있어야만 동작)
$ npx prisma migrate dev

# schema.prisma 파일 포맷팅
$ npx prisma format
```
