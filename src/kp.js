// Knuth–Plass over Pretext segment widths.
// MarkFonts spacing: desired 0.85, preferred 0.75–1.1, hard floor 0.6 of a normal space.
// Letter tracking −0.02em to +0.04em. Glyph scale stays 100.
// Spaces move first; leftover goes to letter-spacing. The last line stays ragged at desired.

const SPACE_DESIRED = 0.85
const SPACE_MIN = 0.75
const SPACE_MAX = 1.1
const SPACE_FLOOR = 0.6
const RIVER = 1.5
const LETTER_MIN = -0.02
const LETTER_MAX = 0.04
const CONSECUTIVE_HYPHEN = 3000
const PENULTIMATE_HYPHEN = 2000
const HYPHEN_PENALTY = 50

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value))
}

function badnessOf(spaceRatio, letterEm, endsHyphen) {
  let bad = 1000 * Math.abs(spaceRatio) ** 3
  bad += 400 * Math.abs(letterEm / LETTER_MAX) ** 3
  if (spaceRatio + SPACE_DESIRED > RIVER) {
    const excess = spaceRatio + SPACE_DESIRED - RIVER
    bad += 5000 + excess * excess * 10000
  }
  if (SPACE_DESIRED + spaceRatio < SPACE_MIN) {
    const tight = SPACE_MIN - (SPACE_DESIRED + spaceRatio)
    bad += 3000 + tight * tight * 10000
  } else if (SPACE_DESIRED + spaceRatio > SPACE_MAX) {
    const loose = SPACE_DESIRED + spaceRatio - SPACE_MAX
    bad += 800 + loose * loose * 4000
  }
  if (endsHyphen) bad += HYPHEN_PENALTY
  return bad
}

// Fit one line. widths are at letter-spacing 0. charGaps is how many
// letter-spacing increments Canvas adds for the words on the line.
export function fitLine({ wordWidth, spaceCount, charGaps, measure, spaceWidth, fontSize, isLast, hyphenWidth }) {
  const desired = SPACE_DESIRED * spaceWidth
  const floor = SPACE_FLOOR * spaceWidth
  const preferredMin = SPACE_MIN * spaceWidth
  const preferredMax = SPACE_MAX * spaceWidth
  const letterMinPx = LETTER_MIN * fontSize
  const letterMaxPx = LETTER_MAX * fontSize
  const content = wordWidth + (hyphenWidth || 0)

  const pack = (space, letter) => ({
    space,
    letter,
    width: content + spaceCount * space + charGaps * letter,
  })

  if (isLast) {
    const natural = pack(desired, 0)
    if (natural.width <= measure + 0.4) {
      return { ...natural, ragged: true, feasible: true, badness: 0 }
    }
    let space = desired
    let letter = 0
    let over = natural.width - measure
    if (spaceCount > 0) {
      const take = Math.min(over, (desired - preferredMin) * spaceCount)
      space -= take / spaceCount
      over -= take
    }
    if (over > 0.4 && charGaps > 0) {
      const take = Math.min(over, -letterMinPx * charGaps)
      letter -= take / charGaps
      over -= take
    }
    if (over > 0.4 && spaceCount > 0) {
      const take = Math.min(over, (space - floor) * spaceCount)
      space -= take / spaceCount
      over -= take
    }
    const fitted = pack(space, letter)
    if (over > 0.6) return { ...fitted, ragged: true, feasible: false, badness: 1e7 }
    const ratio = (space - desired) / spaceWidth
    return { ...fitted, ragged: true, feasible: true, badness: badnessOf(ratio, letter / fontSize, false) }
  }

  let space = desired
  let letter = 0
  let slack = measure - pack(desired, 0).width

  if (spaceCount > 0 && slack !== 0) {
    const roomUp = (preferredMax - desired) * spaceCount
    const roomDown = (desired - preferredMin) * spaceCount
    const take = clamp(slack, -roomDown, roomUp)
    space += take / spaceCount
    slack -= take
  }
  if (charGaps > 0 && Math.abs(slack) > 0.05) {
    const roomUp = letterMaxPx * charGaps
    const roomDown = -letterMinPx * charGaps
    const take = clamp(slack, -roomDown, roomUp)
    letter += take / charGaps
    slack -= take
  }
  if (spaceCount > 0 && slack > 0.4) {
    space += slack / spaceCount
    slack = 0
  }
  if (spaceCount > 0 && slack < -0.4) {
    const next = space + slack / spaceCount
    if (next < floor - 0.05) {
      return { ...pack(floor, letter), ragged: false, feasible: false, badness: 1e7 }
    }
    space = Math.max(next, floor)
    slack = 0
  }
  if (spaceCount === 0 && slack < -0.6) {
    return { ...pack(desired, letter), ragged: false, feasible: false, badness: 1e7 }
  }

  const ratio = spaceCount > 0 ? (space - desired) / spaceWidth : (content - measure) / Math.max(spaceWidth, 1)
  const badness = spaceCount > 0 ? badnessOf(ratio, letter / fontSize, false) : Math.abs(slack) * 40 + 200
  return { ...pack(space, letter), ragged: false, feasible: slack > -0.6, badness }
}

