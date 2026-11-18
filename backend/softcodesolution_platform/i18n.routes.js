import express from 'express';

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
  hi: 'hi',
  es: 'es',
  fr: 'fr',
  de: 'de',
  zh: 'zh-CN',
  tr: 'tr',
  ja: 'ja',
  pt: 'pt',
  id: 'id',
  it: 'it',
  ru: 'ru'
};

const MINT_LANGS = new Set(['skr', 'ks']);

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

function unmaskBrandTokens(text) {
  return String(text || '')
    .replace(/SCSBRAND01/gi, 'SoftCodeSolution')
    .replace(/SCSBRAND02/gi, 'SoftCode Solution')
    .replace(/SCSBRAND03/gi, 'SoftCode');
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
  // Reject runaway generation bloat
  if (tr.length > Math.max(orig.length * 4.5, orig.length + 80)) return false;
  return true;
}

async function fetchMinTBatch(items, targetLangCode, attempt = 0) {
  const html = `<div>${items.map((s) => `<p>${escapeHtml(maskBrandTokens(s))}</p>`).join('')}</div>`;
  try {
    const res = await fetch(`https://cxserver.wikimedia.org/v2/translate/en/${encodeURIComponent(targetLangCode)}/MinT`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SoftCodeSolution-Platform/1.0'
      },
      body: JSON.stringify({ html }),
      signal: AbortSignal.timeout(14000)
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
    if (attempt < 1) {
      await new Promise((r) => setTimeout(r, 220));
      return fetchMinTBatch(items, targetLangCode, attempt + 1);
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
        const useMinT = MINT_LANGS.has(rawLang);
        const maxChunkItems = useMinT ? 8 : 10;
        // Keep chunks compact so delimiter / HTML structure never drops
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

        // Concurrency-capped worker pool prevents upstream rate limits on burst loads
        await runWithConcurrency(chunks, useMinT ? 2 : 3, async (chunk) => {
          if (useMinT) {
            try {
              const parts = await fetchMinTBatch(chunk, upstreamLang);
              if (parts.length === chunk.length) {
                let allClean = true;
                chunk.forEach((orig, idx) => {
                  const candidate = parts[idx];
                  if (isCleanRegionalTranslation(orig, candidate)) {
                    result[orig] = candidate;
                    setCached(rawLang, orig, candidate);
                  } else {
                    allClean = false;
                  }
                });
                if (allClean) return;
              }
            } catch {}

            // Individual MinT fallback for any remaining unresolved item in chunk
            const remaining = chunk.filter((orig) => !result[orig]);
            await runWithConcurrency(remaining, 2, async (orig) => {
              try {
                const singleParts = await fetchMinTBatch([orig], upstreamLang);
                const candidate = singleParts[0];
                if (isCleanRegionalTranslation(orig, candidate)) {
                  result[orig] = candidate;
                  setCached(rawLang, orig, candidate);
                }
              } catch {}
            });
            return;
          }

          try {
            const joined = chunk.map(maskBrandTokens).join(SEP_RAW);
            const translatedRaw = await fetchGoogleTranslate(joined, upstreamLang);
            const parts = translatedRaw.split(SEP_REGEX).map((p) => unmaskBrandTokens(p.trim()));

            if (parts.length === chunk.length && parts.every((p) => p.length > 0)) {
              chunk.forEach((orig, idx) => {
                result[orig] = parts[idx];
                setCached(rawLang, orig, parts[idx]);
              });
              return;
            }
          } catch {}

          // Individual fallback with strict concurrency cap (never blast 16 simultaneous calls)
          await runWithConcurrency(chunk, 3, async (orig) => {
            try {
              const singleRaw = await fetchGoogleTranslate(maskBrandTokens(orig), upstreamLang);
              const cleaned = unmaskBrandTokens(singleRaw.trim());
              if (cleaned) {
                result[orig] = cleaned;
                setCached(rawLang, orig, cleaned);
              }
            } catch {
              // Do not cache failed lookups so client can retry cleanly
            }
          });
        });
      }

      return res.json({ ok: true, targetLang: rawLang, translations: result });
    } catch (err) {
      return res.status(200).json({ ok: false, translations: {}, message: err?.message || 'Translation skipped' });
    }
  });

  return router;
}
