// English soft hyphens (U+00AD): exception dictionary, then one prefix or suffix.
// Short words stay whole. A wrong break is worse than none, so the fallback cuts once.

const EXCEPTIONS = {
  perception: ["per", "cep", "tion"],
  supplies: ["sup", "plies"],
  material: ["ma", "te", "ri", "al"],
  identifies: ["iden", "ti", "fies"],
  contradiction: ["con", "tra", "dic", "tion"],
  evidence: ["ev", "i", "dence"],
  argument: ["ar", "gu", "ment"],
  production: ["pro", "duc", "tion"],
  applied: ["ap", "plied"],
  living: ["liv", "ing"],
  create: ["cre", "ate"],
  producer: ["pro", "duc", "er"],
  permission: ["per", "mis", "sion"],
  reality: ["re", "al", "i", "ty"],
  optional: ["op", "tion", "al"],
  contradict: ["con", "tra", "dict"],
  conditions: ["con", "di", "tions"],
  rational: ["ra", "tion", "al"],
  being: ["be", "ing"],
  ownership: ["own", "er", "ship"],
  recognized: ["rec", "og", "nized"],
  standard: ["stan", "dard"],
  purpose: ["pur", "pose"],
  choices: ["choic", "es"],
  because: ["be", "cause"],
  produced: ["pro", "duced"],
  happiness: ["hap", "pi", "ness"],
  succeeded: ["suc", "ceed", "ed"],
  anyone: ["any", "one"],
  objectivism: ["ob", "jec", "tiv", "ism"],
  person: ["per", "son"],
  accept: ["ac", "cept"],
  knowledge: ["knowl", "edge"],
  objective: ["ob", "jec", "tive"],
  request: ["re", "quest"],
  requirement: ["re", "quire", "ment"],
  requirements: ["re", "quire", "ments"],
  choosing: ["choos", "ing"],
  produce: ["pro", "duce"],
  people: ["peo", "ple"],
  relation: ["re", "la", "tion"],
  between: ["be", "tween"],
  respect: ["re", "spect"],
  substitute: ["sub", "sti", "tute"],
  without: ["with", "out"],
  feeling: ["feel", "ing"],
  method: ["meth", "od"],
  having: ["hav", "ing"],
  other: ["oth", "er"],
  others: ["oth", "ers"],
  under: ["un", "der"],
  value: ["val", "ue"],
}

const PREFIXES = ["inter", "trans", "under", "over", "counter", "contra", "extra", "super", "hyper", "anti", "auto", "fore", "semi", "mono", "multi", "non", "pre", "pro", "sub", "com", "con", "dis", "mis", "un", "re", "de", "ex", "in", "im", "en", "em"]
const SUFFIXES = ["tion", "sion", "ment", "ness", "able", "ible", "ious", "eous", "ative", "itive", "ical", "ally", "ing", "ous", "ful", "less", "ive", "ial", "ism", "ist", "ity", "ence", "ance", "ure", "ture", "ies", "ly", "ed", "er", "al"]

function piecesFor(bare) {
  const lower = bare.toLowerCase()
  if (lower.length < 6) return null
  const exc = EXCEPTIONS[lower]
  if (exc) return exc
  for (const prefix of PREFIXES) {
    if (lower.startsWith(prefix) && lower.length - prefix.length >= 3) {
      return [lower.slice(0, prefix.length), lower.slice(prefix.length)]
    }
  }
  for (const suffix of SUFFIXES) {
    if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
      const cut = lower.length - suffix.length
      return [lower.slice(0, cut), lower.slice(cut)]
    }
  }
  return null
}

function applyPieces(token, pieces) {
  let pos = 0
  const chunks = []
  for (const piece of pieces) {
    const next = token.slice(pos, pos + piece.length)
    if (next.toLowerCase() !== piece) return token
    chunks.push(next)
    pos += piece.length
  }
  if (pos < token.length) chunks[chunks.length - 1] += token.slice(pos)
  let out = chunks[0]
  let taken = chunks[0].length
  for (let i = 1; i < chunks.length; i++) {
    const rest = chunks.slice(i).join("").length
    if (taken >= 3 && rest >= 3) out += "\u00AD"
    out += chunks[i]
    taken += chunks[i].length
  }
  return out
}

export function hyphenate(text) {
  return text.replace(/[A-Za-z][A-Za-z'’]*/g, (token) => {
    const bare = token.replace(/['’]/g, "")
    const pieces = piecesFor(bare)
    if (!pieces || pieces.length < 2) return token
    return applyPieces(token, pieces)
  })
}
