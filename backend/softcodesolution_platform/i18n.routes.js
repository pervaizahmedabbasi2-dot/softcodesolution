import express from 'express';

import fs from 'fs';
import path from 'path';

const LANG_MAP = {
  en: 'en',
  ur: 'ur',
  sd: 'sd',
  pa: 'pa-Arab',
  ps: 'ps',
  skr: 'skr',
  bal: 'bal',
  ks: 'ks',
  ar: 'ar',
  fa: 'fa',
  hi: 'hi',
  bn: 'bn',
  ne: 'ne',
  si: 'si',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  th: 'th',
  vi: 'vi',
  ms: 'ms',
  id: 'id',
  tl: 'tl',
  my: 'my',
  km: 'km',
  lo: 'lo',
  dv: 'dv',
  tr: 'tr',
  az: 'az',
  uz: 'uz',
  kk: 'kk',
  tg: 'tg',
  ky: 'ky',
  tk: 'tk',
  ka: 'ka',
  hy: 'hy',
  mn: 'mn',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  nl: 'nl',
  pl: 'pl',
  ru: 'ru',
  uk: 'uk',
  be: 'be',
  bg: 'bg',
  sr: 'sr',
  hr: 'hr',
  bs: 'bs',
  mk: 'mk',
  sl: 'sl',
  sk: 'sk',
  cs: 'cs',
  ro: 'ro',
  hu: 'hu',
  sv: 'sv',
  no: 'no',
  da: 'da',
  fi: 'fi',
  is: 'is',
  el: 'el',
  he: 'he',
  lt: 'lt',
  lv: 'lv',
  et: 'et',
  sq: 'sq',
  mt: 'mt',
  ga: 'ga',
  sw: 'sw',
  am: 'am',
  so: 'so',
  mg: 'mg',
  rw: 'rw'
};

const CURATED_GLOSSARY = {
  skr: {
    'Home': 'گھر',
    'Solutions': 'سافٹ ویئر حل',
    'Technology': 'ٹیکنالوجی',
    'How It Works': 'اے کیویں کم کریندے',
    'Store': 'پریمیم اسٹور',
    'About': 'اساݙے بارے وچ',
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کرو',
    'Sign In': 'سائن ان',
    'Create Account': 'اکاؤنٹ بݨاؤ',
    'Deploy Now': 'ہݨ شروع کرو',
    'Explore Store': 'اسٹور ݙیکھو',
    'Technical Support': 'تکنیکی مدد',
    'Submit Ticket': 'ٹکٹ جمع کراؤ',
    'Live Chat': 'لائیو چیٹ',
    'Track Ticket': 'ٹکٹ ٹریک کرو',
    'Enterprise Support': 'انٹرپرائز سپورٹ',
    'Done': 'مکمل',
    'Normal': 'عام',
    'High': 'اہم',
    'Urgent': 'فوری'
  },
  ks: {
    'Home': 'گھر',
    'Solutions': 'سافٹ ویئر حل',
    'Technology': 'ٹیکنالوجی',
    'How It Works': 'یہِ کِتھ کٔنہِ چُھ کٲم کَران',
    'Store': 'پریمیم اسٹور',
    'About': 'اسہِ متعلق',
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کٔرِو',
    'Sign In': 'سائن ان',
    'Create Account': 'اکاؤنٹ بناوِو',
    'Deploy Now': 'وونہِ شُروع کٔرِو',
    'Explore Store': 'اسٹور وُچھِو',
    'Technical Support': 'تکنیکی مدد',
    'Submit Ticket': 'ٹکٹ جمع کٔرِو',
    'Live Chat': 'لائیو چیٹ',
    'Track Ticket': 'ٹکٹ ٹریک کٔرِو',
    'Enterprise Support': 'انٹرپرائز سپورٹ',
    'Done': 'مکمل',
    'Normal': 'عام',
    'High': 'اہم',
    'Urgent': 'فوری'
  }
};

