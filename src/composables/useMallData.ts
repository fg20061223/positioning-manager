import { ref } from 'vue'

import { floorOptions, mallOptions, zoneOptions } from '@/api/mall'
import { shopCategoryOptions } from '@/api/shop'
import { poiOptions } from '@/api/facility'
import type { OptionVO } from '@/types/result'

/**
 * 商场/楼层/分区/商铺分类/设施 下拉字典数据（多个业务页共用）。
 *
 * 下拉统一走后端专用 options 接口（返回 {id, name}）：
 * - mall/options、floor/options（按商场）、zone/options（按商场/楼层）、
 *   shop-category/options（按商场）、poi/options（按商场/楼层）
 *
 * 联动顺序：商场(malls) → 楼层(loadFloors(mallId)) → 分区(loadZones(floorId))；
 * 分类(loadCategories(mallId))、设施(loadPois) 随商场/楼层切换刷新。
 */
export function useMallData() {
  const malls = ref<OptionVO[]>([])
  const floors = ref<OptionVO[]>([])
  const zones = ref<OptionVO[]>([])
  const categories = ref<OptionVO[]>([])
  const pois = ref<OptionVO[]>([])
  const loading = ref(false)

  async function loadMalls() {
    malls.value = await mallOptions()
  }
  /** 楼层下拉：按商场过滤（mallId 为空则清空） */
  async function loadFloors(mallId?: number | null) {
    floors.value = mallId ? await floorOptions({ mallId }) : []
    // 商场切换后旧楼层下的分区一并清空，由下层联动重新加载
    zones.value = []
  }
  /** 分区下拉：按楼层过滤（floorId 为空则清空） */
  async function loadZones(floorId?: number | null) {
    zones.value = floorId ? await zoneOptions({ floorId }) : []
  }
  /** 商铺分类下拉：按商场过滤（不传则全部/平台通用） */
  async function loadCategories(mallId?: number | null) {
    categories.value = await shopCategoryOptions(
      mallId != null && mallId !== 0 ? { mallId: Number(mallId) } : undefined,
    )
  }
  /** 设施下拉：可选商场/楼层过滤 */
  async function loadPois(query?: { mallId?: number; floorId?: number }) {
    pois.value = await poiOptions(query ? { ...query } : undefined)
  }
  /** 一次加载基础字典（商场） */
  async function loadAll() {
    loading.value = true
    try {
      await loadMalls()
    } finally {
      loading.value = false
    }
  }

  return {
    malls,
    floors,
    zones,
    categories,
    pois,
    loading,
    loadMalls,
    loadFloors,
    loadZones,
    loadCategories,
    loadPois,
    loadAll,
  }
}
