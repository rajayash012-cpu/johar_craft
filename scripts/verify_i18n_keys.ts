import { en } from '../src/i18n/translations/en';
import { hi } from '../src/i18n/translations/hi';
import { sat } from '../src/i18n/translations/sat';
import { nag } from '../src/i18n/translations/nag';
import { kh } from '../src/i18n/translations/kh';
import { kur } from '../src/i18n/translations/kur';
import { unr } from '../src/i18n/translations/unr';
import { hoc } from '../src/i18n/translations/hoc';

const DICTS: Record<string, any> = { hi, sat, nag, kh, kur, unr, hoc };

function getKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getKeys(obj[k], full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const enKeys = getKeys(en);
console.log(`Total canonical keys in en.ts: ${enKeys.length}`);

let allPassed = true;
for (const [lang, dict] of Object.entries(DICTS)) {
  const missing: string[] = [];
  for (const key of enKeys) {
    const parts = key.split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur === undefined || cur === null) break;
      cur = cur[p];
    }
    if (cur === undefined || cur === null || typeof cur !== 'string') {
      missing.push(key);
    }
  }

  if (missing.length === 0) {
    console.log(`✅ [${lang}]: 100% key parity (${enKeys.length}/${enKeys.length} keys present)`);
  } else {
    console.error(`❌ [${lang}]: Missing ${missing.length} keys:`, missing.slice(0, 5));
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n🎉 ALL 8 TRANSLATIONS HAVE 100% COMPLETE KEY PARITY!');
  process.exit(0);
} else {
  console.error('\n⚠️ Some translations have missing keys.');
  process.exit(1);
}
