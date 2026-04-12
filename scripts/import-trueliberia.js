#!/usr/bin/env node
/**
 * TrueLiberia Full Market Intelligence — Import Script
 *
 * Reads TrueLiberia_Full_Market_Intelligence.xlsx, deduplicates against
 * existing merchant data files, scores each business, and outputs:
 *   - data/merchants-c-trueliberia.ts   (net-new Merchant[] array)
 *   - reports/trueliberia-import-report.json  (dedup audit log)
 *
 * Run: node scripts/import-trueliberia.js
 */

const xlsx = require('xlsx')
const fs = require('fs')
const path = require('path')

// ─── Config ───────────────────────────────────────────────────────────────────
const XLSX_PATH = 'C:/Users/jsupu/OneDrive/Documents/Business Ideas/LeenqUp/Research/TrueLiberia_Full_Market_Intelligence.xlsx'
const EXISTING_MERCHANT_FILES = [
  'data/merchants-a1.ts',
  'data/merchants-a2.ts',
  'data/merchants-a3.ts',
  'data/merchants-b-diaspora.ts',
  'data/merchants.ts',
]
const OUTPUT_TS = 'data/merchants-c-trueliberia.ts'
const OUTPUT_REPORT = 'reports/trueliberia-import-report.json'

// ─── Category Mapper ──────────────────────────────────────────────────────────
const CATEGORY_MAP = {
  'Shopping':           { category: 'Retail & Market',            subcategory: 'General Retail & Shops' },
  'Restaurants':        { category: 'Restaurants & Dining',       subcategory: 'Restaurant & Dining' },
  'Hotels & Resorts':   { category: 'Hotels & Hospitality',       subcategory: 'Hotel & Guest House' },
  'Others':             { category: 'Other Services',             subcategory: 'General Services' },
  'Beauty & Spa':       { category: 'Beauty & Wellness',          subcategory: 'Spa & Beauty Salon' },
  'Nightclubs & Bars':  { category: 'Nightlife & Entertainment',  subcategory: 'Nightclub & Bar' },
  'Beaches & Outdoors': { category: 'Tourism & Recreation',       subcategory: 'Outdoor & Recreation' },
  'Gym & Fitness':      { category: 'Health & Fitness',           subcategory: 'Gym & Fitness Center' },
}

// ─── Phone Normalizer ─────────────────────────────────────────────────────────
/**
 * Normalize a raw Liberian phone string to E.164-like format +231XXXXXXXXX
 * Handles: dual numbers (split on / or "or"), spaces, hyphens, international prefix
 * Returns { primary, secondary } — each null if unparseable
 */
function normalizeLiberianPhone(raw) {
  if (!raw) return { primary: null, secondary: null }

  const str = String(raw).trim()

  // Split on common dual-number separators
  const parts = str.split(/\/| or |,/).map(s => s.trim()).filter(Boolean)

  const normalizeOne = (s) => {
    // Remove spaces, hyphens, parentheses — keep digits and leading +
    const hasPlus = s.startsWith('+')
    const digits = s.replace(/\D/g, '')

    if (!digits) return null

    // Already has country code 231
    if (digits.startsWith('231') && digits.length >= 11) {
      return '+' + digits.slice(0, 12) // +231XXXXXXXXX (9 digits after 231)
    }

    // International format starting with +231
    if (hasPlus && digits.startsWith('231')) {
      return '+' + digits.slice(0, 12)
    }

    // Local format: starts with 0 (0XXXXXXXXX — 10 digits)
    if (digits.startsWith('0') && digits.length === 10) {
      return '+231' + digits.slice(1) // drop leading 0
    }

    // Local without leading 0: 9 digits starting with 77/88/55
    if (digits.length === 9 && (digits.startsWith('77') || digits.startsWith('88') || digits.startsWith('55'))) {
      return '+231' + digits
    }

    // 10 digit starting with 77/88 (missing leading 0)
    if (digits.length === 10 && (digits.startsWith('077') || digits.startsWith('088') || digits.startsWith('055'))) {
      return '+231' + digits.slice(1)
    }

    // Fallback: if 10+ digits, try to extract
    if (digits.length >= 9) {
      // Try last 9 digits
      const last9 = digits.slice(-9)
      if (last9.startsWith('77') || last9.startsWith('88') || last9.startsWith('55')) {
        return '+231' + last9
      }
    }

    return null
  }

  const primary = normalizeOne(parts[0])
  const secondary = parts.length > 1 ? normalizeOne(parts[1]) : null

  return { primary, secondary }
}

