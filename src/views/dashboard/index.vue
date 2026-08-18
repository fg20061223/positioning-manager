<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <span>欢迎使用</span>
      </template>
      <div class="welcome">
        <h3>
          你好，{{ auth.displayName }}
          <el-tag size="small" :type="userTypeTag">{{ userTypeLabel }}</el-tag>
        </h3>
        <p class="desc">商场可视化导航系统 · PC 管理后台</p>
        <el-button type="primary" @click="router.push('/mall')">
          进入商场管理
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="12">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span>账号信息</span></template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="账号">{{ auth.user?.username }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ auth.user?.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ auth.user?.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ auth.user?.id }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header><span>后端接口基线</span></template>
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="网关地址">http://127.0.0.1:8081</el-descriptions-item>
            <el-descriptions-item label="接口约定">全部 POST + JSON，satoken 鉴权</el-descriptions-item>
            <el-descriptions-item label="契约来源">docs/API_CONTRACT/openapi-*.json</el-descriptions-item>
            <el-descriptions-item label="当前模块">
              auth / mall / floor / zone / space / shop / poi / beacon / file
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import type { UserType } from '@/types/auth'

const router = useRouter()
const auth = useAuthStore()

const userTypeLabelMap: Record<UserType, string> = {
  ADMIN: '平台管理员',
  STAFF: '商场运营',
  MERCHANT: '商户',
  USER: '普通用户',
}
const userTypeLabel = computed(() => userTypeLabelMap[auth.userType] ?? auth.userType)
const userTypeTag = computed(() =>
  auth.userType === 'ADMIN'
    ? 'danger'
    : auth.userType === 'STAFF'
      ? 'success'
      : 'info',
)
</script>

<style scoped>
.welcome h3 {
  margin: 0 0 8px;
}

.desc {
  color: #909399;
  margin: 4px 0;
}
</style>