const MINT_LANG_MAP = {
  ur: 'ur',
  sd: 'sd',
  ps: 'ps',
  skr: 'skr',
  ks: 'ks',
  ar: 'ar',
  fa: 'fa',
  hi: 'hi',
  bn: 'bn',
  ne: 'ne',
  si: 'si',
  zh: 'zh',
  ja: 'ja',
  ko: 'ko',
  th: 'th',
  vi: 'vi',
  ms: 'ms',
  id: 'id',
  tl: 'tl',
  my: 'my',
  km: 'km',
  lo: 'lo',
  tr: 'tr',
  az: 'az',
  uz: 'uz',
  kk: 'kk',
  tg: 'tg',
  ky: 'ky',
  tk: 'tk',
  ka: 'ka',
  hy: 'hy',
  mn: 'mn',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  nl: 'nl',
  pl: 'pl',
  ru: 'ru',
  uk: 'uk',
  be: 'be',
  bg: 'bg',
  sr: 'sr',
  hr: 'hr',
  bs: 'bs',
  mk: 'mk',
  sl: 'sl',
  sk: 'sk',
  cs: 'cs',
  ro: 'ro',
  hu: 'hu',
  sv: 'sv',
  no: 'nb',
  da: 'da',
  fi: 'fi',
  is: 'is',
  el: 'el',
  he: 'he',
  lt: 'lt',
  lv: 'lv',
  et: 'et',
  sq: 'sq',
  mt: 'mt',
  ga: 'ga',
  sw: 'sw',
  am: 'am',
  so: 'so',
  mg: 'mg',
  rw: 'rw'
};

const NON_LATIN_LANGS = new Set([
  'ur', 'sd', 'pa', 'ps', 'skr', 'bal', 'ks', 'ar', 'fa',
  'hi', 'bn', 'ne', 'si', 'zh', 'ja', 'ko', 'th', 'my', 'km', 'lo', 'dv',
  'ru', 'uk', 'kk', 'tg', 'ky', 'ka', 'hy', 'mn', 'bg', 'sr', 'be', 'mk',
  'el', 'he', 'am'
]);

const STRICT_REGIONAL_LANGS = new Set(['skr', 'ks']);

function shouldPreferSecondaryEngine(lang, orig, candidate) {
  const tr = String(candidate || '').trim();
  if (!tr) return true;
  if (orig.includes(' ') && tr.toLowerCase() === orig.trim().toLowerCase()) return true;
  if (NON_LATIN_LANGS.has(lang) && /^[A-Za-z0-9\s.,!?:;'"/+&\-()]+$/.test(tr) && /[A-Za-z]{4,}/.test(tr)) {
    return true;
  }
  return false;
}

function loadBaselineOfflinePacks() {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'frontend/public/i18n-core-packs.json'),
      path.resolve(process.cwd(), '../frontend/public/i18n-core-packs.json')
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const packs = parsed?.packs && typeof parsed.packs === 'object' ? parsed.packs : parsed;
        if (packs && typeof packs === 'object') return packs;
      }
    }
  } catch {}
  return {};
}

const SEP_RAW = '\n[[998877]]\n';
const SEP_REGEX = /\s*\[+\s*998877\s*\]+\s*/g;

