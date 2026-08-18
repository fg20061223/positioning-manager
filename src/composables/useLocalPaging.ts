import { computed, ref, type Ref } from 'vue'

/**
 * 本地分页：后端 /page 为无条件全量分页（无查询过滤），
 * M1 阶段先全量拉取 + 前端过滤 + 前端分页。
 * rows 传 getter（响应式），内部自动感知过滤结果变化。
 */
export function useLocalPaging<T>(rows: () => T[], initialPageSize = 10) {
  const pageNum = ref(1)
  const pageSize = ref(initialPageSize)

  const total = computed(() => rows().length)
  const paged = computed(() => {
    const start = (pageNum.value - 1) * pageSize.value
    return rows().slice(start, start + pageSize.value)
  })

  /** 当过滤条件变化时重置到第一页 */
  function resetPage() {
    pageNum.value = 1
  }

  return {
    pageNum: pageNum as Ref<number>,
    pageSize: pageSize as Ref<number>,
    total,
    paged,
    resetPage,
  }
}
