// Templates, palettes, font pairs and project defaults.
import { DEFAULT_COPY, khDigits } from './i18n.js';

const KHMER = "'Noto Serif Khmer'";

export const FONT_PAIRS = {
  classic: {
    label: 'Cormorant & Jost',
    note: 'Literary, timeless',
    display: `'Cormorant Garamond', ${KHMER}, Georgia, serif`,
    names: `'Cormorant Garamond', ${KHMER}, Georgia, serif`,
    namesStyle: 'italic',
    body: `'Jost', ${KHMER}, system-ui, sans-serif`,
  },
  didone: {
    label: 'Bodoni & Inter',
    note: 'High-contrast couture',
    display: `'Bodoni Moda', ${KHMER}, Georgia, serif`,
    names: `'Bodoni Moda', ${KHMER}, Georgia, serif`,
    namesStyle: 'italic',
    body: `'Inter', ${KHMER}, system-ui, sans-serif`,
  },
  script: {
    label: 'Pinyon & Cormorant',
    note: 'Hand-lettered romance',
    display: `'Cormorant Garamond', ${KHMER}, Georgia, serif`,
    names: `'Pinyon Script', ${KHMER}, cursive`,
    namesStyle: 'normal',
    body: `'Jost', ${KHMER}, system-ui, sans-serif`,
  },
  modern: {
    label: 'Fraunces & Manrope',
    note: 'Soft, contemporary',
    display: `'Fraunces', ${KHMER}, Georgia, serif`,
    names: `'Fraunces', ${KHMER}, Georgia, serif`,
    namesStyle: 'italic',
    body: `'Manrope', ${KHMER}, system-ui, sans-serif`,
  },
  deco: {
    label: 'Cinzel & Josefin',
    note: 'Jazz-age geometry',
    display: `'Cinzel', ${KHMER}, Georgia, serif`,
    names: `'Cinzel', ${KHMER}, Georgia, serif`,
    namesStyle: 'normal',
    body: `'Josefin Sans', ${KHMER}, system-ui, sans-serif`,
  },
  hand: {
    label: 'Caveat & Manrope',
    note: 'Handwritten, personal',
    display: `'Caveat', ${KHMER}, cursive`,
    names: `'Caveat', ${KHMER}, cursive`,
    namesStyle: 'normal',
    body: `'Manrope', ${KHMER}, system-ui, sans-serif`,
  },
};