function normalizeSource(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function maskBrandTokens(text) {
  return String(text || '')
    .replace(/SoftCodeSolution/g, 'SCSBRAND01')
    .replace(/SoftCode Solution/g, 'SCSBRAND02')
    .replace(/\bSoftCode\b/g, 'SCSBRAND03');
}

function maskBrandTokensNumeric(text) {
  return String(text || '')
    .replace(/SoftCodeSolution/g, '998101')
    .replace(/SoftCode Solution/g, '998102')
    .replace(/\bSoftCode\b/g, '998103');
}

function normalizeIndicDigits(str) {
  return str
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function unmaskBrandTokens(text) {
  const normalized = String(text || '').replace(/[٠-٩۰-۹]{6}/g, (m) => normalizeIndicDigits(m));
  return normalized
    .replace(/SCS\s*BRAND\s*0?1|998101/gi, 'SoftCodeSolution')
    .replace(/SCS\s*BRAND\s*0?2|998102/gi, 'SoftCode Solution')
    .replace(/SCS\s*BRAND\s*0?3|998103/gi, 'SoftCode');
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescapeHtml(text) {
  return String(text || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function isCleanRegionalTranslation(orig, translated) {
  const tr = String(translated || '').trim();
  if (!tr) return false;
  // Reject hallucinated phone/numeric artifacts added when source had no digits
  if (!/\d/.test(orig) && /\d/.test(tr)) return false;
  // Reject leftover mask tokens or MinT placeholder artifacts
  if (/SCS\s*BRAND|SBRAND|SXXXX|99810[123]/i.test(tr)) return false;
  // Reject known Wikimedia NLLB short-phrase hallucinations absent from source
  if (/(Connor\s*O'?Brien|Pranab\s+Mukherjee)/i.test(tr) && !/(Connor|Mukherjee)/i.test(orig)) return false;
  if (/\bPresident\b/i.test(tr) && !/\bPresident\b/i.test(orig)) return false;
  // Reject runaway generation bloat
  if (tr.length > Math.max(orig.length * 4.5, orig.length + 80)) return false;
  return true;
}

async function fetchMinTBatch(items, mintLangCode, attempt = 0, useMask = true) {
  const html = `<div>${items.map((s) => `<p>${escapeHtml(useMask ? maskBrandTokens(s) : s)}</p>`).join('')}</div>`;
  try {
    const res = await fetch(`https://cxserver.wikimedia.org/v2/translate/en/${encodeURIComponent(mintLangCode)}/MinT`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SoftCodeSolution-Platform/1.0'
      },
      body: JSON.stringify({ html }),
      signal: AbortSignal.timeout(5500)
    });
    if (!res.ok) {
      throw new Error(`MinT HTTP ${res.status}`);
    }
    const data = await res.json();
    const contents = String(data?.contents || '');
    const parts = [...contents.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
      unmaskBrandTokens(unescapeHtml(m[1]).trim())
    );
    return parts;
  } catch (err) {
    if (attempt < 1 && items.length > 1) {
      await new Promise((r) => setTimeout(r, 180));
      return fetchMinTBatch(items, mintLangCode, attempt + 1, useMask);
    }
    throw err;
  }
}

async function fetchClients5Batch(items, targetLangCode, attempt = 0) {
  const params = new URLSearchParams({
    client: 'dict-chrome-ex',
    sl: 'en',
    tl: targetLangCode
  });
  for (const item of items) {
    params.append('q', maskBrandTokensNumeric(item));
  }
  const url = `https://clients5.google.com/translate_a/t?${params.toString()}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 SoftCodeSolution-Platform/1.0' },
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) {
      throw new Error(`Clients5 HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected clients5 payload');
    }
    return data.map((entry) => {
      const raw = Array.isArray(entry) ? String(entry[0] || '') : String(entry || '');
      return unmaskBrandTokens(raw.trim());
    });
  } catch (err) {
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 180));
      return fetchClients5Batch(items, targetLangCode, attempt + 1);
    }
    throw err;
  }
}

