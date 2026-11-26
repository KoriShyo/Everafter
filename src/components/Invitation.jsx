import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FONT_PAIRS, formatDate, formatTime, initials, isValidUrl, localizeContent } from '../data.js';
import { inv } from '../i18n.js';
import { prefersReducedMotion } from '../store.js';
import '../invitation.css';
import '../gallery.css';
import '../envelope.css';
import '../templates.css';
import '../envskin.css';
import '../covers2.css';
import '../motion.css';

/* ---------- ornaments ---------- */
export function Sprig({ className = '', flip = false }) {
  return (
    <svg className={`sprig ${className}`} viewBox="0 0 120 120" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d="M10 112 C 40 84, 64 58, 112 10" fill="none" stroke="currentColor" strokeWidth="1.1" />
      {[
        [30, 92, -40],
        [44, 78, -35],
        [58, 63, -40],
        [72, 49, -35],
        [86, 35, -40],
        [99, 22, -35],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <ellipse cx={x - 6} cy={y - 9} rx="4.2" ry="10" transform={`rotate(${r} ${x - 6} ${y - 9})`} fill="currentColor" opacity=".55" />
          <ellipse cx={x + 9} cy={y + 5} rx="4.2" ry="10" transform={`rotate(${r + 85} ${x + 9} ${y + 5})`} fill="currentColor" opacity=".38" />
        </g>
      ))}
      <circle cx="112" cy="10" r="2.4" fill="currentColor" opacity=".6" />
    </svg>
  );
}