// ─── Name Normalizer ──────────────────────────────────────────────────────────
const STOPWORDS = new Set(['the','and','of','&','ltd','llc','co','inc','restaurant','bar','hotel',
  'shop','store','boutique','center','centre','enterprise','services','business','group','international'])

function normalizeNameTokens(name) {
  return new Set(
    name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !STOPWORDS.has(t))
  )
}

function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  if (union.size === 0) return 0
  return intersection.size / union.size
}

// ─── Domain Extractor ─────────────────────────────────────────────────────────
function extractDomain(url) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

// ─── City Extractor from Address ──────────────────────────────────────────────
const LIBERIA_CITIES = ['monrovia', 'paynesville', 'gbarnga', 'buchanan', 'kakata', 'voinjama',
  'zwedru', 'harper', 'robertsport', 'sanniquellie', 'tubmanburg', 'barclayville']

function extractCity(address, county) {
  if (!address) return county === 'Montserrado' ? 'Monrovia' : (county || 'Monrovia')
  const lower = address.toLowerCase()
  for (const city of LIBERIA_CITIES) {
    if (lower.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1)
  }
  // Try to extract last meaningful part
  const parts = address.split(',').map(s => s.trim())
  if (parts.length >= 2) return parts[parts.length - 1]
  return county === 'Montserrado' ? 'Monrovia' : (county || 'Monrovia')
}

// ─── Digital Presence Scorer ──────────────────────────────────────────────────
function scoreDigitalPresence(row) {
  const hasWebsite = !!(row['Website'] && row['Website'].trim())
  const hasFacebook = !!(row['Facebook'] && row['Facebook'].trim())
  const hasInstagram = !!(row['Instagram'] && row['Instagram'].trim())
  const hasEmail = !!(row['Email'] && row['Email'].trim())

  if (hasWebsite || (hasFacebook && hasInstagram)) return 'yes'
  if (hasFacebook || hasEmail) return 'partial'
  return 'none'
}

// ─── Priority Scorer ──────────────────────────────────────────────────────────
function scorePriority(row) {
  let score = 0
  const verified = row['Verified'] === 'Verified'
  const hasEmail = !!(row['Email'] && row['Email'].trim())
  const hasWebsite = !!(row['Website'] && row['Website'].trim())
  const hasFacebook = !!(row['Facebook'] && row['Facebook'].trim())
  const hasInstagram = !!(row['Instagram'] && row['Instagram'].trim())
  const category = row['Category']

  if (verified) score += 3
  if (hasEmail) score += 2
  if (hasWebsite) score += 2
  if (hasFacebook) score += 1
  if (hasInstagram) score += 1
  if (category === 'Hotels & Resorts') score += 1
  if (category === 'Shopping') score += 1

  if (score >= 8) return { tier: 1, priority: 'high' }
  if (score >= 4) return { tier: 2, priority: 'medium' }
  return { tier: 3, priority: 'low' }
}