function isSpace(kind) {
  return kind === "space" || kind === "preserved-space"
}

export function breakParagraph(prepared, measure, { spaceWidth, fontSize, hyphenWidth, gapsPerChar }) {
  const segs = prepared.segments
  const kinds = prepared.kinds
  const widths = prepared.widths
  const n = segs.length
  if (n === 0) return []

  const candidates = [{ index: 0, hyphen: false }]
  for (let i = 0; i < n; i++) {
    if (kinds[i] === "soft-hyphen" && i + 1 < n) candidates.push({ index: i + 1, hyphen: true })
    else if (isSpace(kinds[i]) && i + 1 < n) candidates.push({ index: i + 1, hyphen: false })
  }
  candidates.push({ index: n, hyphen: false })

  const last = candidates.length - 1
  const dp = Array.from({ length: candidates.length }, () => [Infinity, Infinity])
  const prev = Array.from({ length: candidates.length }, () => [-1, -1])
  dp[0][0] = 0

  function lineParts(from, to, endsHyphen) {
    let wordWidth = 0
    let spaceCount = 0
    let chars = 0
    const runs = []
    for (let i = from; i < to; i++) {
      if (kinds[i] === "soft-hyphen") continue
      if (isSpace(kinds[i])) {
        spaceCount += 1
        runs.push({ space: true })
      } else {
        wordWidth += widths[i]
        chars += [...segs[i]].length
        const prev = runs[runs.length - 1]
        if (prev && !prev.space) {
          prev.text += segs[i]
          prev.width += widths[i]
        } else {
          runs.push({ text: segs[i], width: widths[i] })
        }
      }
    }
    while (runs.length && runs[runs.length - 1].space) {
      runs.pop()
      spaceCount -= 1
    }
    while (runs.length && runs[0].space) runs.shift()
    if (endsHyphen) {
      chars += 1
      wordWidth += hyphenWidth
      const prev = runs[runs.length - 1]
      if (prev && !prev.space) {
        prev.text += "-"
        prev.width += hyphenWidth
      } else {
        runs.push({ text: "-", width: hyphenWidth })
      }
    }
    return { wordWidth, spaceCount, chars, runs }
  }

  for (let j = 1; j <= last; j++) {
    const isLast = j === last
    for (let i = j - 1; i >= 0; i--) {
      const from = candidates[i].index
      const to = candidates[j].index
      const endsHyphen = candidates[j].hyphen
      const parts = lineParts(from, to, endsHyphen && !isLast)
      const gaps = Math.max(0, Math.round(parts.chars * gapsPerChar))
      const fit = fitLine({
        wordWidth: parts.wordWidth,
        spaceCount: parts.spaceCount,
        charGaps: gaps,
        measure,
        spaceWidth,
        fontSize,
        isLast,
        hyphenWidth: 0,
      })
      if (!Number.isFinite(fit.badness)) continue
      for (let h = 0; h < 2; h++) {
        if (dp[i][h] === Infinity) continue
        let cost = dp[i][h] + fit.badness
        if (h === 1 && endsHyphen && !isLast) cost += CONSECUTIVE_HYPHEN
        if (isLast && h === 1) cost += PENULTIMATE_HYPHEN
        const flag = endsHyphen && !isLast ? 1 : 0
        if (cost < dp[j][flag]) {
          dp[j][flag] = cost
          prev[j][flag] = i * 2 + h
        }
      }
      const natural = parts.wordWidth + parts.spaceCount * spaceWidth
      if (natural > measure * 2.4 && i < j - 1) break
    }
  }

  let flag = dp[last][0] <= dp[last][1] ? 0 : 1
  if (dp[last][flag] === Infinity) return null

  const chosen = []
  let j = last
  while (j > 0) {
    const packed = prev[j][flag]
    if (packed < 0) return null
    const i = packed >> 1
    chosen.push(j)
    flag = packed & 1
    j = i
  }
  chosen.reverse()

  const lines = []
  let fromCandidate = 0
  for (const toCandidate of chosen) {
    const from = candidates[fromCandidate].index
    const to = candidates[toCandidate].index
    const isLast = toCandidate === last
    const endsHyphen = candidates[toCandidate].hyphen && !isLast
    const parts = lineParts(from, to, endsHyphen)
    const gaps = Math.max(0, Math.round(parts.chars * gapsPerChar))
    const fit = fitLine({
      wordWidth: parts.wordWidth,
      spaceCount: parts.spaceCount,
      charGaps: gaps,
      measure,
      spaceWidth,
      fontSize,
      isLast,
      hyphenWidth: 0,
    })
    lines.push({
      runs: parts.runs,
      space: fit.space,
      letter: fit.letter,
      ragged: isLast || parts.spaceCount === 0,
      hyphen: endsHyphen,
    })
    fromCandidate = toCandidate
  }
  return lines
}
