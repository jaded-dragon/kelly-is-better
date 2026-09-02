const US_STATE_ABBR_TO_NAME: Record<string, string> = {
  al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
  co: 'Colorado', ct: 'Connecticut', de: 'Delaware', dc: 'District of Columbia',
  fl: 'Florida', ga: 'Georgia', hi: 'Hawaii', id: 'Idaho', il: 'Illinois',
  in: 'Indiana', ia: 'Iowa', ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana',
  me: 'Maine', md: 'Maryland', ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota',
  ms: 'Mississippi', mo: 'Missouri', mt: 'Montana', ne: 'Nebraska', nv: 'Nevada',
  nh: 'New Hampshire', nj: 'New Jersey', nm: 'New Mexico', ny: 'New York',
  nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio', ok: 'Oklahoma', or: 'Oregon',
  pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina', sd: 'South Dakota',
  tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont', va: 'Virginia',
  wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming',
  pr: 'Puerto Rico',
}

const US_STATE_NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_ABBR_TO_NAME).map(([abbr, name]) => [name.toLowerCase(), abbr.toUpperCase()])
)

// Common abbreviations in US place names (Mt Holly, St Louis, Ft Lee, Holmdel Twp, ...)
const PLACE_WORD_EXPANSIONS: Record<string, string> = {
  mt: 'Mount',
  mtn: 'Mountain',
  st: 'Saint',
  ste: 'Sainte',
  ft: 'Fort',
  twp: 'Township',
  hts: 'Heights',
  spgs: 'Springs',
  jct: 'Junction',
  cyn: 'Canyon',
}

const PLACE_WORD_ABBREVIATIONS: Record<string, string> = Object.fromEntries(
  Object.entries(PLACE_WORD_EXPANSIONS).map(([abbr, full]) => [full.toLowerCase(), abbr[0].toUpperCase() + abbr.slice(1)])
)

function replaceWords(query: string, dict: Record<string, string>): string | null {
  let changed = false
  const result = query.replace(/[A-Za-z]+/g, word => {
    const replacement = dict[word.toLowerCase()]
    if (!replacement) return word
    changed = true
    return word === word.toUpperCase() && word.length > 1 ? replacement.toUpperCase() : replacement
  })
  return changed ? result : null
}

// Matches the trailing state token/phrase as a whole word (or whole comma
// segment), never a substring of a longer word — e.g. "Missouri" must not be
// treated as ending in the state code "RI".
function swapTrailingState(query: string): string | null {
  const trimmed = query.trim()

  const parts = trimmed.split(',')
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim().toLowerCase()
    const fullFromAbbr = US_STATE_ABBR_TO_NAME[lastPart]
    if (fullFromAbbr) return [...parts.slice(0, -1), ' ' + fullFromAbbr].join(',')
    const abbrFromFull = US_STATE_NAME_TO_ABBR[lastPart]
    if (abbrFromFull) return [...parts.slice(0, -1), ' ' + abbrFromFull].join(',')
  }

  const words = trimmed.split(/\s+/)
  const lastWord = words[words.length - 1]?.toLowerCase()
  if (words.length > 1 && US_STATE_ABBR_TO_NAME[lastWord]) {
    return words.slice(0, -1).join(' ') + ', ' + US_STATE_ABBR_TO_NAME[lastWord]
  }
  for (const [name, abbr] of Object.entries(US_STATE_NAME_TO_ABBR)) {
    const nameWords = name.split(' ')
    if (words.length <= nameWords.length) continue
    const tail = words.slice(-nameWords.length).join(' ').toLowerCase()
    if (tail === name) return words.slice(0, -nameWords.length).join(' ') + ', ' + abbr
  }
  return null
}

/**
 * Generates alternate phrasings of a location query so abbreviated and
 * spelled-out forms (state codes, "Mt"/"Mount", "St"/"Saint", etc.) both work,
 * even on requests Nominatim's own normalization doesn't catch.
 */
export function generateQueryVariants(query: string, max = 3): string[] {
  const variants = new Set<string>()

  const stateSwapped = swapTrailingState(query)
  if (stateSwapped) variants.add(stateSwapped)

  const expanded = replaceWords(query, PLACE_WORD_EXPANSIONS)
  if (expanded) variants.add(expanded)

  const abbreviated = replaceWords(query, PLACE_WORD_ABBREVIATIONS)
  if (abbreviated) variants.add(abbreviated)

  if (stateSwapped) {
    const expandedAndStateSwapped = replaceWords(stateSwapped, PLACE_WORD_EXPANSIONS)
    if (expandedAndStateSwapped) variants.add(expandedAndStateSwapped)
  }

  variants.delete(query)
  return Array.from(variants).slice(0, max)
}