// ─── Tag Builder ──────────────────────────────────────────────────────────────
function buildTags(row) {
  const tags = ['trueliberia-import']

  if (row['Verified'] === 'Verified') {
    tags.push('trueliberia-verified')
  } else {
    tags.push('trueliberia-unverified')
  }

  // County tag
  const county = row['County']
  if (county && county !== 'Liberia') {
    tags.push(county.toLowerCase().replace(/\s+/g, '-'))
  } else {
    tags.push('montserrado')
  }

  // Category tags
  const cat = row['Category']
  if (cat === 'Hotels & Resorts') tags.push('hospitality', 'hotel')
  if (cat === 'Restaurants') tags.push('food', 'restaurant')
  if (cat === 'Shopping') tags.push('retail', 'shopping')
  if (cat === 'Beauty & Spa') tags.push('beauty', 'spa')
  if (cat === 'Nightclubs & Bars') tags.push('nightlife')
  if (cat === 'Beaches & Outdoors') tags.push('tourism', 'outdoors')
  if (cat === 'Gym & Fitness') tags.push('fitness', 'health')

  // Contact tags
  if (row['Website']) tags.push('has-website')
  if (row['Email']) tags.push('has-email')
  if (row['Facebook']) tags.push('has-facebook')
  if (row['Instagram']) tags.push('has-instagram')

  return tags
}

