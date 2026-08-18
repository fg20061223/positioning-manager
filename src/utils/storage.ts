/** 本地持久化（token/用户信息），独立小模块避免与 api/store 产生循环依赖 */
const TOKEN_KEY = 'pm:token'
const USER_KEY = 'pm:user'

export const storage = {
  getToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  getUser<T>(): T | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },
  setUser<T>(user: T) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
