import { ref } from 'vue'

import { floorByMall, mallPage, zonePage } from '@/api/mall'
import { shopCategoryPage } from '@/api/shop'
import type { Mall, MallFloor, MallZone } from '@/types/mall'
import type { ShopCategory } from '@/types/shop'
import { eqId } from '@/utils/id'

/**
 * 商场/楼层/分区/商铺分类 字典数据（多个业务页共用）：
 * - mall/floor/zone 层级联动（floor 由 by-mall 拉取，zone 全量本地过滤）
 * - 分类按商场过滤（mallId 为空 = 平台通用分类）
 */
export function useMallData() {
  const malls = ref<Mall[]>([])
  const floors = ref<MallFloor[]>([])
  const zones = ref<MallZone[]>([])
  const categories = ref<ShopCategory[]>([])
  const loading = ref(false)

  async function loadMalls() {
    malls.value = (await mallPage({ pageNum: 1, pageSize: 1000 })).records
  }
  async function loadFloors(mallId?: number | null) {
    floors.value = mallId ? await floorByMall(mallId) : []
  }
  async function loadZones() {
    zones.value = (await zonePage({ pageNum: 1, pageSize: 1000 })).records
  }
  async function loadCategories() {
    categories.value = (
      await shopCategoryPage({ pageNum: 1, pageSize: 1000 })
    ).records
  }
  /** 一次性加载全部字典 */
  async function loadAll() {
    loading.value = true
    try {
      await Promise.all([loadMalls(), loadZones(), loadCategories()])
    } finally {
      loading.value = false
    }
  }

  const zonesOfFloor = (floorId?: number | null) =>
    zones.value.filter((z) => !floorId || eqId(z.floorId, floorId))
  const categoriesOfMall = (mallId?: number | null) =>
    categories.value.filter((c) => !c.mallId || eqId(c.mallId, mallId))

  return {
    malls,
    floors,
    zones,
    categories,
    loading,
    loadMalls,
    loadFloors,
    loadZones,
    loadCategories,
    loadAll,
    zonesOfFloor,
    categoriesOfMall,
  }
}