// ─── Load Existing Merchants (from TS source files) ───────────────────────────
function extractExistingMerchantData() {
  const phones = new Set()    // normalized phones
  const names = new Set()     // lowercased names
  const domains = new Set()   // website domains
  const ids = new Set()       // existing IDs

  for (const filePath of EXISTING_MERCHANT_FILES) {
    if (!fs.existsSync(filePath)) continue
    const src = fs.readFileSync(filePath, 'utf-8')

    // Extract IDs
    const idMatches = src.matchAll(/id:\s*['"`]([^'"`]+)['"`]/g)
    for (const m of idMatches) ids.add(m[1])

    // Extract names
    const nameMatches = src.matchAll(/name:\s*['"`]([^'"`]+)['"`]/g)
    for (const m of nameMatches) names.add(m[1].toLowerCase().trim())

    // Extract phones
    const phoneFields = src.matchAll(/(?:whatsapp|phone):\s*['"`]([^'"`]+)['"`]/g)
    for (const m of phoneFields) {
      const { primary, secondary } = normalizeLiberianPhone(m[1])
      if (primary) phones.add(primary)
      if (secondary) phones.add(secondary)
    }

    // Extract websites/domains
    const websiteMatches = src.matchAll(/website:\s*['"`]([^'"`]+)['"`]/g)
    for (const m of websiteMatches) {
      const domain = extractDomain(m[1])
      if (domain) domains.add(domain)
    }
  }

  return { phones, names, domains, ids }
}

// ─── Dedup Check ──────────────────────────────────────────────────────────────
function checkDuplicate(row, existing) {
  const { phones: existingPhones, names: existingNames, domains: existingDomains } = existing

  // Step 1: Phone match
  const { primary, secondary } = normalizeLiberianPhone(String(row['Phone'] || ''))
  if (primary && existingPhones.has(primary)) return { isDuplicate: true, method: 'phone', value: primary }
  if (secondary && existingPhones.has(secondary)) return { isDuplicate: true, method: 'phone', value: secondary }

  // Step 2: Exact name match
  const name = String(row['Business Name'] || '').toLowerCase().trim()
  if (existingNames.has(name)) return { isDuplicate: true, method: 'exact-name', value: name }

  // Step 3: Fuzzy name match (Jaccard > 0.75 — strict threshold)
  const rowTokens = normalizeNameTokens(name)
  if (rowTokens.size >= 2) {
    for (const existingName of existingNames) {
      const existingTokens = normalizeNameTokens(existingName)
      if (existingTokens.size >= 2) {
        const sim = jaccardSimilarity(rowTokens, existingTokens)
        if (sim > 0.75) return { isDuplicate: true, method: 'fuzzy-name', value: `"${name}" ~ "${existingName}" (${(sim*100).toFixed(0)}%)` }
      }
    }
  }

  // Step 4: Website domain match
  const website = String(row['Website'] || '')
  if (website) {
    const domain = extractDomain(website)
    if (domain && existingDomains.has(domain)) return { isDuplicate: true, method: 'website-domain', value: domain }
  }

  return { isDuplicate: false, method: null, value: null }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('📦 TrueLiberia Full Market Intelligence Import')
  console.log('='.repeat(50))

  // Load Excel
  console.log('\n🔍 Loading Excel file...')
  const wb = xlsx.readFile(XLSX_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawData = xlsx.utils.sheet_to_json(ws)
  console.log(`   Found ${rawData.length} businesses in "${wb.SheetNames[0]}"`)

  // Load existing merchant data
  console.log('\n🔍 Scanning existing merchant files...')
  const existing = extractExistingMerchantData()
  console.log(`   Existing phones:  ${existing.phones.size}`)
  console.log(`   Existing names:   ${existing.names.size}`)
  console.log(`   Existing domains: ${existing.domains.size}`)
  console.log(`   Existing IDs:     ${existing.ids.size}`)

  // Process each row
  console.log('\n⚙️  Processing and deduplicating...')
  const newMerchants = []
  const duplicates = []
  const byCategory = {}
  const byTier = { 1: 0, 2: 0, 3: 0 }
  const byCounty = {}
  let withPhone = 0, withEmail = 0, withWebsite = 0

  for (const row of rawData) {
    const num = String(row['No.'] || '').padStart(3, '0')
    const name = String(row['Business Name'] || '').trim()
    const category = String(row['Category'] || 'Others')

    // Count stats
    byCategory[category] = (byCategory[category] || 0) + 1
    const county = row['County'] || 'Liberia'
    byCounty[county] = (byCounty[county] || 0) + 1

    // Dedup check
    const dupResult = checkDuplicate(row, existing)
    if (dupResult.isDuplicate) {
      duplicates.push({
        no: row['No.'],
        name,
        method: dupResult.method,
        value: dupResult.value,
      })
      continue
    }

    // Map category
    const mapped = CATEGORY_MAP[category] || { category: 'Other Services', subcategory: 'General Services' }

    // Normalize phone
    const phones = normalizeLiberianPhone(String(row['Phone'] || ''))
    if (phones.primary) withPhone++

    // Score priority
    const { tier, priority } = scorePriority(row)
    byTier[tier]++

    if (row['Email']) withEmail++
    if (row['Website']) withWebsite++

    // Build the new Merchant
    const resolvedCounty = (county === 'Liberia') ? 'Montserrado' : county
    const city = extractCity(String(row['Address'] || ''), resolvedCounty)
    const verified = row['Verified'] === 'Verified'

    const merchant = {
      id: `mer_tl_${num}`,
      intelligenceId: `C-TL-${num}`,
      name,
      segment: 'liberia',
      category: mapped.category,
      subcategory: mapped.subcategory,
      city,
      county: resolvedCounty,
      country: 'Liberia',
      operatingStatus: verified ? 'active' : 'appears-active',
      digitalPresence: scoreDigitalPresence(row),
      whatsapp: phones.primary || undefined,
      phone: phones.secondary || undefined,
      email: row['Email'] || undefined,
      website: row['Website'] || undefined,
      facebook: row['Facebook'] || undefined,
      instagram: row['Instagram'] || undefined,
      address: row['Address'] || undefined,
      trueliberiaUrl: row['TrueLiberia URL'] || undefined,
      notes: `TrueLiberia import. Original category: ${category}. ${verified ? 'Verified listing.' : 'Unverified listing.'}`,
      outreachStatus: 'not-contacted',
      tier,
      priority,
      maturityLevel: 'established',
      tags: buildTags(row),
      createdAt: new Date().toISOString(),
    }

    // Remove undefined values
    Object.keys(merchant).forEach(k => merchant[k] === undefined && delete merchant[k])

    newMerchants.push(merchant)

    // Add to existing phone/name sets to prevent self-dedup on subsequent rows
    if (phones.primary) existing.phones.add(phones.primary)
    if (phones.secondary) existing.phones.add(phones.secondary)
    existing.names.add(name.toLowerCase().trim())
    const domain = extractDomain(String(row['Website'] || ''))
    if (domain) existing.domains.add(domain)
  }

  // ─── Write TypeScript output ───────────────────────────────────────────────
  console.log('\n✍️  Writing output files...')

  const tsLines = [
    `// AUTO-GENERATED by scripts/import-trueliberia.js — do not hand-edit`,
    `// Source: TrueLiberia_Full_Market_Intelligence.xlsx (419 businesses)`,
    `// Generated: ${new Date().toISOString()}`,
    `// Net-new merchants: ${newMerchants.length} (${duplicates.length} duplicates excluded)`,
    `import type { Merchant } from '@/types'`,
    ``,
    `export const merchantsC: Merchant[] = [`,
  ]

  for (const m of newMerchants) {
    tsLines.push(`  {`)
    for (const [key, val] of Object.entries(m)) {
      if (Array.isArray(val)) {
        tsLines.push(`    ${key}: ${JSON.stringify(val)},`)
      } else if (typeof val === 'number') {
        tsLines.push(`    ${key}: ${val},`)
      } else if (typeof val === 'boolean') {
        tsLines.push(`    ${key}: ${val},`)
      } else {
        // String — escape backticks and backslashes
        const escaped = String(val).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
        tsLines.push(`    ${key}: \`${escaped}\`,`)
      }
    }
    tsLines.push(`  },`)
  }

  tsLines.push(`]`)
  tsLines.push(``)

  fs.writeFileSync(OUTPUT_TS, tsLines.join('\n'), 'utf-8')
  console.log(`   ✅ ${OUTPUT_TS} (${newMerchants.length} merchants)`)

  // ─── Write report ──────────────────────────────────────────────────────────
  const report = {
    generatedAt: new Date().toISOString(),
    source: 'TrueLiberia_Full_Market_Intelligence.xlsx',
    total: rawData.length,
    netNew: newMerchants.length,
    duplicatesExcluded: duplicates.length,
    withPhone,
    withEmail,
    withWebsite,
    byCategory,
    byTier,
    byCounty,
    duplicates,
  }

  fs.writeFileSync(OUTPUT_REPORT, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`   ✅ ${OUTPUT_REPORT}`)

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(50))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total in file:      ${rawData.length}`)
  console.log(`Duplicates found:   ${duplicates.length}`)
  console.log(`Net-new merchants:  ${newMerchants.length}`)
  console.log(`  With phone:       ${withPhone}`)
  console.log(`  With email:       ${withEmail}`)
  console.log(`  With website:     ${withWebsite}`)
  console.log(``)
  console.log('By Tier:')
  console.log(`  Tier 1 (high):    ${byTier[1]}`)
  console.log(`  Tier 2 (medium):  ${byTier[2]}`)
  console.log(`  Tier 3 (low):     ${byTier[3]}`)
  console.log(``)
  console.log('By Category (net-new):')
  const catCounts = {}
  for (const m of newMerchants) catCounts[m.category] = (catCounts[m.category] || 0) + 1
  for (const [cat, count] of Object.entries(catCounts).sort((a,b) => b[1]-a[1])) {
    console.log(`  ${cat}: ${count}`)
  }
  console.log(``)
  if (duplicates.length > 0) {
    console.log('Duplicates excluded (review reports/trueliberia-import-report.json):')
    duplicates.slice(0, 10).forEach(d => {
      console.log(`  [${d.method}] ${d.name}: ${d.value}`)
    })
    if (duplicates.length > 10) console.log(`  ... and ${duplicates.length - 10} more`)
  }
  console.log(`\n✅ Done! Next: add merchantsC to data/merchants.ts`)
}

main()
