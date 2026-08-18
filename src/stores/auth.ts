import { defineStore } from 'pinia'

import * as authApi from '@/api/auth'
import type { UserType, UserVO } from '@/types/auth'
import { storage } from '@/utils/storage'

interface AuthState {
  token: string
  user: UserVO | null
  /**
   * 按钮级权限码（来自后端 sys_permission.perm_code，如 space:edit）。
   * M1 阶段尚未拉取权限码，保持空数组（v-permission 空数组视为放行）。
   */
  permissions: string[]
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: storage.getToken(),
    user: storage.getUser<UserVO>(),
    permissions: [],
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userType: (state): UserType => state.user?.userType ?? 'USER',
    displayName: (state) =>
      state.user?.nickname || state.user?.realName || state.user?.username || '未登录',
  },

  actions: {
    async login(account: string, password: string) {
      const data = await authApi.login({ account, password })
      this.token = data.token
      this.user = data.user
      storage.setToken(data.token)
      storage.setUser(data.user)
    },

    /** 拉取当前用户信息（刷新页面后恢复登录态） */
    async fetchMe() {
      const user = await authApi.me()
      this.user = user
      storage.setUser(user)
      return user
    },

    async logout() {
      try {
        await authApi.logout()
      } catch {
        // 登出接口失败不阻塞本地退出
      }
      this.reset()
    },

    reset() {
      this.token = ''
      this.user = null
      this.permissions = []
      storage.clearAuth()
    },
  },
})
