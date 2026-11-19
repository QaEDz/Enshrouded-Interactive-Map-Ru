
import { useSyncExternalStore } from 'react';
import ptBR from './i18n/pt-BR.json';
import en from './i18n/en.json';
import es from './i18n/es.json';
import de from './i18n/de.json';
import fr from './i18n/fr.json';
import zhCN from './i18n/zh-CN.json';
import ru from './i18n/ru.json';

export const LANGS = [
  { code: 'pt-BR', name: 'Português' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ru', name: 'Русский' },
];

const UI = {
  'pt-BR': ptBR,
  en,
  es,
  de,
  fr,
  'zh-CN': zhCN,
  ru,
};

const KEY = 'embervale.lang';

// idioma inicial: o salvo, senão o do sistema, senão inglês
function initial() {
  try {
    const s = localStorage.getItem(KEY);
    if (s && UI[s]) return s;
  } catch {}

  const nav =
    (typeof navigator !== 'undefined' &&
      (navigator.languages?.[0] || navigator.language)) ||
    '';

  const l = nav.toLowerCase();

  if (l.startsWith('pt')) return 'pt-BR';
  if (l.startsWith('es')) return 'es';
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('zh')) return 'zh-CN';
  if (l.startsWith('ru')) return 'ru';

  return 'en';
}

let lang = initial();
let ver = 0;
const subs = new Set();

const emit = () => {
  ver += 1;
  for (const f of subs) f();
};

// nomes do jogo: um fetch por idioma
const NAMES = {};
const cache = {};

function loadNames(code) {
  if (code === 'pt-BR' || NAMES[code]) return;

  NAMES[code] = {};

  fetch(`./lang/${code}.json`)
    .then((r) => r.json())
    .then((j) => {
      NAMES[code] = j;
      cache[code] = new Map();
      if (code === lang) emit();
    })
    .catch(() => {});
}

function apply() {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.title = t('app.title');
  }
}

export const getLang = () => lang;

export function setLang(code) {
  if (!UI[code] || code === lang) return;

  lang = code;

  try {
    localStorage.setItem(KEY, code);
  } catch {}

  loadNames(code);
  apply();
  emit();
}

// hook: re-renderiza o componente ao trocar de idioma
const subscribe = (f) => {
  subs.add(f);
  return () => subs.delete(f);
};

const getVer = () => ver;

export function useLang() {
  return useSyncExternalStore(subscribe, getVer, getVer);
}

const fill = (s, vars) =>
  vars
    ? s.replace(/\{(\w+)\}/g, (all, k) =>
        vars[k] != null ? String(vars[k]) : all
      )
    : s;

// texto da interface no idioma escolhido
export function t(key, vars) {
  const s =
    UI[lang][key] ??
    UI.en[key] ??
    UI['pt-BR'][key] ??
    key;

  return fill(s, vars);
}

// mesmo texto num idioma fixo
export function tIn(code, key, vars) {
  const s = UI[code]?.[key] ?? UI['pt-BR'][key] ?? key;
  return fill(s, vars);
}

// plural simples: chave_one / chave_other
export function tc(key, n, vars) {
  return t(`${key}_${n === 1 ? 'one' : 'other'}`, { n, ...vars });
}

// nome do jogo (PT) no idioma escolhido
const SEPS = [' — ', ' / ', ' · '];

export function tn(s) {
  if (!s || lang === 'pt-BR' || typeof s !== 'string') return s;

  const dict = NAMES[lang];
  if (!dict) return s;

  const c = cache[lang] || (cache[lang] = new Map());
  const hit = c.get(s);

  if (hit !== undefined) return hit;

  let out =
    dict[s] ??
    dict[s.replace(/\s+/g, ' ').trim()];

  if (out == null) {
    out = s;

    for (const sep of SEPS) {
      if (!s.includes(sep)) continue;

      const parts = s.split(sep).map((p) => tn(p));
      const joined = parts.join(sep);

      if (joined !== s) {
        out = joined;
        break;
      }
    }
  }

  c.set(s, out);
  return out;
}

// número no formato do idioma
export const fmtNum = (n) => n.toLocaleString(lang);

loadNames(lang);
apply();
