<template>
  <div class="error-page">
    <h1 class="error-code">404</h1>
    <p class="error-text">抱歉，您访问的页面不存在</p>
    <el-button type="primary" @click="router.replace('/dashboard')">返回首页</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.error-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.error-code {
  font-size: 80px;
  margin: 0;
  color: #909399;
}

.error-text {
  color: #909399;
  margin: 0 0 12px;
}
</style>