async function fetchGoogleTranslate(query, targetLangCode, attempt = 0) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLangCode)}&dt=t&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 SoftCodeSolution-Platform/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) {
      throw new Error(`Upstream translate HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new Error('Unexpected translate payload');
    }
    return data[0].map((seg) => (Array.isArray(seg) ? String(seg[0] || '') : '')).join('');
  } catch (err) {
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 180));
      return fetchGoogleTranslate(query, targetLangCode, attempt + 1);
    }
    throw err;
  }
}

async function fetchMyMemory(query, targetLangCode) {
  const masked = maskBrandTokensNumeric(query);
  if (masked.length > 480) throw new Error('Text too long for MyMemory');
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(masked)}&langpair=en|${encodeURIComponent(targetLangCode)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'SoftCodeSolution-Platform/1.0' },
    signal: AbortSignal.timeout(7000)
  });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  const translated = String(data?.responseData?.translatedText || '').trim();
  if (!translated || data?.quotaFinished) throw new Error('MyMemory empty or quota exhausted');
  return unmaskBrandTokens(translated);
}

async function runWithConcurrency(items, limit, worker) {
  let nextIdx = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

export function createI18nRouter(sqliteDb) {
  const router = express.Router();
  const memoryCache = new Map();
  const baselinePacks = loadBaselineOfflinePacks();

  if (sqliteDb) {
    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS platform_i18n_cache (
          target_lang TEXT NOT NULL,
          source_text TEXT NOT NULL,
          translated_text TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (target_lang, source_text)
        );
      `);
    } catch (err) {
      console.warn('Could not initialize platform_i18n_cache table:', err?.message || err);
    }
  }

  function getCached(lang, sourceText) {
    let langMap = memoryCache.get(lang);
    if (!langMap) {
      langMap = new Map();
      memoryCache.set(lang, langMap);
    }
    if (langMap.has(sourceText)) {
      return langMap.get(sourceText);
    }
    if (sqliteDb) {
      try {
        const row = sqliteDb
          .prepare('SELECT translated_text FROM platform_i18n_cache WHERE target_lang = ? AND source_text = ? LIMIT 1')
          .get(lang, sourceText);
        if (row?.translated_text) {
          langMap.set(sourceText, row.translated_text);
          return row.translated_text;
        }
      } catch {}
    }
    const baseHit = baselinePacks[lang]?.[sourceText];
    if (typeof baseHit === 'string' && baseHit.trim()) {
      const cleaned = baseHit.trim();
      langMap.set(sourceText, cleaned);
      return cleaned;
    }
    return null;
  }

  function setCached(lang, sourceText, translatedText) {
    if (!sourceText || !translatedText) return;
    let langMap = memoryCache.get(lang);
    if (!langMap) {
      langMap = new Map();
      memoryCache.set(lang, langMap);
    }
    if (langMap.size > 6000) {
      const firstKey = langMap.keys().next().value;
      if (firstKey !== undefined) langMap.delete(firstKey);
    }
    langMap.set(sourceText, translatedText);
    if (sqliteDb) {
      try {
        sqliteDb
          .prepare(
            `INSERT INTO platform_i18n_cache (target_lang, source_text, translated_text, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(target_lang, source_text) DO UPDATE SET
               translated_text = excluded.translated_text,
               updated_at = excluded.updated_at`
          )
          .run(lang, sourceText, translatedText, new Date().toISOString());
      } catch {}
    }
  }

  router.post('/i18n/translate', async (req, res) => {
    try {
      const rawLang = String(req.body?.targetLang || 'en').trim().toLowerCase();
      const upstreamLang = LANG_MAP[rawLang];
      if (!upstreamLang) {
        return res.status(400).json({ ok: false, message: 'Unsupported target language.' });
      }

      const rawTexts = Array.isArray(req.body?.texts) ? req.body.texts : [];
      const uniqueTexts = [];
      const seen = new Set();

      for (const item of rawTexts) {
        const s = normalizeSource(item);
        if (!s || s.length > 1400 || seen.has(s)) continue;
        seen.add(s);
        uniqueTexts.push(s);
        if (uniqueTexts.length >= 80) break;
      }

      const result = {};
      if (rawLang === 'en' || uniqueTexts.length === 0) {
        for (const t of uniqueTexts) result[t] = t;
        return res.json({ ok: true, targetLang: rawLang, translations: result });
      }

      const glossary = CURATED_GLOSSARY[rawLang];
      const missing = [];
      for (const t of uniqueTexts) {
        if (glossary?.[t]) {
          result[t] = glossary[t];
          continue;
        }
        const hit = getCached(rawLang, t);
        if (hit) {
          result[t] = hit;
        } else {
          missing.push(t);
        }
      }

      if (missing.length > 0) {
        const mintCode = MINT_LANG_MAP[rawLang];
        const strictRegional = STRICT_REGIONAL_LANGS.has(rawLang);
        const maxChunkItems = strictRegional ? 8 : 6;
        const chunks = [];
        let current = [];
        let currentLen = 0;

        for (const text of missing) {
          const maskedLen = text.length + SEP_RAW.length;
          if (current.length > 0 && (current.length >= maxChunkItems || currentLen + maskedLen > 900)) {
            chunks.push(current);
            current = [];
            currentLen = 0;
          }
          current.push(text);
          currentLen += maskedLen;
        }
        if (current.length > 0) chunks.push(current);

        await runWithConcurrency(chunks, 3, async (chunk) => {
          const deferredC5 = new Map();
          // 1. Primary for Google-supported languages: multi-q GET via clients5
          if (!strictRegional) {
            try {
              const parts = await fetchClients5Batch(chunk, upstreamLang);
              if (parts.length === chunk.length) {
                chunk.forEach((orig, idx) => {
                  const candidate = parts[idx];
                  if (candidate && candidate.trim()) {
                    if (mintCode && shouldPreferSecondaryEngine(rawLang, orig, candidate)) {
                      deferredC5.set(orig, candidate.trim());
                    } else {
                      result[orig] = candidate;
                      setCached(rawLang, orig, candidate);
                    }
                  }
                });
                if (chunk.every((orig) => Boolean(result[orig]))) return;
              }
            } catch {}
          }

          // 2. Wikimedia MinT batch (primary unmasked for skr/ks, masked fallback for other 15 MinT-supported languages)
          if (mintCode) {
            const remainingForMinT = chunk.filter((orig) => !result[orig]);
            if (remainingForMinT.length > 0) {
              try {
                const parts = await fetchMinTBatch(remainingForMinT, mintCode, 0, !strictRegional);
                if (parts.length === remainingForMinT.length) {
                  remainingForMinT.forEach((orig, idx) => {
                    const candidate = parts[idx];
                    const valid = strictRegional
                      ? isCleanRegionalTranslation(orig, candidate)
                      : Boolean(candidate && candidate.trim());
                    if (valid) {
                      result[orig] = candidate;
                      setCached(rawLang, orig, candidate);
                    }
                  });
                  if (chunk.every((orig) => Boolean(result[orig]))) return;
                }
              } catch {}
            }
          }

          // 3. Google GTX separator batch fallback (if allowed by IP)
          if (!strictRegional) {
            const remainingForGtx = chunk.filter((orig) => !result[orig]);
            if (remainingForGtx.length > 0) {
              try {
                const joined = remainingForGtx.map(maskBrandTokensNumeric).join(SEP_RAW);
                const translatedRaw = await fetchGoogleTranslate(joined, upstreamLang);
                const parts = translatedRaw.split(SEP_REGEX).map((p) => unmaskBrandTokens(p.trim()));
                if (parts.length === remainingForGtx.length && parts.every((p) => p.length > 0)) {
                  remainingForGtx.forEach((orig, idx) => {
                    result[orig] = parts[idx];
                    setCached(rawLang, orig, parts[idx]);
                  });
                  if (chunk.every((orig) => Boolean(result[orig]))) return;
                }
              } catch {}
            }
          }

          // 4. Fast batch fallback for skr/ks unresolved items via Urdu clients5 (avoids slow per-item MinT timeouts)
          const remaining = chunk.filter((orig) => !result[orig]);
          if (remaining.length > 0 && strictRegional) {
            try {
              const urParts = await fetchClients5Batch(remaining, 'ur');
              if (urParts.length === remaining.length) {
                remaining.forEach((orig, idx) => {
                  const candidate = urParts[idx]?.trim();
                  if (candidate) {
                    result[orig] = candidate;
                    setCached(rawLang, orig, candidate);
                  }
                });
                if (chunk.every((orig) => Boolean(result[orig]))) return;
              }
            } catch {}
          }

          // 5. Individual item fallback (Clients5 single -> MinT single -> GTX single -> MyMemory -> Regional Urdu fallback)
          const stillRemaining = chunk.filter((orig) => !result[orig]);
          await runWithConcurrency(stillRemaining, 2, async (orig) => {
            if (!strictRegional) {
              try {
                const c5Single = await fetchClients5Batch([orig], upstreamLang);
                if (c5Single[0] && c5Single[0].trim()) {
                  result[orig] = c5Single[0].trim();
                  setCached(rawLang, orig, result[orig]);
                  return;
                }
              } catch {}
            }

            if (mintCode && !strictRegional) {
              try {
                const singleParts = await fetchMinTBatch([orig], mintCode, 1, true);
                const candidate = singleParts[0];
                if (candidate && candidate.trim()) {
                  result[orig] = candidate;
                  setCached(rawLang, orig, candidate);
                  return;
                }
              } catch {}
            }

            if (!strictRegional) {
              try {
                const singleRaw = await fetchGoogleTranslate(maskBrandTokensNumeric(orig), upstreamLang);
                const cleaned = unmaskBrandTokens(singleRaw.trim());
                if (cleaned) {
                  result[orig] = cleaned;
                  setCached(rawLang, orig, cleaned);
                  return;
                }
              } catch {}

              if (rawLang !== 'pa' && rawLang !== 'bal') {
                try {
                  const mm = await fetchMyMemory(orig, upstreamLang);
                  if (mm) {
                    result[orig] = mm;
                    setCached(rawLang, orig, mm);
                    return;
                  }
                } catch {}
              }
            }

            // Guaranteed clean Perso-Arabic script fallback for skr/ks
            if (strictRegional) {
              try {
                const urParts = await fetchClients5Batch([orig], 'ur');
                const candidate = urParts[0]?.trim();
                if (candidate) {
                  result[orig] = candidate;
                  setCached(rawLang, orig, candidate);
                }
              } catch {}
            } else if (!result[orig] && deferredC5.has(orig)) {
              const fallbackCandidate = deferredC5.get(orig);
              if (fallbackCandidate) {
                result[orig] = fallbackCandidate;
                setCached(rawLang, orig, fallbackCandidate);
              }
            }
            if (!result[orig]) {
              result[orig] = orig;
            }
          });
        });
      }

      return res.json({ ok: true, targetLang: rawLang, translations: result });
    } catch (err) {
      return res.status(200).json({ ok: false, translations: {}, message: err?.message || 'Translation skipped' });
    }
  });

  // Hybrid Offline Pack Summary: lists all languages & downloaded phrase counts in SQLite/memory/baseline
  router.get('/i18n/packs/summary', (_req, res) => {
    try {
      const packs = {};
      for (const lang of Object.keys(LANG_MAP)) {
        if (lang === 'en') continue;
        const glossaryCount = CURATED_GLOSSARY[lang] ? Object.keys(CURATED_GLOSSARY[lang]).length : 0;
        const baselineCount = baselinePacks[lang] ? Object.keys(baselinePacks[lang]).length : 0;
        const memCount = memoryCache.get(lang)?.size || 0;
        packs[lang] = { count: Math.max(glossaryCount, baselineCount, memCount) };
      }

      if (sqliteDb) {
        try {
          const rows = sqliteDb
            .prepare('SELECT target_lang, COUNT(*) AS cnt, MAX(updated_at) AS last_updated FROM platform_i18n_cache GROUP BY target_lang')
            .all();
          for (const row of rows) {
            const lang = String(row.target_lang || '').toLowerCase();
            if (!LANG_MAP[lang] || lang === 'en') continue;
            const glossaryCount = CURATED_GLOSSARY[lang] ? Object.keys(CURATED_GLOSSARY[lang]).length : 0;
            const baselineCount = baselinePacks[lang] ? Object.keys(baselinePacks[lang]).length : 0;
            packs[lang] = {
              count: Math.max(Number(row.cnt || 0), packs[lang]?.count || 0, glossaryCount, baselineCount),
              updatedAt: row.last_updated || null
            };
          }
        } catch {}
      }

      return res.json({ ok: true, packs });
    } catch (err) {
      return res.status(500).json({ ok: false, packs: {}, message: err?.message || 'Summary error' });
    }
  });

  // Download full offline pack for a language from baseline + SQLite + memory + curated glossary
  router.get('/i18n/pack/:lang', (req, res) => {
    try {
      const rawLang = String(req.params.lang || '').trim().toLowerCase();
      if (!LANG_MAP[rawLang]) {
        return res.status(400).json({ ok: false, message: 'Unsupported language.' });
      }
      if (rawLang === 'en') {
        return res.json({ ok: true, targetLang: 'en', count: 0, translations: {} });
      }

      const translations = {};
      if (baselinePacks[rawLang] && typeof baselinePacks[rawLang] === 'object') {
        Object.assign(translations, baselinePacks[rawLang]);
      }

      if (sqliteDb) {
        try {
          const rows = sqliteDb
            .prepare('SELECT source_text, translated_text FROM platform_i18n_cache WHERE target_lang = ?')
            .all(rawLang);
          for (const row of rows) {
            if (row?.source_text && row?.translated_text) {
              translations[row.source_text] = row.translated_text;
            }
          }
        } catch {}
      }

      const memMap = memoryCache.get(rawLang);
      if (memMap) {
        for (const [k, v] of memMap.entries()) {
          translations[k] = v;
        }
      }

      if (CURATED_GLOSSARY[rawLang]) {
        Object.assign(translations, CURATED_GLOSSARY[rawLang]);
      }

      return res.json({
        ok: true,
        targetLang: rawLang,
        count: Object.keys(translations).length,
        translations
      });
    } catch (err) {
      return res.status(200).json({ ok: false, translations: {}, message: err?.message || 'Pack load failed' });
    }
  });

  // Sync locally downloaded translations back into SQLite offline store
  router.post('/i18n/pack/import', (req, res) => {
    try {
      const rawLang = String(req.body?.targetLang || '').trim().toLowerCase();
      if (!LANG_MAP[rawLang] || rawLang === 'en') {
        return res.status(400).json({ ok: false, message: 'Unsupported target language.' });
      }
      const incoming = req.body?.translations;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ ok: false, message: 'Invalid translations payload.' });
      }
      let imported = 0;
      for (const [k, v] of Object.entries(incoming)) {
        const src = normalizeSource(k);
        const tr = typeof v === 'string' ? v.trim() : '';
        if (!src || !tr || src.length > 1400) continue;
        if (!getCached(rawLang, src)) {
          setCached(rawLang, src, tr);
          imported++;
        }
      }
      return res.json({ ok: true, targetLang: rawLang, imported });
    } catch (err) {
      return res.status(200).json({ ok: false, imported: 0, message: err?.message || 'Import failed' });
    }
  });

  return router;
}