export const TEMPLATES = {
  editorial: {
    name: 'Ivory Classic',
    blurb: 'A tall framed portrait with a cream name card that slides up.',
    font: 'classic',
    background: 'paper',
    palettes: [
      { name: 'Ivory & Wine', bg: '#F6F1E7', ink: '#2A2522', accent: '#6B1E2C', gold: '#B39463' },
      { name: 'Stone & Charcoal', bg: '#F0EDE8', ink: '#232120', accent: '#3E3935', gold: '#A08C6A' },
      { name: 'Blush Paper', bg: '#F8EFEA', ink: '#3A2A2A', accent: '#8E3F4B', gold: '#BE9C74' },
    ],
  },
  romance: {
    name: 'Modern Romance',
    blurb: 'Rich burgundy, full-bleed photography, candlelit gold.',
    font: 'didone',
    background: 'gradient',
    palettes: [
      { name: 'Burgundy Night', bg: '#3B0E19', ink: '#F5E9DA', accent: '#E0C08C', gold: '#C9A46A' },
      { name: 'Midnight Navy', bg: '#141F36', ink: '#F3EBDD', accent: '#D6B98A', gold: '#C2A26E' },
      { name: 'Merlot Rose', bg: '#521726', ink: '#FBEDE6', accent: '#F0C4B4', gold: '#D7A98A' },
    ],
  },
  botanical: {
    name: 'Garden Veil',
    blurb: 'Full photo fading into soft white, with leafy sprigs and script names.',
    font: 'script',
    background: 'linen',
    palettes: [
      { name: 'Sage Garden', bg: '#F2F0E6', ink: '#2E3A2D', accent: '#56744F', gold: '#B09B6E' },
      { name: 'Eucalyptus', bg: '#EDF1EE', ink: '#24332E', accent: '#4A6C62', gold: '#A9A07A' },
      { name: 'Olive Grove', bg: '#F4F1E3', ink: '#33361F', accent: '#686E3B', gold: '#B39A62' },
    ],
  },
  angkor: {
    name: 'Royal Khmer',
    blurb: 'Photo above a curved crimson panel, gold flame and shimmering names.',
    font: 'classic',
    background: 'gradient',
    palettes: [
      { name: 'Royal Crimson', bg: '#5B0F17', ink: '#F7E7CF', accent: '#E3B866', gold: '#D4A551' },
      { name: 'Temple Jade', bg: '#0F3B33', ink: '#F3EAD6', accent: '#E0BE72', gold: '#C9A55A' },
      { name: 'Silk Ivory', bg: '#F6EBDA', ink: '#4A1414', accent: '#9C1F22', gold: '#B98A3A' },
    ],
  },
  celestial: {
    name: 'Starlight',
    blurb: 'Full photo under a midnight sky, stars twinkling in and a crescent moon.',
    font: 'didone',
    background: 'plain',
    palettes: [
      { name: 'Midnight', bg: '#0E1630', ink: '#EFE8DA', accent: '#E3C98E', gold: '#CDB27A' },
      { name: 'Dusk Violet', bg: '#231A3A', ink: '#F1E9F2', accent: '#E8C3A2', gold: '#D2AE8C' },
      { name: 'Ink & Silver', bg: '#111418', ink: '#ECEEF0', accent: '#C9D2DC', gold: '#AEB8C4' },
    ],
  },
  deco: {
    name: 'Golden Deco',
    blurb: 'Full photo in a gold art-deco frame with sunburst rays.',
    font: 'deco',
    background: 'plain',
    palettes: [
      { name: 'Onyx & Gold', bg: '#111111', ink: '#F2E6CC', accent: '#D8B26A', gold: '#C9A25A' },
      { name: 'Emerald Club', bg: '#0C2A22', ink: '#F0E6CF', accent: '#D9B56E', gold: '#C49E58' },
      { name: 'Ivory Deco', bg: '#F4EEE2', ink: '#1B1A18', accent: '#8C6A2C', gold: '#B08A45' },
    ],
  },
  watercolor: {
    name: 'Blush Portrait',
    blurb: 'A soft framed portrait card on blooming painted washes.',
    font: 'script',
    background: 'paper',
    palettes: [
      { name: 'Blush & Peach', bg: '#FBF6F2', ink: '#4A3436', accent: '#C9727A', gold: '#E3A982' },
      { name: 'Lavender Mist', bg: '#F8F6FB', ink: '#3C3550', accent: '#8C78B8', gold: '#C9A6D8' },
      { name: 'Sea Glass', bg: '#F4F9F8', ink: '#28403F', accent: '#5C9C97', gold: '#A8CFC2' },
    ],
  },
  film: {
    name: 'Cinema Love',
    blurb: 'A movie-poster cover: letterbox bars, film grain and an admit-one ticket.',
    font: 'didone',
    background: 'paper',
    palettes: [
      { name: 'Midnight Premiere', bg: '#0E0E10', ink: '#F3EDE4', accent: '#E8C27A', gold: '#C9A25A' },
      { name: 'Noir Rose', bg: '#1A0F12', ink: '#F7E9E6', accent: '#E7A9A0', gold: '#D4A48E' },
      { name: 'Silver Screen', bg: '#121314', ink: '#EEEEEE', accent: '#CFCFCF', gold: '#B5B5B5' },
    ],
  },
};

export const BACKGROUNDS = {
  plain: 'Plain',
  paper: 'Paper grain',
  linen: 'Fine linen',
  gradient: 'Soft glow',
};

