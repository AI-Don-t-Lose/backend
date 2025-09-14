export interface JwtPayload {
  sub: string; // 사용자 ID (JWT 표준)
  iat?: number; // 발급 시간 (JWT 표준)
  exp?: number; // 만료 시간 (JWT 표준)
  iss?: string; // 발급자 (JWT 표준)
  [key: string]: any; // 추가 필드 허용
}
