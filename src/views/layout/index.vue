<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="layout-aside">
      <div class="logo">
        <span class="logo-text">商场导航管理后台</span>
      </div>
      <el-menu
        class="layout-menu"
        :default-active="activeMenu"
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon v-if="m.icon"><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="layout-header">
        <div class="header-title">{{ route.meta.title || '' }}</div>
        <el-dropdown trigger="click" @command="onCommand">
          <span class="user-info">
            <el-avatar :size="30" class="user-avatar">{{ avatarText }}</el-avatar>
            <span class="user-name">{{ auth.displayName }}</span>
            <el-tag size="small" :type="userTypeTag">{{ userTypeLabel }}</el-tag>
            <el-icon class="user-caret"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <!-- 内容区 -->
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Component } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

import { useAuthStore } from '@/stores/auth'
import type { UserType } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

interface MenuItem {
  path: string
  title: string
  icon?: Component
}

// 菜单从路由表派生，按角色过滤
const menus = computed<MenuItem[]>(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === '/')
  const children = layoutRoute?.children ?? []
  return children
    .filter((c) => {
      if (c.meta?.hidden) return false
      const roles = c.meta?.roles
      return !roles || roles.length === 0 || roles.includes(auth.userType)
    })
    .map((c) => ({
      path: c.path,
      title: c.meta?.title ?? c.path,
      icon: c.meta?.icon,
    }))
})

// 带参数的子页面（楼层/分区）高亮父级菜单
const activeMenu = computed(() => {
  if (route.path.startsWith('/mall')) return '/mall'
  return route.path
})

const userTypeLabelMap: Record<UserType, string> = {
  ADMIN: '平台管理员',
  STAFF: '商场运营',
  MERCHANT: '商户',
  USER: '普通用户',
}
const userTypeTagMap: Record<UserType, 'danger' | 'success' | 'warning' | 'info'> = {
  ADMIN: 'danger',
  STAFF: 'success',
  MERCHANT: 'warning',
  USER: 'info',
}
const userTypeLabel = computed(() => userTypeLabelMap[auth.userType] ?? auth.userType)
const userTypeTag = computed(() => userTypeTagMap[auth.userType] ?? 'info')
const avatarText = computed(() => auth.displayName.slice(0, 1).toUpperCase())

async function onCommand(command: string) {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    }).catch(() => null)
    await auth.logout()
    router.replace('/login')
  }
}
</script>

<style scoped>
.layout {
  height: 100%;
}

.layout-aside {
  background-color: #001529;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  background-color: #002140;
  flex-shrink: 0;
}

.layout-menu {
  border-right: none;
  flex: 1;
}

.layout-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}

.user-avatar {
  background-color: #2f6bb0;
  color: #fff;
  font-size: 14px;
}

.user-name {
  color: #303133;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-caret {
  color: #909399;
}

.layout-main {
  padding: 16px;
  overflow-y: auto;
  background-color: #f0f2f5;
}
</style>
