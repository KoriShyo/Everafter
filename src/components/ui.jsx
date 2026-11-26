import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { dismissToast, useSaveState, useToasts } from '../store.js';
import { Invitation } from './Invitation.jsx';
import { setUiLang, useT, useUiLang } from '../i18n.js';

const paths = {
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  copy: 'M9 9h10v11H9zM5 15H4V4h11v1',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back: 'M15 6l-6 6 6 6',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  desktop: 'M3 5h18v11H3zM8 20h8M12 16v4',
  phone: 'M7 3h10v18H7zM11 18h2',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M18 13l-6 6-6-6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  close: 'M6 6l12 12M18 6L6 18',
  replay: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5',
  palette: 'M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-4 3.5h-2a2 2 0 0 0-1.5 3.3c.6.8.1 2.2-1.5 2.2ZM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01M17 11.5h.01',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5h.01',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  chevron: 'M9 6l6 6-6 6',
};

export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

export function LangSwitch({ value, onChange, label }) {
  const t = useT();
  const ui = useUiLang();
  const current = value ?? ui;
  const set = onChange ?? setUiLang;
  return (
    <div className="lang-switch" role="radiogroup" aria-label={label || t('Interface language')}>
      {[
        ['en', 'EN'],
        ['km', 'ខ្មែរ'],
      ].map(([k, l]) => (
        <button key={k} type="button" role="radio" aria-checked={current === k} className={current === k ? 'on' : ''} lang={k} onClick={() => set(k)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Logo() {
  return (
    <a href="#/" className="logo" aria-label="Everafter Studio — dashboard">
      <span className="logo-mark" aria-hidden="true">E</span>
      <span className="logo-text">
        Everafter <em>Studio</em>
      </span>
    </a>
  );
}

export function Toasts() {
  const toasts = useToasts();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <Icon name="check" size={16} />
          <span>{t.message}</span>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action.run();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function SaveIndicator() {
  const s = useSaveState();
  const t = useT();
  if (s.status === 'error') {
    return (
      <span className="save save-error" role="alert" title={t(s.error)}>
        <span className="save-dot" /> {t('Not saved')} — {t(s.error)}
      </span>
    );
  }
  return (
    <span className={`save save-${s.status}`} aria-live="polite">
      {s.status === 'saving' ? (
        <>
          <span className="save-dot" /> {t('Saving…')}
        </>
      ) : (
        <>
          <Icon name="check" size={14} /> {t('Saved on this device')}
        </>
      )}
    </span>
  );
}

/** Accessible bottom sheet (mobile design controls). */
export function Sheet({ open, onClose, title, children }) {
  const ref = useRef(null);
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const el = ref.current;
    el?.querySelector('button, input, select, textarea, [tabindex]')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll('button:not([disabled]), input, select, textarea, a[href]')];
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  return (
    <div className={`sheet-layer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref} inert={open ? undefined : ''}>
        <div className="sheet-head">
          <span className="sheet-grab" aria-hidden="true" />
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('Close design controls')}>
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** Scaled-down live render of an invitation cover, for cards & template pickers. */
export function CoverThumb({ p, width = 420, height = 620 }) {
  const box = useRef(null);
  const [scale, setScale] = useState(0.5);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / width);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div className="thumb" ref={box} style={{ aspectRatio: `${width} / ${height}` }} aria-hidden="true">
      <div className="thumb-inner inv-frame" style={{ width, height, transform: `scale(${scale})` }} inert="">
        <Invitation p={p} envelope={false} startOpen coverOnly />
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children, id }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p className="field-error" id={`${id}-err`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