export const SECTION_LABELS = {
  greeting: 'Personal greeting',
  details: 'Date & venue',
  story: 'Our story',
  schedule: 'Schedule',
  gallery: 'Gallery',
  location: 'Map & directions',
  closing: 'Closing note',
};

export const DEFAULT_SECTIONS = ['greeting', 'details', 'story', 'schedule', 'gallery', 'location', 'closing'].map(
  (key) => ({ key, visible: true }),
);

export function uid(len = 12) {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

export function designForTemplate(templateKey, prev) {
  const t = TEMPLATES[templateKey];
  return {
    ...(prev || {}),
    palette: { ...t.palettes[0] },
    fontPair: t.font,
    background: t.background,
    crop: prev?.crop || { x: 50, y: 45, zoom: 1 },
    sections: prev?.sections || DEFAULT_SECTIONS.map((s) => ({ ...s })),
  };
}

export function newProject(details) {
  const now = Date.now();
  const lang = details.lang === 'km' ? 'km' : 'en';
  const copy = DEFAULT_COPY[lang];
  return {
    id: uid(10),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    isExample: false,
    template: 'editorial',
    content: {
      partner1: details.partner1 || '',
      partner2: details.partner2 || '',
      greeting: details.greeting || copy.greeting,
      date: details.date || '',
      time: details.time || '',
      venueName: details.venueName || '',
      venueAddress: details.venueAddress || '',
      mapUrl: details.mapUrl || '',
      coverPhoto: '',
      gallery: [],
      storyTitle: copy.storyTitle,
      story: '',
      schedule: [],
      closing: copy.closing,
      // second-language version of the typed text (filled with ready-made defaults)
      tr: { [lang === 'km' ? 'en' : 'km']: { ...DEFAULT_COPY[lang === 'km' ? 'en' : 'km'] } },
    },
    design: { ...designForTemplate('editorial'), lang },
    guests: [],
  };
}

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1400&q=80`;

export function exampleProject() {
  const p = newProject({
    partner1: 'Sophea',
    partner2: 'Dara',
    date: '2026-05-05',
    time: '17:00',
    venueName: 'The Riverside Pavilion',
    venueAddress: 'Sisowath Quay, Phnom Penh, Cambodia',
    mapUrl: 'https://maps.google.com/?q=Sisowath+Quay+Phnom+Penh',
  });
  p.isExample = true;
  p.template = 'romance';
  p.design = designForTemplate('romance');
  p.design.crop = { x: 50, y: 35, zoom: 1 };
  p.content.coverPhoto = U('1519741497674-611481863552');
  p.content.gallery = [U('1511285560929-80b456fea0bc'), U('1465495976277-4387d4b0b4c6'), U('1522673607200-164d1b6ce486')];
  p.content.story =
    'We met on a rainy evening by the river, sharing a single umbrella and a long conversation that never quite ended. Seven years, two cities and one very patient cat later, we are ready to promise each other everything.';
  p.content.schedule = [
    { id: uid(6), time: '16:30', title: 'Guest arrival', note: 'Welcome drinks on the terrace' },
    { id: uid(6), time: '17:00', title: 'Ceremony', note: 'Riverside garden' },
    { id: uid(6), time: '18:30', title: 'Dinner & toasts', note: 'Grand pavilion' },
    { id: uid(6), time: '20:00', title: 'First dance', note: 'And dancing until late' },
  ];
  p.guests = [
    { id: uid(12), name: 'Mr. & Mrs. Chan', createdAt: Date.now() },
    { id: uid(12), name: 'Sen Visal', createdAt: Date.now() },
  ];
  return p;
}

const KM_DAYS = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
const KM_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

/** style: 'long' (weekday + full date) or 'short' (dd · mm · yyyy). */
export function formatDate(iso, lang = 'en', style = 'long') {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const date = new Date(y, m - 1, d);
  if (style === 'short') {
    const s = `${String(d).padStart(2, '0')} · ${String(m).padStart(2, '0')} · ${y}`;
    return lang === 'km' ? khDigits(s) : s;
  }
  if (lang === 'km') return khDigits(`ថ្ងៃ${KM_DAYS[date.getDay()]} ទី${d} ខែ${KM_MONTHS[m - 1]} ឆ្នាំ${y}`);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export function formatTime(t, lang = 'en') {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  if (lang === 'km') {
    const period = h < 12 ? 'ព្រឹក' : h === 12 ? 'ថ្ងៃត្រង់' : h < 17 ? 'រសៀល' : h < 19 ? 'ល្ងាច' : 'យប់';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return khDigits(`${h12}:${String(m || 0).padStart(2, '0')}`) + ` ${period}`;
  }
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, m || 0));
}

export function initials(p) {
  const a = (p.content.partner1 || '').trim()[0] || '';
  const b = (p.content.partner2 || '').trim()[0] || '';
  return (a + b).toUpperCase() || '♡';
}

export function coupleName(p, sep = ' & ', fallback = 'Untitled invitation') {
  const a = p.content.partner1.trim();
  const b = p.content.partner2.trim();
  if (!a && !b) return fallback;
  return [a, b].filter(Boolean).join(sep);
}

export function isValidUrl(s) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function lum(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  try {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  } catch {
    return 21;
  }
}

export function coupleLink(token) {
  return `${location.origin}${location.pathname}#/c/${token}`;
}

