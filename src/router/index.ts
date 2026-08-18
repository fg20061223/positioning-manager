import type { Component } from 'vue'
import { OfficeBuilding, Odometer } from '@element-plus/icons-vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单/页面标题 */
    title?: string
    /** 菜单图标组件 */
    icon?: Component
    /** 允许访问的角色（userType: ADMIN/STAFF/MERCHANT/USER），缺省=登录即可 */
    roles?: string[]
    /** 不在侧边菜单显示（如带参数的子页面） */
    hidden?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', icon: Odometer },
      },
      {
        path: 'mall',
        name: 'Mall',
        component: () => import('@/views/mall/index.vue'),
        meta: { title: '商场管理', icon: OfficeBuilding, roles: ['ADMIN', 'STAFF'] },
      },
      {
        path: 'mall/:mallId/floors',
        name: 'MallFloors',
        component: () => import('@/views/mall/floor.vue'),
        meta: { title: '楼层管理', hidden: true, roles: ['ADMIN', 'STAFF'] },
      },
      {
        path: 'mall/:mallId/floor/:floorId/zones',
        name: 'MallZones',
        component: () => import('@/views/mall/zone.vue'),
        meta: { title: '分区管理', hidden: true, roles: ['ADMIN', 'STAFF'] },
      },
      {
        path: '403',
        name: 'Forbidden',
        component: () => import('@/views/error/403.vue'),
        meta: { title: '无权限', hidden: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫：登录态 + 用户信息恢复 + RBAC 角色过滤
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.path === '/login') {
    return auth.isLoggedIn ? { path: '/' } : true
  }
  if (!auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  // 刷新后 store 中无 user：用 token 调 /auth/me 恢复
  if (!auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      return { path: '/login' }
    }
  }
  const roles = to.meta.roles
  if (roles && roles.length > 0 && !roles.includes(auth.userType)) {
    return { path: '/403' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} - 商场可视化导航系统`
    : '商场可视化导航系统'
})

export default router
