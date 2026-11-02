import { prepareWithSegments } from "@chenglou/pretext"
import { hyphenate } from "./hyphenate.js"
import { breakParagraph } from "./kp.js"

const MEASURE_CAP = 760
const NARROW = 520

function fontString(size) {
  return `400 ${size}px "Geist Serif"`
}

function metricsFor(ctx, size) {
  const font = fontString(size)
  ctx.font = font
  ctx.letterSpacing = "0px"
  const space = ctx.measureText(" ").width
  const hyphen = ctx.measureText("-").width
  const plain = ctx.measureText("ABC").width
  ctx.letterSpacing = "1px"
  const tracked = ctx.measureText("ABC").width
  ctx.letterSpacing = "0px"
  return { font, space, hyphen, gapsPerChar: (tracked - plain) / 3 }
}

function paint(el, source, lines) {
  const sr = document.createElement("span")
  sr.className = "sr-only"
  sr.textContent = source

  const set = document.createElement("span")
  set.className = "set"
  set.setAttribute("aria-hidden", "true")

  for (const line of lines) {
    const row = document.createElement("span")
    row.className = "line"
    const justify = !line.ragged && line.runs.some((run) => !run.space)
    const textRuns = line.runs.filter((run) => !run.space)
    textRuns.forEach((run, index) => {
      if (index > 0) {
        const gap = document.createElement("span")
        gap.className = "sp"
        gap.style.width = `${line.space}px`
        gap.textContent = " "
        row.append(gap)
      }
      const word = document.createElement("span")
      word.className = "run"
      if (justify && index === textRuns.length - 1) word.classList.add("end")
      if (Math.abs(line.letter) > 0.01) word.style.letterSpacing = `${line.letter}px`
      word.textContent = run.text
      row.append(word)
    })
    set.append(row)
  }

  el.replaceChildren(sr, set)
}

function typesetOne(el, ctx) {
  const source = el.dataset.source
  const width = el.clientWidth
  if (width < 40) return
  const measure = Math.min(width, MEASURE_CAP)
  const key = String(Math.round(measure))
  if (el.dataset.measure === key && el.querySelector(".line")) return
  const narrow = measure < NARROW
  const size = narrow ? 18 : 20
  const leading = narrow ? 28 : 32
  el.style.setProperty("--size", `${size}px`)
  el.style.setProperty("--leading", `${leading}px`)

  const metrics = metricsFor(ctx, size)
  const prepared = prepareWithSegments(hyphenate(source), metrics.font, { letterSpacing: 0 })
  const lines = breakParagraph(prepared, measure, {
    spaceWidth: metrics.space,
    fontSize: size,
    hyphenWidth: metrics.hyphen,
    gapsPerChar: metrics.gapsPerChar,
  })
  if (!lines || lines.length === 0) return
  paint(el, source, lines)
  el.dataset.measure = String(Math.round(measure))
}

async function start() {
  await document.fonts.load('400 20px "Geist Serif"')
  await document.fonts.load('400 18px "Geist Serif"')
  await document.fonts.ready

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const paras = [...document.querySelectorAll(".para")]
  for (const el of paras) {
    if (!el.dataset.source) el.dataset.source = el.textContent.replace(/\s+/g, " ").trim()
  }

  const layout = () => {
    for (const el of paras) typesetOne(el, ctx)
  }
  layout()

  const observer = new ResizeObserver(() => layout())
  for (const el of paras) observer.observe(el)
}

start()
