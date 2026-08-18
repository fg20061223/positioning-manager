/** 认证服务相关类型（对齐 openapi-auth.json） */

/** 用户类型（/auth/me 返回 userType）：ADMIN 平台管理员 / STAFF 商场运营 / MERCHANT 商户 / USER 普通用户 */
export type UserType = 'ADMIN' | 'STAFF' | 'MERCHANT' | 'USER'

/** 当前用户信息 UserVO */
export interface UserVO {
  id: number
  username: string
  nickname?: string
  realName?: string
  phone?: string
  email?: string
  avatarUrl?: string
  userType: UserType
  /** 账号状态: 1=启用 0=禁用 */
  status: number
  lastLoginAt?: string
}

/** 登录入参 */
export interface LoginRequest {
  /** 账号（用户名或手机号） */
  account: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  /** Sa-Token 令牌（JWT） */
  token: string
  user: UserVO
}