function Flourish() {
  return (
    <svg className="flourish" viewBox="0 0 160 16" aria-hidden="true">
      <path d="M0 8 H62 M98 8 H160" stroke="currentColor" strokeWidth=".8" />
      <path d="M80 2 L86 8 L80 14 L74 8 Z" fill="none" stroke="currentColor" strokeWidth=".9" />
      <circle cx="66" cy="8" r="1.4" fill="currentColor" />
      <circle cx="94" cy="8" r="1.4" fill="currentColor" />
    </svg>
  );
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

function Photo({ src, alt, crop, className = '', fallback, placeholder }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div className={`photo photo-empty ${className}`} role="img" aria-label={alt || placeholder}>
        <span>{fallback}</span>
      </div>
    );
  }
  const style = crop
    ? { objectPosition: `${crop.x}% ${crop.y}%`, transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` }
    : undefined;
  return (
    <div className={`photo ${className}`}>
      <img src={src} alt={alt} style={style} loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </div>
  );
}

/** Date and time as unbreakable pieces; on narrow screens the time moves to its own line. */
function DateLine({ date, time, L }) {
  return (
    <>
      <span className="cd-date">{date || L('tba')}</span>
      {time ? (
        <>
          <span className="cd-sep"> · </span>
          <span className="cd-time">
            {L('timePrefix')}
            {time}
          </span>
        </>
      ) : null}
    </>
  );
}

/** Khmer script has no true italic: names written in Khmer get an upright Khmer display face. */
const isKh = (t) => /[ក-៿]/.test(t || '');
const khc = (t) => (isKh(t) ? 'kh' : undefined);

/** Shrink class for long names so each name stays on one row without being cut. */
function nameSize(c) {
  const longest = Math.max((c.partner1 || '').trim().length, (c.partner2 || '').trim().length);
  return longest > 16 ? 'names-xl' : longest > 11 ? 'names-l' : '';
}

/** "Name & Name" that stacks one name per row on narrow screens and never splits a name. */
function NamePair({ a, b, className = '' }) {
  return (
    <span className={`name-pair ${className}`}>
      <span className={`np-name ${isKh(a) ? 'kh' : ''}`}>{a}</span>
      <span className="np-amp"> &amp; </span>
      <span className={`np-name ${isKh(b) ? 'kh' : ''}`}>{b}</span>
    </span>
  );
}

function Names({ c, L }) {
  return (
    <h1 className={`names ${nameSize(c)}`}>
      <span className="line"><span className={khc(c.partner1)}>{c.partner1 || L('partner')}</span></span>
      <span className="line amp"><span>&amp;</span></span>
      <span className="line"><span className={khc(c.partner2)}>{c.partner2 || L('partner')}</span></span>
    </h1>
  );
}

/** The guest's name, given its own visual weight on every cover. */
function GuestPlate({ label, name, className = '' }) {
  return (
    <div className={`guest-plate ${className}`}>
      <span className="gp-label">{label}</span>
      <span className={`gp-name ${isKh(name) ? 'kh' : ''}`}>{name}</span>
    </div>
  );
}

/* ---------- additional templates: ornaments ---------- */
function Lotus({ className = '' }) {
  return (
    <svg className={`lotus ${className}`} viewBox="0 0 120 70" aria-hidden="true">
      <g className="lotus-petals" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
        <path className="lp lp-5" d="M60 62 C40 60 18 50 6 30 C24 30 44 40 60 62Z" />
        <path className="lp lp-4" d="M60 62 C80 60 102 50 114 30 C96 30 76 40 60 62Z" />
        <path className="lp lp-3" d="M60 62 C46 52 32 34 30 12 C46 22 58 40 60 62Z" />
        <path className="lp lp-2" d="M60 62 C74 52 88 34 90 12 C74 22 62 40 60 62Z" />
        <path className="lp lp-1" d="M60 62 C50 46 50 22 60 4 C70 22 70 46 60 62Z" fill="currentColor" fillOpacity=".18" />
      </g>
      <path className="lotus-base" d="M22 66 H98" stroke="currentColor" strokeWidth="1" pathLength="1" />
    </svg>
  );
}

function AngkorFrame() {
  // Original geometric border: double rule with stepped corners and flame-like corner motifs.
  const corner = 'M14 64 V30 Q14 14 30 14 H64';
  return (
    <svg className="ak-frame" viewBox="0 0 300 500" preserveAspectRatio="none" aria-hidden="true">
      <rect className="ak-line" x="8" y="8" width="284" height="484" fill="none" pathLength="1" />
      <rect className="ak-line ak-line-2" x="18" y="18" width="264" height="464" fill="none" pathLength="1" />
      {[
        '',
        'translate(300 0) scale(-1 1)',
        'translate(0 500) scale(1 -1)',
        'translate(300 500) scale(-1 -1)',
      ].map((t, i) => (
        <g key={i} transform={t}>
          <path className="ak-line ak-corner" d={corner} fill="none" pathLength="1" />
          <path className="ak-line ak-corner" d="M26 46 Q26 26 46 26 M34 40 Q40 32 46 34 Q40 40 34 40Z" fill="none" pathLength="1" />
        </g>
      ))}
    </svg>
  );
}

function seeded(n, seed) {
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: n }, () => [r(), r(), r()]);
}
const STARS = seeded(46, 7);

function Sky() {
  return (
    <svg className="cel-sky" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {STARS.map(([x, y, s], i) => (
        <circle key={i} className="star" cx={x * 400} cy={y * 520} r={0.6 + s * 1.5} style={{ '--sd': `${Math.round(s * 1400)}ms` }} />
      ))}
      {[
        [70, 120],
        [330, 90],
        [300, 300],
        [60, 380],
      ].map(([x, y], i) => (
        <path
          key={`sp${i}`}
          className="star sparkle"
          style={{ '--sd': `${300 + i * 220}ms` }}
          d={`M${x} ${y - 9} L${x + 2} ${y - 2} L${x + 9} ${y} L${x + 2} ${y + 2} L${x} ${y + 9} L${x - 2} ${y + 2} L${x - 9} ${y} L${x - 2} ${y - 2}Z`}
        />
      ))}
      <polyline className="constellation" points="40,200 92,168 140,186 176,140 226,150 262,112 318,132 360,104" fill="none" pathLength="1" />
      {[
        [40, 200],
        [92, 168],
        [140, 186],
        [176, 140],
        [226, 150],
        [262, 112],
        [318, 132],
        [360, 104],
      ].map(([x, y], i) => (
        <circle key={`c${i}`} className="c-dot" cx={x} cy={y} r="2.2" style={{ '--sd': `${700 + i * 120}ms` }} />
      ))}
    </svg>
  );
}

function DecoBurst() {
  const rays = Array.from({ length: 17 }, (_, i) => (Math.PI * (i + 0.5)) / 17);
  return (
    <svg className="deco-burst" viewBox="0 0 400 220" aria-hidden="true">
      {rays.map((a, i) => (
        <line
          key={i}
          className="ray"
          x1="200"
          y1="215"
          x2={200 - Math.cos(a) * 190}
          y2={215 - Math.sin(a) * 190}
          pathLength="1"
          style={{ '--rd': `${Math.abs(i - 8) * 45}ms` }}
        />
      ))}
      <path className="ray arc" d="M60 215 A140 140 0 0 1 340 215" fill="none" pathLength="1" />
      <path className="ray arc" d="M110 215 A90 90 0 0 1 290 215" fill="none" pathLength="1" />
    </svg>
  );
}

function DecoRule() {
  return (
    <svg className="deco-rule" viewBox="0 0 220 20" aria-hidden="true">
      <path d="M0 10 H86 M134 10 H220" stroke="currentColor" strokeWidth=".8" />
      <path d="M0 14 H80 M140 14 H220" stroke="currentColor" strokeWidth=".5" />
      <path d="M110 2 L118 10 L110 18 L102 10 Z" fill="none" stroke="currentColor" />
      <path d="M110 6 L114 10 L110 14 L106 10 Z" fill="currentColor" />
      <path d="M92 10 L98 6 V14 Z M128 10 L122 6 V14 Z" fill="currentColor" />
    </svg>
  );
}

function Sparkle({ className = '' }) {
  return (
    <svg className={`sparkle-orn ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1 L13.8 10.2 L23 12 L13.8 13.8 L12 23 L10.2 13.8 L1 12 L10.2 10.2Z" fill="currentColor" />
    </svg>
  );
}

function Brush({ className = '' }) {
  return (
    <svg className={`brush ${className}`} viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 14 C40 6 80 18 120 10 C150 5 176 12 196 9 L194 17 C170 20 150 14 120 18 C84 24 44 14 6 20Z" fill="currentColor" />
    </svg>
  );
}

const HEAD_ORNAMENTS = {
  angkor: () => <Lotus className="sh-lotus" />,
  celestial: () => <Sparkle className="sh-spark" />,
  deco: () => <DecoRule />,
  watercolor: () => <Brush className="sh-brush" />,
  film: () => null,
};

