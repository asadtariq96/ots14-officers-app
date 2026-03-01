import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import xlsx from 'xlsx'

loadEnv({ quiet: true })
loadEnv({ path: '.env.local', override: false, quiet: true })

type OfficerStatus = 'active' | 'deceased'
type BatchType = '14_ots' | '15_ots_passout'
type JsonRow = Record<string, string>

interface OfficerSeedPayload {
  pa_no: string
  rank: string
  name: string
  arm_service: string | null
  unit: string | null
  phone: string | null
  address: string | null
  email: string | null
  city: string | null
  nok_contact: string | null
  status: OfficerStatus
  batch: BatchType
  profile_pic_url: string | null
}

interface DbOfficer { id: string; pa_no: string; name: string }

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  return String(v ?? '').trim()
}

function toNullable(v: unknown): string | null {
  const s = toStr(v)
  return s.length > 0 ? s : null
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function canonicalName(s: string): string {
  return normalizeKey(s)
    .replace(/\b(maj gen|major general|brig|brigadier|lt col|lieutenant colonel|col|colonel|maj|major|capt|captain|lt|2\/lt|gen|general)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extract rank prefix embedded at the start of a name field, e.g. "Lt Col John Smith" */
const RANK_PREFIXES = [
  'Maj Gen', '2/Lt', 'Lt Col', 'Brig', 'Col', 'Maj', 'Capt', 'Lt',
]

function extractRankFromName(raw: string): { rank: string; name: string } {
  for (const prefix of RANK_PREFIXES) {
    if (raw.toLowerCase().startsWith(prefix.toLowerCase() + ' ')) {
      return { rank: prefix, name: raw.slice(prefix.length).trim() }
    }
  }
  return { rank: '', name: raw.trim() }
}

// ─────────────────────────────────────────────────────────────
// CSV section splitting
// Each sheet in the exported CSV is preceded by a line like:
//   "📋 Master Database: Table 1"
// ─────────────────────────────────────────────────────────────

function splitCSVIntoSections(content: string): Map<string, string[][]> {
  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const sections = new Map<string, string[][]>()
  let currentName = ''
  let currentLines: string[] = []

  const flush = () => {
    if (currentName && currentLines.length > 0) {
      const wb = xlsx.read(currentLines.join('\n'), { type: 'string' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const grid = xlsx.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '', raw: false }) as string[][]
      sections.set(currentName, grid)
    }
  }

  for (const line of rawLines) {
    // Section header: "SomeName: Table N" — may start with emoji chars
    const match = line.match(/^(.+):\s*Table\s*\d+\s*$/)
    if (match) {
      flush()
      // Normalize away emojis and whitespace for reliable key lookup
      currentName = normalizeKey(match[1])
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }
  flush()

  return sections
}

// ─────────────────────────────────────────────────────────────
// Parse a grid (array of rows) into JsonRow objects.
// Skips blank rows and repeated header rows (first cell == 'ser').
// headerFinder locates the actual header row index.
// ─────────────────────────────────────────────────────────────

function gridToRows(grid: string[][], sectionLabel: string): JsonRow[] {
  const headerIdx = grid.findIndex((row) => {
    const cells = row.map((c) => normalizeKey(toStr(c)))
    const hasName = cells.some((c) => c === 'name')
    const hasPaOrSer = cells.some((c) => c.includes('pa') || c === 'ser')
    return hasName && hasPaOrSer
  })

  if (headerIdx === -1) {
    console.warn(`  ⚠  Could not find header row in: ${sectionLabel}`)
    return []
  }

  const headers = grid[headerIdx].map((c) => normalizeKey(toStr(c)))
  const rows: JsonRow[] = []

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const row = grid[i]
    // Skip blank rows
    if (row.every((c) => toStr(c) === '')) continue
    // Skip repeated header rows
    if (normalizeKey(toStr(row[0])) === 'ser' && normalizeKey(toStr(row[1])) === 'pa pss no') continue

    const obj: JsonRow = {}
    headers.forEach((h, idx) => { if (h) obj[h] = toStr(row[idx] ?? '') })
    rows.push(obj)
  }

  return rows
}

// ─────────────────────────────────────────────────────────────
// Build officer payload from a standard row (Rank + Name separate)
// ─────────────────────────────────────────────────────────────

function buildActiveOfficer(
  row: JsonRow,
  batch: BatchType,
  idx: number,
): OfficerSeedPayload | null {
  const name = toNullable(row['name'])
  const rank = toNullable(row['rank'])
  if (!name || !rank) return null

  const rawPa = toNullable(row['pa pss no'])
  const paNo = rawPa ?? `${batch === '14_ots' ? 'MISSING14' : 'MISSING15'}-${canonicalName(name).replace(/\s+/g, '-').toUpperCase() || `ROW-${idx}`}`

  return {
    pa_no: paNo,
    rank,
    name,
    arm_service: toNullable(row['arm svc']),
    unit: toNullable(row['unit']),
    phone: toNullable(row['phone']),
    address: toNullable(row['address']),
    email: toNullable(row['email']),
    city: toNullable(row['city']),
    nok_contact: toNullable(row['nok contact'] ?? row['nok / contact']),
    status: 'active',
    batch,
    profile_pic_url: null,
  }
}

// ─────────────────────────────────────────────────────────────
// Build officer payload from a deceased row
// (Name field contains rank prefix: "Brig Shabbir Hussain")
// ─────────────────────────────────────────────────────────────

function buildDeceasedOfficer(
  row: JsonRow,
  batch: BatchType,
  idx: number,
): OfficerSeedPayload | null {
  const rawName = toNullable(row['name'])
  if (!rawName) return null

  const { rank, name } = extractRankFromName(rawName)
  if (!name) return null

  const rawPa = toNullable(row['pa pss no'])
  const paNo = rawPa ?? `${batch === '14_ots' ? 'MISSING14' : 'MISSING15'}-${canonicalName(name).replace(/\s+/g, '-').toUpperCase() || `ROW-${idx}`}`

  // "Phone (NOK)" / "Address (NOK)" columns → nok_contact / address
  const nokPhone = toNullable(row['phone nok'] ?? row['phone (nok)'])
  const nokAddress = toNullable(row['address nok'] ?? row['address (nok)'] ?? row['address'])

  return {
    pa_no: paNo,
    rank: rank || 'Unknown',
    name,
    arm_service: toNullable(row['arm svc']),
    unit: toNullable(row['unit']),
    phone: null,
    address: nokAddress,
    email: null,
    city: null,
    nok_contact: nokPhone,
    status: 'deceased',
    batch,
    profile_pic_url: null,
  }
}

// ─────────────────────────────────────────────────────────────
// Subscription parsing
// ─────────────────────────────────────────────────────────────

function parsePossibleStatus(value: string): 'paid' | 'unpaid' | 'pending' {
  const n = normalizeKey(value)
  if (['paid', 'p', 'yes', 'y'].includes(n)) return 'paid'
  if (['unpaid', 'u', 'no', 'n'].includes(n)) return 'unpaid'
  const num = Number(value.replace(/[^\d.]/g, ''))
  if (!isNaN(num) && num > 0) return 'paid'
  return 'pending'
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const [, , csvPath] = process.argv
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!csvPath) throw new Error('Usage: npm run seed:excel -- <path-to-csv-file>')
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  const content = fs.readFileSync(csvPath, 'utf-8')
  const sections = splitCSVIntoSections(content)

  console.log('\nSections found in CSV:')
  for (const key of sections.keys()) console.log(`  • ${key}`)

  // ── Locate relevant sections ─────────────────────────────────
  function findSection(keywords: string[], excludes: string[] = []): string[][] | undefined {
    for (const [key, grid] of sections) {
      const has = keywords.every((k) => key.includes(normalizeKey(k)))
      const exc = excludes.some((k) => key.includes(normalizeKey(k)))
      if (has && !exc) return grid
    }
    return undefined
  }

  const masterGrid      = findSection(['master', 'database'])
  const deceased14Grid  = findSection(['deceased'], ['15'])
  const passout15Grid   = findSection(['passed', 'out', '15'])
  const deceased15Grid  = findSection(['deceased', '15'])
  const subscriptionGrid = findSection(['subscription'])

  console.log('\nSection mapping:')
  console.log(`  Master Database       → ${masterGrid      ? '✓' : '❌ NOT FOUND'}`)
  console.log(`  Deceased 14th OTS     → ${deceased14Grid  ? '✓' : '❌ NOT FOUND'}`)
  console.log(`  Passed Out 15th OTS   → ${passout15Grid   ? '✓' : '❌ NOT FOUND'}`)
  console.log(`  Deceased 15th OTS     → ${deceased15Grid  ? '✓' : '❌ NOT FOUND'}`)
  console.log(`  Subscriptions         → ${subscriptionGrid ? '✓' : '(not found, skipped)'}`)

  // ── Parse rows ───────────────────────────────────────────────
  const masterRows      = gridToRows(masterGrid      ?? [], 'Master Database')
  const deceased14Rows  = gridToRows(deceased14Grid  ?? [], 'Deceased 14th OTS')
  const passout15Rows   = gridToRows(passout15Grid   ?? [], 'Passed Out 15th OTS')
  const deceased15Rows  = gridToRows(deceased15Grid  ?? [], 'Deceased 15th OTS')
  const subscriptionRows = gridToRows(subscriptionGrid ?? [], 'Subscriptions')

  console.log('\nRaw row counts:')
  console.log(`  Master Database       → ${masterRows.length}   (expected 182)`)
  console.log(`  Deceased 14th OTS     → ${deceased14Rows.length}   (expected 21)`)
  console.log(`  Passed Out 15th OTS   → ${passout15Rows.length}    (expected 8)`)
  console.log(`  Deceased 15th OTS     → ${deceased15Rows.length}    (expected 5)`)

  // ── Build officer payloads ───────────────────────────────────
  const active14  = masterRows    .map((r, i) => buildActiveOfficer(r, '14_ots',       i + 1)).filter((x): x is OfficerSeedPayload => x !== null)
  const active15  = passout15Rows .map((r, i) => buildActiveOfficer(r, '15_ots_passout', i + 1)).filter((x): x is OfficerSeedPayload => x !== null)
  const deceased14 = deceased14Rows.map((r, i) => buildDeceasedOfficer(r, '14_ots',       i + 1)).filter((x): x is OfficerSeedPayload => x !== null)
  const deceased15 = deceased15Rows.map((r, i) => buildDeceasedOfficer(r, '15_ots_passout', i + 1)).filter((x): x is OfficerSeedPayload => x !== null)

  console.log('\nParsed officer counts:')
  console.log(`  Active 14th OTS       → ${active14.length}`)
  console.log(`  Active 15th OTS       → ${active15.length}`)
  console.log(`  Deceased 14th OTS     → ${deceased14.length}`)
  console.log(`  Deceased 15th OTS     → ${deceased15.length}`)

  // Deceased officers already in the master/passout list just need their
  // status updated. Deceased-only officers (not in master) get inserted fresh.
  const activePaNumbers = new Set([...active14, ...active15].map((o) => o.pa_no))
  const deceasedNewOnly = [...deceased14, ...deceased15].filter((o) => !activePaNumbers.has(o.pa_no))

  console.log(`  Deceased-only (not in master/passout) → ${deceasedNewOnly.length}`)

  const payload: OfficerSeedPayload[] = [...active14, ...active15, ...deceasedNewOnly]

  if (payload.length === 0) {
    throw new Error('No officers parsed — check the CSV structure.')
  }

  // ── Upsert officers ──────────────────────────────────────────
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { error: upsertError } = await supabase.from('officers').upsert(payload, { onConflict: 'pa_no' })
  if (upsertError) throw new Error(`Failed to upsert officers: ${upsertError.message}`)

  // ── Fetch DB officers for ID resolution ──────────────────────
  const { data: dbData, error: dbError } = await supabase.from('officers').select('id,pa_no,name')
  if (dbError) throw new Error(`Failed to fetch officers: ${dbError.message}`)

  const dbOfficers = (dbData ?? []) as DbOfficer[]
  const byPaNo = new Map(dbOfficers.map((o) => [o.pa_no, o.id]))

  // ── Mark deceased by PA number, fall back to canonical name ──
  const allDeceased = [...deceased14, ...deceased15]
  const deceasedCanonicalNames = new Set(allDeceased.map((o) => canonicalName(o.name)))

  const deceasedIds = Array.from(new Set([
    ...allDeceased.map((o) => byPaNo.get(o.pa_no)).filter((id): id is string => Boolean(id)),
    ...dbOfficers.filter((o) => deceasedCanonicalNames.has(canonicalName(o.name))).map((o) => o.id),
  ]))

  if (deceasedIds.length > 0) {
    const { error: statusError } = await supabase.from('officers').update({ status: 'deceased' }).in('id', deceasedIds)
    if (statusError) throw new Error(`Failed to update deceased status: ${statusError.message}`)
  }

  console.log(`\nDeceased status applied to ${deceasedIds.length} officer(s).`)

  // ── Upsert subscriptions ─────────────────────────────────────
  if (subscriptionRows.length > 0) {
    const subscriptions: Array<{
      officer_id: string; year: number; amount: number | null
      status: 'paid' | 'unpaid' | 'pending'; remarks: string | null
    }> = []

    for (const row of subscriptionRows) {
      const paNo = toNullable(row['pa pss no'])
      if (!paNo) continue
      const officerId = byPaNo.get(paNo)
      if (!officerId) continue

      for (const [key, rawValue] of Object.entries(row)) {
        const year = Number(key.trim())
        if (!Number.isInteger(year) || year < 1980 || year > 2100) continue
        const numericAmount = Number(toStr(rawValue).replace(/[^\d.]/g, ''))
        subscriptions.push({
          officer_id: officerId,
          year,
          amount: numericAmount > 0 ? numericAmount : null,
          status: parsePossibleStatus(toStr(rawValue)),
          remarks: toNullable(row['remarks']),
        })
      }
    }

    if (subscriptions.length > 0) {
      const { error: subError } = await supabase.from('subscriptions').upsert(subscriptions, { onConflict: 'officer_id,year' })
      if (subError) throw new Error(`Failed to upsert subscriptions: ${subError.message}`)
      console.log(`Upserted ${subscriptions.length} subscription record(s).`)
    }
  }

  console.log(`\n✓ Seed complete.`)
  console.log(`  Total upserted: ${payload.length} officers`)
  console.log(`  Marked deceased: ${deceasedIds.length}`)
  console.log(`  Expected totals → Active: ${182 + 8 - (21 + 5)}, Deceased: ${21 + 5}`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
