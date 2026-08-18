import type { Directive, DirectiveBinding } from 'vue'

import { useAuthStore } from '@/stores/auth'

/**
 * 按钮级权限指令：v-permission="'space:edit'"
 *
 * 权限码来自后端 sys_permission.perm_code（见 docs/PROJECT_CONTEXT.md 第八节）。
 * M1 阶段权限码体系尚未接入（auth.permissions 为空数组），空数组视为放行；
 * 后续（M4）接入后，无权限元素会被直接移除。
 */
export const permission: Directive<HTMLElement, string> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const auth = useAuthStore()
    if (auth.permissions.length > 0 && !auth.permissions.includes(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