/* ---------- Film Diary gallery: scattered snapshots ---------- */
function Snapshots({ photos, L, onOpen }) {
  return (
    <div className="snaps">
      {photos.map((src, i) => (
        <figure key={i + src.slice(-20)} className="snap g-fig" style={{ '--gi': i, '--rot': `${[-4, 3, -2, 5, -5, 2][i % 6]}deg` }}>
          <span className="tape tape-c" aria-hidden="true" />
          <button type="button" className="g-open" onClick={() => onOpen(i)} aria-label={L('viewPhoto', { n: i + 1 })}>
            <Photo src={src} alt={L('galleryPhoto', { n: i + 1 })} className="g-photo" fallback="" />
          </button>
          <figcaption className="snap-cap">#{String(i + 1).padStart(2, '0')}</figcaption>
        </figure>
      ))}
    </div>
  );
}

const GALLERY_KIND = {
  editorial: 'folio',
  deco: 'folio',
  romance: 'carousel',
  angkor: 'carousel',
  celestial: 'carousel',
  botanical: 'garden',
  watercolor: 'garden',
  film: 'carousel',
};

/* ---------- cover variants ---------- */
function Cover({ p, guestName, L, lang }) {
  const c = p.content;
  const d = p.design;
  const date = formatDate(c.date, lang);
  const time = formatTime(c.time, lang);
  const shortDate = formatDate(c.date, lang, 'short');
  const mono = initials(p);
  const alt = `${c.partner1} ${L('and')} ${c.partner2}`;
  const who = guestName || L('honoredGuest');
  const ph = L('photoPlaceholder');
  const extra = EXTRA_COVERS[p.template];
  if (extra) return extra({ c, d, date, time, shortDate, mono, alt, who, ph, L });

  if (p.template === 'romance') {
    return (
      <section className="cover cover-romance" data-sec="cover">
        <Photo src={c.coverPhoto} alt={alt} crop={d.crop} className="cover-bg" fallback={mono} placeholder={ph} />
        <div className="cover-shade" />
        <div className="cover-inner">
          <p className="kicker cv" style={{ '--d': '0ms' }}>{L('celebrationOf')}</p>
          <div className="cv" style={{ '--d': '120ms' }}>
            <Names c={c} L={L} />
          </div>
          <p className="cover-date cv" style={{ '--d': '420ms' }}>
            <DateLine date={date} time={time} L={L} />
          </p>
          <div className="cv" style={{ '--d': '560ms' }}>
            <GuestPlate className="gp-romance" label={L('reservedFor')} name={who} />
          </div>
        </div>
      </section>
    );
  }

  if (p.template === 'botanical') {
    return (
      <section className="cover cover-botanical" data-sec="cover">
        <div className="arch-wrap cv" style={{ '--d': '0ms' }}>
          <Sprig className="sprig-tl" />
          <Sprig className="sprig-tr" flip />
          <Photo src={c.coverPhoto} alt={alt} crop={d.crop} className="arch" fallback={mono} placeholder={ph} />
        </div>
        <p className="kicker cv" style={{ '--d': '200ms' }}>{L('togetherFamilies')}</p>
        <div className="cv" style={{ '--d': '300ms' }}>
          <Names c={c} L={L} />
        </div>
        <p className="cover-date cv" style={{ '--d': '520ms' }}>{date || L('tba')}</p>
        <div className="cv" style={{ '--d': '640ms' }}>
          <GuestPlate className="gp-botanical" label={L('reservedFor')} name={who} />
        </div>
      </section>
    );
  }

  // editorial
  return (
    <section className="cover cover-editorial" data-sec="cover">
      <div className="ed-top cv" style={{ '--d': '0ms' }}>
        <span>{L('folioNo')}</span>
        <span>{L('folio')}</span>
        <span>{shortDate ? shortDate.slice(-4) : ''}</span>
      </div>
      <div className="ed-grid">
        <div className="ed-type">
          <p className="kicker cv" style={{ '--d': '100ms' }}>{L('requestPleasure')}</p>
          <div className="cv" style={{ '--d': '180ms' }}>
            <Names c={c} L={L} />
          </div>
          <p className="cover-date cv" style={{ '--d': '480ms' }}>
            <span className="rule" />
            {shortDate || L('tba')}
            <span className="rule" />
          </p>
        </div>
        <div className="ed-photo cv" style={{ '--d': '300ms' }}>
          <Photo src={c.coverPhoto} alt={alt} crop={d.crop} fallback={mono} placeholder={ph} />
        </div>
      </div>
      <div className="cv" style={{ '--d': '620ms' }}>
        <GuestPlate className="gp-editorial" label={L('reservedFor')} name={who} />
      </div>
    </section>
  );
}

/* ---------- sections ---------- */
function SectionHead({ p, index, label, title }) {
  if (HEAD_ORNAMENTS[p.template]) {
    return (
      <header className={`sh sh-c sh-${p.template}`}>
        {HEAD_ORNAMENTS[p.template]()}
        <span className="sh-label">{label}</span>
        {title ? <h2>{title}</h2> : null}
      </header>
    );
  }
  if (p.template === 'editorial') {
    return (
      <header className="sh sh-ed">
        <span className="sh-num">{ROMAN[index] || index + 1}</span>
        <span className="sh-label">{label}</span>
        {title ? <h2>{title}</h2> : null}
      </header>
    );
  }
  if (p.template === 'botanical') {
    return (
      <header className="sh sh-bo">
        <Sprig className="sh-sprig" />
        <span className="sh-label">{label}</span>
        {title ? <h2>{title}</h2> : null}
      </header>
    );
  }
  return (
    <header className="sh sh-ro">
      <span className="sh-label">{label}</span>
      {title ? <h2>{title}</h2> : null}
      <Flourish />
    </header>
  );
}

