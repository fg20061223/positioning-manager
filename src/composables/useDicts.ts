import { ref } from 'vue'

import { dictListByTypes } from '@/api/dict'
import type { DictItemVO } from '@/types/dict'

/**
 * 系统字典 hook：把前端硬编码枚举改为后端 /business/dict/list 动态拉取。
 *
 * - 模块级缓存：同类型字典只请求一次，多页面共享
 * - 返回 options(type)（下拉选项）与 label(type, code)（取值显示）
 */
const cache = new Map<string, DictItemVO[]>()
const pending = new Map<string, Promise<void>>()

async function ensureLoaded(types: string[]) {
  const need = types.filter((t) => !cache.has(t) && !pending.has(t))
  if (need.length) {
    const p = dictListByTypes(need).then((map) => {
      for (const t of need) {
        const items = (map[t] ?? [])
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        cache.set(t, items)
      }
    })
    // 失败也释放 pending，避免永久卡住（下次可重试）
    const settled = p.catch(() => {}) as Promise<void>
    for (const t of need) {
      pending.set(t, settled)
    }
    await settled
    for (const t of need) {
      pending.delete(t)
    }
  } else {
    await Promise.all(types.filter((t) => pending.has(t)).map((t) => pending.get(t)))
  }
}

export function useDicts(types: string[]) {
  const dicts = ref<Record<string, DictItemVO[]>>({})
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      await ensureLoaded(types)
      const out: Record<string, DictItemVO[]> = {}
      for (const t of types) {
        out[t] = cache.get(t) ?? []
      }
      dicts.value = out
    } finally {
      loading.value = false
    }
  }

  load()

  /** 某类型字典项列表（下拉选项） */
  function options(type: string): DictItemVO[] {
    return dicts.value[type] ?? []
  }
  /** 取字典项中文名（未知编码回退为编码本身） */
  function label(type: string, code?: string | null): string {
    if (code == null || code === '') return '-'
    return options(type).find((i) => i.code === code)?.label ?? code
  }

  return { dicts, loading, options, label }
}
