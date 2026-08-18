// 临时工具：解析 API_CONTRACT/openapi-*.json，打印接口路径与 Schema 字段（供对接参考）
import { readFileSync } from 'node:fs'

const file = process.argv[2]
const filter = process.argv[3] ? new RegExp(process.argv[3]) : null
const doc = JSON.parse(readFileSync(file, 'utf8'))

function schemaRef(ref) {
  if (!ref) return 'none'
  return ref.replace('#/components/schemas/', '')
}

console.log(`\n===== ${file} =====`)
for (const [path, methods] of Object.entries(doc.paths)) {
  if (filter && !filter.test(path)) continue
  for (const [m, op] of Object.entries(methods)) {
    const req = op.requestBody?.content?.['application/json']?.schema?.['$ref']
    const resp = op.responses?.['200']?.content?.['*/*']?.schema?.['$ref']
    console.log(`${m.toUpperCase().padEnd(6)} ${path}`)
    console.log(`    summary: ${op.summary ?? ''}`)
    console.log(`    req: ${schemaRef(req)}   resp: ${schemaRef(resp)}`)
  }
}

console.log('\n===== SCHEMAS =====')
for (const [name, s] of Object.entries(doc.components?.schemas ?? {})) {
  if (filter && !filter.test(name)) continue
  console.log(`\n--- ${name} ---`)
  if (s.type === 'object' && s.properties) {
    for (const [pn, ps] of Object.entries(s.properties)) {
      const t = ps.type ?? ps['$ref']?.replace('#/components/schemas/', '') ?? '?'
      const required = (s.required ?? []).includes(pn) ? ' *REQUIRED' : ''
      const en = ps.enum ? ` enum=${JSON.stringify(ps.enum)}` : ''
      const desc = ps.description ? ` // ${ps.description}` : ''
      console.log(`  ${pn}: ${t}${en}${required}${desc}`)
    }
  } else if (s.type === 'array') {
    console.log(`  array of ${s.items?.type ?? schemaRef(s.items?.['$ref'])}`)
  } else {
    console.log(`  ${JSON.stringify(s)}`)
  }
}