/* ---------- gallery ---------- */
const FrameCtx = createContext(null);

/** Full-screen photo viewer, rendered over the visible frame (editor preview or guest page). */
function Lightbox({ photos, start, onClose, L, styleVars }) {
  const scrollRoot = useContext(FrameCtx);
  const [i, setI] = useState(start);
  const closeRef = useRef(null);
  const touch = useRef(null);
  const n = photos.length;
  const go = (d) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const target = scrollRoot?.current?.parentElement;
  if (!target) return null;
  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={L('galleryPhoto', { n: i + 1 })}
      style={styleVars}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <figure className="lb-figure" key={i} onClick={(e) => e.stopPropagation()}>
        <img src={photos[i]} alt={L('galleryPhoto', { n: i + 1 })} />
      </figure>
      <span className="lb-count">
        {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
      </span>
      {n > 1 ? (
        <>
          <button type="button" className="lb-nav lb-prev" onClick={() => go(-1)} aria-label={L('prevPhoto')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button type="button" className="lb-nav lb-next" onClick={() => go(1)} aria-label={L('nextPhoto')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </>
      ) : null}
      <button type="button" className="lb-close" ref={closeRef} onClick={onClose} aria-label={L('closePhoto')}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>,
    target,
  );
}

function GalleryItem({ src, i, L, onOpen, className = '' }) {
  return (
    <figure className={`g-fig ${className}`} style={{ '--gi': i }}>
      <button type="button" className="g-open" onClick={() => onOpen(i)} aria-label={L('viewPhoto', { n: i + 1 })}>
        <Photo src={src} alt={L('galleryPhoto', { n: i + 1 })} className="g-photo" fallback="" />
      </button>
      <figcaption className="g-cap">
        <span className="g-num">{String(i + 1).padStart(2, '0')}</span>
      </figcaption>
    </figure>
  );
}

/** Romance: centred cinematic carousel — the active frame grows, neighbours recede. */
function RomanceCarousel({ photos, L, onOpen }) {
  const track = useRef(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      [...el.children].forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    pick();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [photos.length]);
  const goTo = (i) => {
    const el = track.current;
    const item = el?.children[i];
    if (!item) return;
    el.scrollTo({ left: item.offsetLeft - (el.clientWidth - item.clientWidth) / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  return (
    <div className="carousel">
      <div className="car-track" ref={track}>
        {photos.map((src, i) => (
          <div key={i + src.slice(-20)} className={`car-item ${i === active ? 'is-active' : ''}`} data-i={i} style={{ '--gi': i }}>
            <button type="button" className="g-open" onClick={() => (i === active ? onOpen(i) : goTo(i))} aria-label={L('viewPhoto', { n: i + 1 })}>
              <Photo src={src} alt={L('galleryPhoto', { n: i + 1 })} className="g-photo" fallback="" />
            </button>
          </div>
        ))}
      </div>
      {photos.length > 1 ? (
        <div className="car-controls">
          <button type="button" className="car-btn" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label={L('prevPhoto')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <span className="car-dots" aria-hidden="true">
            {photos.map((_, i) => (
              <i key={i} className={i === active ? 'on' : ''} />
            ))}
          </span>
          <span className="car-count">
            {String(active + 1).padStart(2, '0')} — {String(photos.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="car-btn"
            onClick={() => goTo(Math.min(photos.length - 1, active + 1))}
            disabled={active === photos.length - 1}
            aria-label={L('nextPhoto')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Gallery({ p, index, L, common }) {
  const photos = p.content.gallery;
  const [open, setOpen] = useState(null);
  const scrollRoot = useContext(FrameCtx);
  const canZoom = !!scrollRoot;
  const onOpen = (i) => canZoom && setOpen(i);
  const n = Math.min(photos.length, 5);

  let body;
  const kind = GALLERY_KIND[p.template] || 'folio';
  if (kind === 'carousel') body = <RomanceCarousel photos={photos} L={L} onOpen={onOpen} />;
  else if (kind === 'snaps') body = <Snapshots photos={photos} L={L} onOpen={onOpen} />;
  else if (kind === 'garden')
    body = (
      <div className={`garden g-n${n}`}>
        {photos.map((src, i) => (
          <GalleryItem key={i + src.slice(-20)} src={src} i={i} L={L} onOpen={onOpen} />
        ))}
      </div>
    );
  else
    body = (
      <div className={`folio g-n${n}`}>
        {photos.map((src, i) => (
          <GalleryItem key={i + src.slice(-20)} src={src} i={i} L={L} onOpen={onOpen} className={i === 0 ? 'is-lead' : ''} />
        ))}
      </div>
    );

  return (
    <section {...common}>
      <SectionHead p={p} index={index} label={L('moments')} title={L('favFrames')} />
      {body}
      {canZoom ? <p className="g-hint">{L('tapToView')}</p> : null}
      {open != null ? <Lightbox photos={photos} start={open} onClose={() => setOpen(null)} L={L} styleVars={inviteStyle(p)} /> : null}
    </section>
  );
}

function hasContent(p, key) {
  const c = p.content;
  if (key === 'story') return !!c.story.trim();
  if (key === 'schedule') return c.schedule.length > 0;
  if (key === 'gallery') return c.gallery.length > 0;
  if (key === 'location') return !!(c.venueName || c.venueAddress || isValidUrl(c.mapUrl));
  return true;
}

function Section({ p, sectionKey, index, guestName, L, lang }) {
  const c = p.content;
  if (!hasContent(p, sectionKey)) return null;
  const common = { className: `sec sec-${sectionKey} rv`, 'data-sec': sectionKey };
  switch (sectionKey) {
    case 'greeting':
      return (
        <section {...common}>
          <SectionHead p={p} index={index} label={L('invitationLabel')} />
          <p className="greet-dear">{L('dear', { name: guestName || L('dearDefault') })}</p>
          <p className="greet-body">{c.greeting}</p>
        </section>
      );
    case 'details': {
      const items = [
        [L('date'), formatDate(c.date, lang) || L('tbaShort')],
        [L('time'), formatTime(c.time, lang) || L('tbaShort')],
        [L('venue'), c.venueName || L('tbaShort'), c.venueAddress],
      ];
      return (
        <section {...common}>
          <SectionHead p={p} index={index} label={L('theDetails')} title={L('whenWhere')} />
          <dl className="details">
            {items.map(([k, v, sub]) => (
              <div className="detail" key={k}>
                <dt>{k}</dt>
                <dd>
                  {v}
                  {sub ? <small>{sub}</small> : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    }
    case 'story':
      return (
        <section {...common}>
          <SectionHead p={p} index={index} label={L('ourStory')} title={c.storyTitle} />
          <p className="story">{c.story}</p>
        </section>
      );
    case 'schedule':
      return (
        <section {...common}>
          <SectionHead p={p} index={index} label={L('theDay')} title={L('order')} />
          <ol className="schedule">
            {c.schedule.map((s) => (
              <li key={s.id}>
                <span className="s-time">{formatTime(s.time, lang) || s.time || '—'}</span>
                <span className="s-body">
                  <span className="s-title">{s.title || L('untitled')}</span>
                  {s.note ? <span className="s-note">{s.note}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </section>
      );
    case 'gallery':
      return <Gallery p={p} index={index} L={L} common={common} />;
    case 'location': {
      const ok = isValidUrl(c.mapUrl);
      return (
        <section {...common}>
          <SectionHead p={p} index={index} label={L('findingUs')} title={c.venueName || L('theVenue')} />
          <div className="loc">
            <svg className="pin" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {c.venueAddress ? <p className="loc-addr">{c.venueAddress}</p> : null}
            {ok ? (
              <a className="inv-btn" href={c.mapUrl} target="_blank" rel="noopener noreferrer">
                {L('openMaps')}
              </a>
            ) : null}
          </div>
        </section>
      );
    }
    case 'closing':
      return (
        <section {...common}>
          <p className="closing">{c.closing}</p>
          <p className="sign">{L('withLove')}</p>
          <p className={`sign-names ${nameSize(c)}`}>
            <NamePair a={c.partner1 || L('partner')} b={c.partner2 || L('partner')} />
          </p>
          <span className="mono-seal" aria-hidden="true">
            <svg className="seal-heart" viewBox="0 0 24 24">
              <path d="M12 20.6s-7.6-4.7-9.4-9.3C1.4 8.1 3.3 4.6 6.7 4.4c2.1-.1 3.6 1 4.4 2.5.2.4.6.4.8 0 .8-1.5 2.3-2.6 4.4-2.5 3.4.2 5.3 3.7 4.1 6.9-1.8 4.6-9.4 9.3-9.4 9.3Z" />
            </svg>
          </span>
        </section>
      );
    default:
      return null;
  }
}

/* ---------- envelope artwork (original, Khmer-inspired) ---------- */
function CornerOrnament({ className = '' }) {
  return (
    <svg className={`env-corner ${className}`} viewBox="0 0 140 140" aria-hidden="true">
      <g fill="currentColor">
        {/* rosette at the corner */}
        <g transform="translate(34 34)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
            <ellipse key={r} cx="0" cy="-12" rx="5.2" ry="11" transform={`rotate(${r})`} opacity={r % 90 === 0 ? 0.95 : 0.7} />
          ))}
          <circle r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle r="3.2" />
        </g>
        {/* flame leaf pointing inward */}
        <path d="M50 50 C64 54 74 66 74 84 C66 76 58 74 54 66 C56 74 54 80 48 86 C46 74 46 62 50 50Z" opacity=".9" />
        {/* scroll along the top edge */}
        <path d="M58 22 C70 10 92 10 96 24 C99 34 86 38 82 30 C79 24 86 20 89 25" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M98 24 C108 14 122 16 132 10 C126 22 114 28 98 24Z" />
        <path d="M74 14 C80 6 90 4 96 6 C90 10 82 14 74 14Z" opacity=".75" />
        {/* scroll along the left edge (mirror) */}
        <path d="M22 58 C10 70 10 92 24 96 C34 99 38 86 30 82 C24 79 20 86 25 89" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M24 98 C14 108 16 122 10 132 C22 126 28 114 24 98Z" />
        <path d="M14 74 C6 80 4 90 6 96 C10 90 14 82 14 74Z" opacity=".75" />
        {/* small leaves around the rosette */}
        <path d="M54 30 C62 26 70 28 74 34 C66 36 60 36 54 30Z" opacity=".8" />
        <path d="M30 54 C26 62 28 70 34 74 C36 66 36 60 30 54Z" opacity=".8" />
      </g>
    </svg>
  );
}

function FlameMotif({ className = '' }) {
  return (
    <svg className={`flame-motif ${className}`} viewBox="0 0 100 120" aria-hidden="true">
      <path
        d="M50 4 C56 20 70 28 66 46 C76 40 82 30 80 20 C92 34 90 56 74 66 C84 66 92 60 96 54 C96 76 78 92 56 94 L50 116 L44 94 C22 92 4 76 4 54 C8 60 16 66 26 66 C10 56 8 34 20 20 C18 30 24 40 34 46 C30 28 44 20 50 4Z"
        fill="currentColor"
      />
      <path
        d="M50 24 C54 36 60 44 58 58 C54 52 52 50 50 44 C48 50 46 52 42 58 C40 44 46 36 50 24Z M50 66 C58 70 64 76 64 86 C58 82 54 80 50 76 C46 80 42 82 36 86 C36 76 42 70 50 66Z"
        fill="none"
        stroke="var(--flame-line, rgba(255,255,255,.35))"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function EnvDecor() {
  return (
    <div className="env-decor" aria-hidden="true">
      <span className="env-rule env-rule-1" />
      <span className="env-rule env-rule-2" />
      <CornerOrnament className="c-tl" />
      <CornerOrnament className="c-tr" />
      <CornerOrnament className="c-bl" />
      <CornerOrnament className="c-br" />
      <FlameMotif className="emboss e-top" />
      <FlameMotif className="emboss e-left" />
      <FlameMotif className="emboss e-right" />
    </div>
  );
}

/** Gold filigree along both edges of the flap: a fine vine with alternating curls, and a flame at its point. */
function FlapFiligree() {
  const W = 145;
  const H = 58;
  const ang = Math.atan2(H, W / 2);
  const deg = (ang * 180) / Math.PI;
  const curls = [];
  const steps = 9;
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < steps; i++) {
      const t = 0.1 + (i / steps) * 0.68;
      const x0 = side === 0 ? t * (W / 2) : W - t * (W / 2);
      const y0 = t * H;
      const k = 1 - t * 0.55; // tendrils taper toward the point
      const up = i % 2 === 0 ? -1 : 1;
      curls.push(
        <g key={`${side}-${i}`} transform={`translate(${x0.toFixed(2)} ${y0.toFixed(2)}) rotate(${side === 0 ? deg : -deg}) scale(${side === 0 ? 1 : -1} ${up}) scale(${k.toFixed(2)})`}>
          <path d="M0 -2.6 C1.5 -6.2 5.2 -6.8 6.8 -4.6 C8 -2.9 6.3 -1.4 5.1 -2.4 C4.3 -3.1 5 -4 5.7 -3.7" fill="none" stroke="currentColor" strokeWidth=".42" strokeLinecap="round" />
          <path d="M-0.6 -2.6 C-2.6 -4.8 -2.2 -7 0.4 -7.6 C0.2 -5.8 -0.2 -4.2 -0.6 -2.6Z" />
          <circle cx="3.6" cy="-7.2" r=".42" />
        </g>,
      );
    }
  }
  const off = 2.6;
  return (
    <svg className="flap-filigree" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <g fill="currentColor">
        <path d={`M${6} ${off * 0.4} L${W / 2} ${H - off * 2.4} L${W - 6} ${off * 0.4}`} fill="none" stroke="currentColor" strokeWidth=".38" />
        <path d={`M${3} 0.4 L${W / 2} ${H - 1.2} L${W - 3} 0.4`} fill="none" stroke="currentColor" strokeWidth=".22" opacity=".6" />
        {curls}
      </g>
      <g transform={`translate(${W / 2 - 9} ${H - 33}) scale(.18)`} className="flap-flame">
        <path
          d="M50 4 C56 20 70 28 66 46 C76 40 82 30 80 20 C92 34 90 56 74 66 C84 66 92 60 96 54 C96 76 78 92 56 94 L50 116 L44 94 C22 92 4 76 4 54 C8 60 16 66 26 66 C10 56 8 34 20 20 C18 30 24 40 34 46 C30 28 44 20 50 4Z"
          fill="currentColor"
        />
        <path d="M50 24 C54 36 60 44 58 58 C54 52 52 50 50 44 C48 50 46 52 42 58 C40 44 46 36 50 24Z" fill="#F2E8D6" opacity=".55" />
      </g>
    </svg>
  );
}

/** Gold wax seal with an irregular poured edge and a pressed heart. */
function WaxSeal() {
  const gid = useId().replace(/:/g, '');
  const pts = [];
  const N = 36;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = 46 + Math.sin(a * 7) * 1.8 + Math.sin(a * 13 + 1) * 1.2;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return (
    <svg className="wax" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id={`wx${gid}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#F6E2A8" />
          <stop offset=".45" stopColor="#D8B062" />
          <stop offset=".8" stopColor="#B48638" />
          <stop offset="1" stopColor="#8E6526" />
        </radialGradient>
      </defs>
      <polygon points={pts.join(' ')} fill={`url(#wx${gid})`} />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#9A7230" strokeWidth="2.2" opacity=".55" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="#FFF1C4" strokeWidth="1" opacity=".45" />
      <path
        className="wax-heart"
        transform="translate(50 52) scale(1.55) translate(-12 -12)"
        d="M12 20.6s-7.6-4.7-9.4-9.3C1.4 8.1 3.3 4.6 6.7 4.4c2.1-.1 3.6 1 4.4 2.5.2.4.6.4.8 0 .8-1.5 2.3-2.6 4.4-2.5 3.4.2 5.3 3.7 4.1 6.9-1.8 4.6-9.4 9.3-9.4 9.3Z"
      />
    </svg>
  );
}

/* ---------- redesigned templates: photo-first covers ---------- */
function HeroPhoto({ c, d, alt, mono, ph, className = '' }) {
  return (
    <div className={`hero ${className}`}>
      <Photo src={c.coverPhoto} alt={alt} crop={d.crop} className="hero-img" fallback={mono} placeholder={ph} />
    </div>
  );
}

function CoverText({ kicker, c, date, time, who, L, plate, plateLabel, extra }) {
  return (
    <div className="hx-text">
      {extra}
      <p className="kicker cv" style={{ '--d': '200ms' }}>{kicker}</p>
      <div className="cv" style={{ '--d': '300ms' }}>
        <Names c={c} L={L} />
      </div>
      <p className="cover-date cv" style={{ '--d': '560ms' }}>
        <DateLine date={date} time={time} L={L} />
      </p>
      <div className="cv" style={{ '--d': '700ms' }}>
        <GuestPlate className={plate} label={plateLabel || L('reservedFor')} name={who} />
      </div>
    </div>
  );
}

const EXTRA_COVERS = {
  editorial: ({ c, d, date, time, mono, alt, who, ph, L }) => (
    <section className="cover cover-hx cover-ivory" data-sec="cover">
      <HeroPhoto c={c} d={d} alt={alt} mono={mono} ph={ph} />
      <CoverText kicker={L('requestPleasure')} c={c} date={date} time={time} who={who} L={L} plate="gp-ivory" />
    </section>
  ),
  botanical: ({ c, d, date, time, mono, alt, who, ph, L }) => (
    <section className="cover cover-hx cover-garden" data-sec="cover">
      <HeroPhoto c={c} d={d} alt={alt} mono={mono} ph={ph} />
      <Sprig className="garden-sprig gs-l" />
      <Sprig className="garden-sprig gs-r" flip />
      <CoverText kicker={L('togetherFamilies')} c={c} date={date} time={time} who={who} L={L} plate="gp-garden" />
    </section>
  ),
  angkor: ({ c, d, date, time, mono, alt, who, ph, L }) => (
    <section className="cover cover-hx cover-royal" data-sec="cover">
      <HeroPhoto c={c} d={d} alt={alt} mono={mono} ph={ph} />
      <div className="royal-panel">
        <FlameMotif className="royal-flame" />
        <CornerOrnament className="env-corner c-bl royal-corner" />
        <CornerOrnament className="env-corner c-br royal-corner" />
        <CoverText kicker={L('celebrationOf')} c={c} date={date} time={time} who={who} L={L} plate="gp-royal" />
      </div>
    </section>
  ),
  celestial: ({ c, d, date, time, mono, alt, who, ph, L }) => (
    <section className="cover cover-hx cover-star" data-sec="cover">
      <HeroPhoto c={c} d={d} alt={alt} mono={mono} ph={ph} />
      <div className="star-shade" />
      <Sky />
      <CoverText
        kicker={L('togetherFamilies')}
        c={c}
        date={date}
        time={time}
        who={who}
        L={L}
        plate="gp-star"
        extra={<span className="star-moon cv" style={{ '--d': '100ms' }} aria-hidden="true" />}
      />
    </section>
  ),
  deco: ({ c, d, date, time, mono, alt, who, ph, L }) => (
    <section className="cover cover-hx cover-gdeco" data-sec="cover">
      <HeroPhoto c={c} d={d} alt={alt} mono={mono} ph={ph} />
      <div className="gdeco-shade" />
      <span className="gdeco-frame" aria-hidden="true" />
      <span className="deco-corner tl" aria-hidden="true" />
      <span className="deco-corner tr" aria-hidden="true" />
      <span className="deco-corner bl" aria-hidden="true" />
      <span className="deco-corner br" aria-hidden="true" />
      <div className="gd-burst" aria-hidden="true">
        <DecoBurst />
      </div>
      <CoverText
        kicker={L('requestPleasure')}
        c={c}
        date={date}
        time={time}
        who={who}
        L={L}
        plate="gp-gdeco"
        extra={
          <div className="cv" style={{ '--d': '820ms' }}>
            <DecoRule />
          </div>
        }
      />
    </section>
  ),
  watercolor: ({ c, d, date, time, mono, alt, who, ph, L }) => (
    <section className="cover cover-hx cover-blush" data-sec="cover">
      <svg className="wc-defs" aria-hidden="true" focusable="false">
        <filter id="wc-rough">
          <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="38" />
        </filter>
      </svg>
      <span className="wc-wash wc-a" aria-hidden="true" />
      <span className="wc-wash wc-b" aria-hidden="true" />
      <HeroPhoto c={c} d={d} alt={alt} mono={mono} ph={ph} className="blush-card" />
      <CoverText kicker={L('togetherFamilies')} c={c} date={date} time={time} who={who} L={L} plate="gp-blush" />
    </section>
  ),
  film: ({ c, d, date, time, mono, alt, who, ph, L }) => (
    <section className="cover cover-hx cover-cinema" data-sec="cover">
      <HeroPhoto c={c} d={d} alt={alt} mono={mono} ph={ph} />
      <div className="cine-shade" />
      <div className="cine-bar cine-top" aria-hidden="true">
        <span>{L('aLoveStory')}</span>
      </div>
      <div className="cine-bar cine-bottom" aria-hidden="true" />
      <CoverText kicker={L('celebrationOf')} c={c} date={date} time={time} who={who} L={L} plate="gp-cinema" plateLabel={L('admitOne')} />
    </section>
  ),
};

/* ---------- envelope ---------- */
function Envelope({ p, guestName, phase, onOpen, L }) {
  return (
    <div className={`env-stage phase-${phase}`} aria-hidden={phase === 'open'}>
      <EnvDecor />
      <div className="env-wrap">
        <div className="env-for">
          <span className="env-for-label">{L('youAreInvited')}</span>
          {guestName ? <strong className="env-for-name">{guestName}</strong> : null}
        </div>
        <div className="env" onClick={phase === 'closed' ? onOpen : undefined}>
          <div className="env-back">
            <span className="env-liner" />
          </div>
          <div className="env-card">
            <FlameMotif className="env-card-flame" />
            <span className="env-card-k">{L('weddingOf')}</span>
            <span className={`env-card-n ${nameSize(p.content)}`}>
              <NamePair a={p.content.partner1 || L('partner')} b={p.content.partner2 || L('partner')} />
            </span>
          </div>
          <div className="env-pocket" />
          <div className="env-flap">
            <span className="flap-face flap-front">
              <FlapFiligree />
            </span>
            <span className="flap-face flap-back" />
          </div>
          <div className="env-seal" aria-hidden="true">
            <WaxSeal />
          </div>
        </div>
        <button type="button" className="env-open" onClick={onOpen} disabled={phase !== 'closed'}>
          {L('openInvitation')}
        </button>
      </div>
    </div>
  );
}

/* ---------- main renderer ---------- */
export function inviteStyle(p) {
  const d = p.design;
  const f = FONT_PAIRS[d.fontPair] || FONT_PAIRS.classic;
  return {
    '--bg': d.palette.bg,
    '--ink': d.palette.ink,
    '--accent': d.palette.accent,
    '--gold': d.palette.gold,
    '--f-display': f.display,
    '--f-names': f.names,
    '--f-body': f.body,
    '--names-style': f.namesStyle,
  };
}

/**
 * Invitation renderer. Rendered inside a scroll container that has `container-type: size`
 * so the cover can fill the visible frame (100cqh) both in the editor and on the guest page.
 */
export function Invitation({ p, guestName, envelope = true, scrollRoot, replayKey = 0, startOpen = false, coverOnly = false, lang: langProp }) {
  const lang = langProp || p.design.lang || 'en';
  const L = (key, vars) => inv(lang, key, vars);
  // typed text in the language being shown (falls back to the main language)
  p = { ...p, content: localizeContent(p, lang) };
  const [phase, setPhase] = useState(envelope && !startOpen ? 'closed' : 'open');
  const rootRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    setPhase(envelope && !startOpen ? 'closed' : 'open');
    if (scrollRoot?.current) scrollRoot.current.scrollTop = 0;
  }, [replayKey, envelope]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const open = () => {
    if (phase !== 'closed') return;
    if (prefersReducedMotion()) {
      setPhase('open');
      return;
    }
    setPhase('opening'); // seal fades, flap lifts, card rises
    timers.current = [setTimeout(() => setPhase('leaving'), 1250), setTimeout(() => setPhase('open'), 1700)];
  };

  // Section reveal on scroll. Content stays visible without JS / with reduced motion.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || phase !== 'open') return;
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    root.classList.add('rv-ready');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { root: scrollRoot?.current || null, threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    root.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  });

  const sections = p.design.sections.filter((s) => s.visible && hasContent(p, s.key));
  let n = 0;

  return (
    <div
      ref={rootRef}
      lang={lang}
      className={`inv lang-${lang} t-${p.template} bg-${p.design.background} ${phase === 'open' ? 'is-open' : 'is-sealed'} ${phase === 'leaving' ? 'is-revealing' : ''}`}
      style={inviteStyle(p)}
    >
      <FrameCtx.Provider value={scrollRoot || null}>
      {envelope && phase !== 'open' ? <Envelope p={p} guestName={guestName} phase={phase} onOpen={open} L={L} /> : null}
      <div className="inv-body" key={`${p.template}-${lang}`}>
        <Cover p={p} guestName={guestName} L={L} lang={lang} />
        {!coverOnly &&
          sections.map((s) => {
            const el = <Section key={s.key} p={p} sectionKey={s.key} index={n} guestName={guestName} L={L} lang={lang} />;
            if (s.key !== 'closing' && s.key !== 'greeting') n += 1;
            return el;
          })}
        {!coverOnly && <footer className="inv-foot">{L('madeWith')}</footer>}
      </div>
      </FrameCtx.Provider>
    </div>
  );
}