export function guestLink(projectId, guestId) {
  const base = `${location.origin}${location.pathname}`;
  return guestId ? `${base}#/i/${projectId}/${guestId}` : `${base}#/i/${projectId}`;
}

/* ---------- bilingual content ---------- */
// Text the owner types that can have an English and a Khmer version.
export const TR_FIELDS = ['partner1', 'partner2', 'greeting', 'venueName', 'venueAddress', 'storyTitle', 'story', 'closing'];

export const mainLang = (p) => (p.design.lang === 'km' ? 'km' : 'en');

/** Content as guests see it in `lang`: the translation where one exists, otherwise the main-language text. */
export function localizeContent(p, lang) {
  const main = mainLang(p);
  const c = p.content;
  if (!lang || lang === main) return c;
  const t = (c.tr && c.tr[lang]) || {};
  const out = { ...c };
  TR_FIELDS.forEach((f) => {
    const v = t[f];
    if (typeof v === 'string' && v.trim()) out[f] = v;
    else if (DEFAULT_COPY[main] && c[f] === DEFAULT_COPY[main][f] && DEFAULT_COPY[lang]) out[f] = DEFAULT_COPY[lang][f];
  });
  out.schedule = (c.schedule || []).map((s) => {
    const x = t.schedule && t.schedule[s.id];
    if (!x) return s;
    return { ...s, title: x.title && x.title.trim() ? x.title : s.title, note: x.note && x.note.trim() ? x.note : s.note };
  });
  return out;
}

/** The value typed for one field in one language ('' when that language has no own text yet). */
export function fieldIn(p, lang, f) {
  const main = mainLang(p);
  if (lang === main) return p.content[f] ?? '';
  const own = p.content.tr && p.content.tr[lang] && p.content.tr[lang][f];
  if (own !== undefined && own !== null) return own;
  // untouched ready-made wording: show the other language's ready-made wording
  if (DEFAULT_COPY[main] && p.content[f] === DEFAULT_COPY[main][f] && DEFAULT_COPY[lang]) return DEFAULT_COPY[lang][f];
  return '';
}
export function scheduleIn(p, lang, s, k) {
  if (lang === mainLang(p)) return s[k] ?? '';
  const x = p.content.tr && p.content.tr[lang] && p.content.tr[lang].schedule && p.content.tr[lang].schedule[s.id];
  return (x && x[k]) ?? '';
}
