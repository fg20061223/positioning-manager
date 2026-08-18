import { http } from '@/utils/request'
import type { LoginRequest, LoginResponse, UserVO } from '@/types/auth'

/** POST /auth/login 登录（账号=用户名或手机号） */
export function login(data: LoginRequest) {
  return http.post<LoginResponse>('/auth/login', data)
}

/** POST /auth/logout 退出登录 */
export function logout() {
  return http.post<void>('/auth/logout')
}

/** POST /auth/me 当前登录用户信息 */
export function me() {
  return http.post<UserVO>('/auth/me')
}
