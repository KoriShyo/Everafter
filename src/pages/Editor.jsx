import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BACKGROUNDS, contrast, designForTemplate, fieldIn, FONT_PAIRS, isValidUrl, mainLang, scheduleIn, SECTION_LABELS, TEMPLATES, TR_FIELDS, uid } from '../data.js';
import { useT } from '../i18n.js';
import {
  imageFileToDataUrl,
  prefersReducedMotion,
  setContent,
  setDesign,
  setContentIn,
  setInviteLang,
  setScheduleIn,
  toast,
  undo,
  updateProject,
  useCanUndo,
} from '../store.js';
import { Invitation } from '../components/Invitation.jsx';
import { Field, Icon, LangSwitch, Sheet } from '../components/ui.jsx';

/* ================= Left: content panels ================= */
function Panel({ id, title, open, onToggle, children, summary }) {
  return (
    <section className={`panel ${open ? 'open' : ''}`}>
      <h3>
        <button type="button" aria-expanded={open} aria-controls={`pn-${id}`} onClick={onToggle}>
          <span className="panel-title">{title}</span>
          {summary ? <span className="panel-sum">{summary}</span> : null}
          <Icon name="chevron" size={15} className="panel-chev" />
        </button>
      </h3>
      <div className="panel-body" id={`pn-${id}`} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

/** Which language's text the left panel is editing. */
const EditLangCtx = createContext('en');

function TextInput({ p, k, label, type = 'text', multiline, hint, placeholder, error }) {
  const lang = useContext(EditLangCtx);
  const id = `e-${k}`;
  const translatable = TR_FIELDS.includes(k);
  const isMain = lang === mainLang(p);
  const props = {
    id,
    lang: translatable ? lang : undefined,
    value: translatable ? fieldIn(p, lang, k) : p.content[k],
    // in the second language, show the main-language text as a guide
    placeholder: translatable && !isMain ? p.content[k] || placeholder : placeholder,
    'aria-invalid': !!error,
    onChange: (e) =>
      translatable ? setContentIn(p.id, lang, { [k]: e.target.value }, `c.${lang}.${k}`) : setContent(p.id, { [k]: e.target.value }, `c.${k}`),
  };
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {multiline ? <textarea rows={multiline} {...props} /> : <input type={type} {...props} />}
    </Field>
  );
}

function PhotoPicker({ label, onFile, busy, multiple = false }) {
  const t = useT();
  const ref = useRef(null);
  return (
    <>
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => ref.current?.click()} disabled={busy}>
        <Icon name="image" size={15} /> {busy ? t('Preparing…') : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFile([...e.target.files]);
          e.target.value = '';
        }}
      />
    </>
  );
}

function ContentPanels({ p, openPanel, setOpenPanel, editLang, setEditLang }) {
  const t = useT();
  const isMain = editLang === mainLang(p);
  const c = p.content;
  const [busy, setBusy] = useState('');
  const [photoError, setPhotoError] = useState('');
  const toggle = (id) => setOpenPanel(openPanel === id ? null : id);

  const handleCover = async ([file]) => {
    if (!file) return;
    setBusy('cover');
    setPhotoError('');
    try {
      const url = await imageFileToDataUrl(file);
      setContent(p.id, { coverPhoto: url }, null);
      setDesign(p.id, { crop: { x: 50, y: 45, zoom: 1 } }, null);
    } catch (e) {
      setPhotoError(t(e.message));
    }
    setBusy('');
  };
  const handleGallery = async (files) => {
    if (!files.length) return;
    setBusy('gallery');
    setPhotoError('');
    try {
      const urls = [];
      for (const f of files.slice(0, 8)) urls.push(await imageFileToDataUrl(f, 1200, 0.8));
      setContent(p.id, { gallery: [...c.gallery, ...urls].slice(0, 12) }, null);
    } catch (e) {
      setPhotoError(t(e.message));
    }
    setBusy('');
  };
  const sched = (fn) => setContent(p.id, { schedule: fn(c.schedule) }, null);
  const setItem = (id, k, v) => setScheduleIn(p.id, editLang, id, k, v, `sch.${editLang}.${id}.${k}`);
  const required = (v) => (isMain && !v.trim() ? t('A name is required.') : '');

  return (
    <div className="panels">
      <div className={`edit-lang ${isMain ? '' : 'is-second'}`}>
        <div className="edit-lang-row">
          <span className="edit-lang-label">{t('Editing language')}</span>
          <LangSwitch label={t('Editing language')} value={editLang} onChange={setEditLang} />
        </div>
        <p className="field-hint">
          {isMain
            ? t('You are writing the main version. Switch to add the other language.')
            : t('You are writing the {lang} version. Empty fields show the main-language text.', { lang: editLang === 'km' ? 'ខ្មែរ' : 'English' })}
        </p>
        <p className="field-hint">{t('Date, time, map and photos are shared by both languages.')}</p>
      </div>
      <Panel id="couple" title={t('Couple’s names')} summary={`${c.partner1 || '—'} & ${c.partner2 || '—'}`} open={openPanel === 'couple'} onToggle={() => toggle('couple')}>
        <TextInput p={p} k="partner1" label={t('First partner')} error={required(fieldIn(p, editLang, 'partner1'))} />
        <TextInput p={p} k="partner2" label={t('Second partner')} error={required(fieldIn(p, editLang, 'partner2'))} />
      </Panel>
      <Panel id="greeting" title={t('Greeting')} open={openPanel === 'greeting'} onToggle={() => toggle('greeting')}>
        <TextInput p={p} k="greeting" label={t('Invitation message')} multiline={5} hint={t('Each guest sees their own name above this message.')} />
      </Panel>
      <Panel id="details" title={t('Date & time')} open={openPanel === 'details'} onToggle={() => toggle('details')}>
        <div className="grid-2">
          <TextInput p={p} k="date" label={t('Date')} type="date" />
          <TextInput p={p} k="time" label={t('Time')} type="time" />
        </div>
      </Panel>
      <Panel id="location" title={t('Venue & map')} open={openPanel === 'location'} onToggle={() => toggle('location')}>
        <TextInput p={p} k="venueName" label={t('Venue name')} />
        <TextInput p={p} k="venueAddress" label={t('Address')} />
        <TextInput
          p={p}
          k="mapUrl"
          label={t('Map link')}
          type="url"
          placeholder="https://maps.google.com/…"
          error={c.mapUrl && !isValidUrl(c.mapUrl) ? t('This doesn’t look like a full link (https://…).') : ''}
          hint={t('Guests get an “Open in Maps” button.')}
        />
      </Panel>
      <Panel id="cover" title={t('Cover photo')} open={openPanel === 'cover'} onToggle={() => toggle('cover')}>
        <div className="photo-row">
          {c.coverPhoto ? <img className="mini-photo" src={c.coverPhoto} alt={t('Current cover')} /> : <span className="mini-photo empty">{t('No photo')}</span>}
          <div className="photo-row-actions">
            <PhotoPicker label={c.coverPhoto ? t('Replace photo') : t('Upload photo')} onFile={handleCover} busy={busy === 'cover'} />
            {c.coverPhoto ? (
              <button type="button" className="btn btn-sm btn-text" onClick={() => setContent(p.id, { coverPhoto: '' }, null)}>
                {t('Remove')}
              </button>
            ) : null}
          </div>
        </div>
        <p className="field-hint">{t('Adjust framing under Design → Photo crop.')}</p>
        {photoError ? (
          <p className="field-error" role="alert">
            {photoError}
          </p>
        ) : null}
      </Panel>
      <Panel id="gallery" title={t('Photo gallery')} summary={t('{n} photos', { n: c.gallery.length })} open={openPanel === 'gallery'} onToggle={() => toggle('gallery')}>
        {c.gallery.length ? (
          <ul className="gal-list">
            {c.gallery.map((src, i) => (
              <li key={i + src.slice(-20)}>
                <img src={src} alt={t('Gallery photo {n}', { n: i + 1 })} />
                <button
                  type="button"
                  className="gal-remove"
                  aria-label={t('Remove gallery photo {n}', { n: i + 1 })}
                  onClick={() => setContent(p.id, { gallery: c.gallery.filter((_, j) => j !== i) }, null)}
                >
                  <Icon name="close" size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="field-hint">{t('No gallery photos yet. The gallery section stays hidden until you add some.')}</p>
        )}
        <PhotoPicker label={t('Add photos')} onFile={handleGallery} busy={busy === 'gallery'} multiple />
        {photoError ? (
          <p className="field-error" role="alert">
            {photoError}
          </p>
        ) : null}
      </Panel>
      <Panel id="story" title={t('Our story')} open={openPanel === 'story'} onToggle={() => toggle('story')}>
        <TextInput p={p} k="storyTitle" label={t('Heading')} />
        <TextInput p={p} k="story" label={t('Story')} multiline={6} hint={t('Leave empty to hide this section.')} />
      </Panel>
      <Panel id="schedule" title={t('Schedule')} summary={t('{n} moments', { n: c.schedule.length })} open={openPanel === 'schedule'} onToggle={() => toggle('schedule')}>
        <ol className="sched-edit">
          {c.schedule.map((s, i) => (
            <li key={s.id}>
              <div className="sched-row">
                <input type="time" aria-label={t('Time for moment {n}', { n: i + 1 })} value={s.time} onChange={(e) => setItem(s.id, 'time', e.target.value)} />
                <input type="text" aria-label={t('Title for moment {n}', { n: i + 1 })} lang={editLang} placeholder={isMain ? t('Ceremony') : s.title || t('Ceremony')} value={scheduleIn(p, editLang, s, 'title')} onChange={(e) => setItem(s.id, 'title', e.target.value)} />
              </div>
              <input type="text" aria-label={t('Note for moment {n}', { n: i + 1 })} lang={editLang} placeholder={isMain ? t('Note (optional)') : s.note || t('Note (optional)')} value={scheduleIn(p, editLang, s, 'note')} onChange={(e) => setItem(s.id, 'note', e.target.value)} />
              <button type="button" className="btn btn-sm btn-text" onClick={() => sched((l) => l.filter((x) => x.id !== s.id))}>
                {t('Remove')}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => sched((l) => [...l, { id: uid(6), time: '', title: '', note: '' }])}>
          <Icon name="plus" size={15} /> {t('Add moment')}
        </button>
      </Panel>
      <Panel id="closing" title={t('Closing note')} open={openPanel === 'closing'} onToggle={() => toggle('closing')}>
        <TextInput p={p} k="closing" label={t('Closing message')} multiline={3} />
      </Panel>
    </div>
  );
}

/* ================= Right: design controls ================= */
function useFlip(listRef, deps) {
  const rects = useRef(new Map());
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const items = [...el.children];
    if (!prefersReducedMotion()) {
      items.forEach((node) => {
        const prev = rects.current.get(node.dataset.key);
        const now = node.getBoundingClientRect();
        if (prev && Math.abs(prev.top - now.top) > 1) {
          node.animate(
            [
              { transform: `translateY(${prev.top - now.top}px)`, background: 'var(--gold-soft)' },
              { transform: 'translateY(0)', background: 'transparent' },
            ],
            { duration: 280, easing: 'cubic-bezier(.2,.7,.2,1)' },
          );
        }
      });
    }
    rects.current = new Map(items.map((n) => [n.dataset.key, n.getBoundingClientRect()]));
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

function DesignControls({ p }) {
  const t = useT();
  const d = p.design;
  const pal = d.palette;
  const listRef = useRef(null);
  useFlip(listRef, [d.sections.map((s) => s.key).join()]);

  const setPalette = (patch, group = 'palette') => setDesign(p.id, { palette: { ...pal, ...patch } }, group);
  const move = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= d.sections.length) return;
    const next = [...d.sections];
    [next[i], next[j]] = [next[j], next[i]];
    setDesign(p.id, { sections: next }, null);
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-key="${next[j].key}"] .mv-${delta < 0 ? 'up' : 'down'}`)?.focus());
  };
  const ratio = contrast(pal.ink, pal.bg);

  return (
    <div className="design">
      <section className="dgroup">
        <h3>{t('Invitation language')}</h3>
        <LangSwitch label={t('Invitation language')} value={d.lang || 'en'} onChange={(l) => setInviteLang(p.id, l)} />
        <p className="field-hint">{t('The language guests see first. They can still switch on their invitation.')}</p>
      </section>

      <section className="dgroup">
        <h3>{t('Template')}</h3>
        <div className="tpl-mini" role="radiogroup" aria-label={t('Template')}>
          {Object.entries(TEMPLATES).map(([k, tpl]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={p.template === k}
              className={p.template === k ? 'on' : ''}
              onClick={() => p.template !== k && updateProject(p.id, (x) => ({ ...x, template: k, design: designForTemplate(k, x.design) }), { group: null })}
            >
              <span className="tpl-mini-sw" aria-hidden="true" style={{ background: tpl.palettes[0].bg }}>
                <i style={{ background: tpl.palettes[0].accent }} />
              </span>
              <span>{tpl.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="dgroup">
        <h3>{t('Colours')}</h3>
        <div className="swatches" role="radiogroup" aria-label={t('Colour palette')}>
          {TEMPLATES[p.template].palettes.map((pl) => {
            const on = pl.bg === pal.bg && pl.accent === pal.accent && pl.ink === pal.ink;
            return (
              <button key={pl.name} type="button" role="radio" aria-checked={on} className={`swatch ${on ? 'on' : ''}`} onClick={() => setPalette(pl, null)}>
                <span className="swatch-chips" aria-hidden="true">
                  <i style={{ background: pl.bg }} />
                  <i style={{ background: pl.accent }} />
                  <i style={{ background: pl.gold }} />
                </span>
                <span>{pl.name}</span>
              </button>
            );
          })}
        </div>
        <div className="pickers">
          {[
            ['bg', 'Background'],
            ['ink', 'Text'],
            ['accent', 'Accent'],
            ['gold', 'Detail'],
          ].map(([k, label]) => (
            <label key={k} className="picker">
              <input type="color" value={pal[k]} onChange={(e) => setPalette({ [k]: e.target.value }, `palette.${k}`)} />
              <span>{t(label)}</span>
            </label>
          ))}
        </div>
        {ratio < 4.5 ? (
          <p className="field-error" role="status">
            {t('Text contrast is low ({r}:1). Guests may struggle to read it.', { r: ratio.toFixed(1) })}
          </p>
        ) : null}
      </section>

      <section className="dgroup">
        <h3>{t('Typography')}</h3>
        <div className="fonts" role="radiogroup" aria-label={t('Font pair')}>
          {Object.entries(FONT_PAIRS).map(([k, f]) => (
            <button key={k} type="button" role="radio" aria-checked={d.fontPair === k} className={`font-opt ${d.fontPair === k ? 'on' : ''}`} onClick={() => setDesign(p.id, { fontPair: k }, null)}>
              <span className="font-sample" style={{ fontFamily: f.names, fontStyle: f.namesStyle }}>
                Aa
              </span>
              <span className="font-meta">
                <span className="font-name">{f.label}</span>
                <span className="font-note">{t(f.note)}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="dgroup">
        <h3>{t('Background')}</h3>
        <div className="seg seg-2" role="radiogroup" aria-label={t('Background style')}>
          {Object.entries(BACKGROUNDS).map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={d.background === k} className={d.background === k ? 'on' : ''} onClick={() => setDesign(p.id, { background: k }, null)}>
              {t(label)}
            </button>
          ))}
        </div>
      </section>

      <section className="dgroup">
        <h3>{t('Photo crop')}</h3>
        {p.content.coverPhoto ? (
          <>
            <button
              type="button"
              className="crop-pad"
              aria-label={t('Click to set the focal point of the cover photo')}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setDesign(p.id, { crop: { ...d.crop, x: Math.round(((e.clientX - r.left) / r.width) * 100), y: Math.round(((e.clientY - r.top) / r.height) * 100) } }, null);
              }}
            >
              <img src={p.content.coverPhoto} alt="" />
              <span className="crop-dot" style={{ left: `${d.crop.x}%`, top: `${d.crop.y}%` }} />
            </button>
            <p className="field-hint">{t('Tap the photo to choose the focal point.')}</p>
            {[
              ['x', 'Horizontal', 0, 100, 1],
              ['y', 'Vertical', 0, 100, 1],
              ['zoom', 'Zoom', 1, 2, 0.05],
            ].map(([k, label, min, max, step]) => (
              <label key={k} className="range">
                <span>
                  {t(label)}
                  <output>{k === 'zoom' ? `${Number(d.crop[k]).toFixed(2)}×` : `${d.crop[k]}%`}</output>
                </span>
                <input type="range" min={min} max={max} step={step} value={d.crop[k]} onChange={(e) => setDesign(p.id, { crop: { ...d.crop, [k]: Number(e.target.value) } }, `crop.${k}`)} />
              </label>
            ))}
          </>
        ) : (
          <p className="field-hint">{t('Upload a cover photo to adjust its framing.')}</p>
        )}
      </section>

      <section className="dgroup">
        <h3>{t('Sections')}</h3>
        <p className="field-hint">{t('The cover always comes first. Reorder or hide the rest.')}</p>
        <ul className="sec-list" ref={listRef}>
          {d.sections.map((s, i) => {
            const label = t(SECTION_LABELS[s.key]);
            return (
              <li key={s.key} data-key={s.key} className={s.visible ? '' : 'off'}>
                <label className="sec-vis">
                  <input
                    type="checkbox"
                    checked={s.visible}
                    onChange={() => setDesign(p.id, { sections: d.sections.map((x) => (x.key === s.key ? { ...x, visible: !x.visible } : x)) }, null)}
                  />
                  <span>{label}</span>
                </label>
                <span className="sec-moves">
                  <button type="button" className="icon-btn sm mv-up" aria-label={t('Move {s} up', { s: label })} disabled={i === 0} onClick={() => move(i, -1)}>
                    <Icon name="up" size={15} />
                  </button>
                  <button type="button" className="icon-btn sm mv-down" aria-label={t('Move {s} down', { s: label })} disabled={i === d.sections.length - 1} onClick={() => move(i, 1)}>
                    <Icon name="down" size={15} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* ================= Center: preview ================= */
function Preview({ p, device, setDevice, guestId, setGuestId, focusSection, lang }) {
  const t = useT();
  const frame = useRef(null);
  const [replay, setReplay] = useState(0);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const guest = p.guests.find((g) => g.id === guestId);

  useEffect(() => {
    if (!focusSection || !frame.current) return;
    const el = frame.current.querySelector(`[data-sec="${focusSection}"]`);
    if (el && !frame.current.querySelector('.env-stage')) {
      el.classList.add('in');
      frame.current.scrollTo({ top: el.offsetTop - 12, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, [focusSection]);

  return (
    <div className="preview">
      <div className="pv-bar">
        <div className="seg seg-icons" role="radiogroup" aria-label={t('Preview size')}>
          <button type="button" role="radio" aria-checked={device === 'desktop'} className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')}>
            <Icon name="desktop" size={16} /> <span>{t('Desktop')}</span>
          </button>
          <button type="button" role="radio" aria-checked={device === 'mobile'} className={device === 'mobile' ? 'on' : ''} onClick={() => setDevice('mobile')}>
            <Icon name="phone" size={16} /> <span>{t('Mobile')}</span>
          </button>
        </div>
        <label className="pv-guest">
          <span>{t('Previewing as')}</span>
          <select value={guestId || ''} onChange={(e) => setGuestId(e.target.value || null)}>
            <option value="">{t('General guest')}</option>
            {p.guests.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <div className="pv-tools">
          <label className="check-inline">
            <input type="checkbox" checked={showEnvelope} onChange={(e) => setShowEnvelope(e.target.checked)} /> {t('Envelope')}
          </label>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setReplay((r) => r + 1)} disabled={!showEnvelope}>
            <Icon name="replay" size={15} /> {t('Replay')}
          </button>
        </div>
      </div>
      <div className={`pv-stage dev-${device}`}>
        <div className="pv-device">
          <div className="inv-frame pv-frame" ref={frame}>
            <Invitation p={p} guestName={guest?.name} envelope={showEnvelope} scrollRoot={frame} replayKey={`${replay}-${device}`} lang={lang} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Editor shell ================= */
export default function Editor({ p }) {
  const t = useT();
  const [device, setDevice] = useState(() => (matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop'));
  const [guestId, setGuestId] = useState(() => p.guests[0]?.id || null);
  const [openPanel, setOpenPanel] = useState('couple');
  const [mobileView, setMobileView] = useState('edit');
  const [editLang, setEditLang] = useState(() => mainLang(p));
  const [sheet, setSheet] = useState(false);
  const canUndo = useCanUndo(p.id);
  const closeSheet = useCallback(() => setSheet(false), []);

  const doUndo = useCallback(() => {
    if (undo(p.id)) toast(t('Undid last change'));
  }, [p.id, t]);

  useEffect(() => {
    const onKey = (e) => {
      const inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !inField) {
        e.preventDefault();
        doUndo();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [doUndo]);

  const focusSection = { couple: 'cover', cover: 'cover', greeting: 'greeting', details: 'details', location: 'location', gallery: 'gallery', story: 'story', schedule: 'schedule', closing: 'closing' }[openPanel];

  return (
    <div className={`editor mv-${mobileView}`}>
      <div className="ed-actions">
        <div className="seg seg-mobile" role="tablist" aria-label={t('Editor view')}>
          <button type="button" role="tab" aria-selected={mobileView === 'edit'} className={mobileView === 'edit' ? 'on' : ''} onClick={() => setMobileView('edit')}>
            <Icon name="edit" size={15} /> {t('Edit')}
          </button>
          <button type="button" role="tab" aria-selected={mobileView === 'preview'} className={mobileView === 'preview' ? 'on' : ''} onClick={() => setMobileView('preview')}>
            <Icon name="eye" size={15} /> {t('Preview')}
          </button>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={doUndo} disabled={!canUndo} title={t('Undo (Ctrl+Z)')} aria-label={t('Undo')}>
          <Icon name="undo" size={15} /> <span className="hide-xs">{t('Undo')}</span>
        </button>
        <a className="btn btn-sm btn-ghost hide-xs" href={`#/i/${p.id}${guestId ? `/${guestId}` : ''}`} target="_blank" rel="noopener">
          <Icon name="external" size={15} /> {t('Full preview')}
        </a>
        <a className="btn btn-sm btn-primary" href={`#/p/${p.id}/guests`}>
          {t('Next: send to couple')} <Icon name="chevron" size={15} />
        </a>
      </div>

      <aside className="ed-left" aria-label={t('Invitation content')}>
        <h2 className="ed-h">{t('Content')}</h2>
        <EditLangCtx.Provider value={editLang}>
          <ContentPanels p={p} openPanel={openPanel} setOpenPanel={setOpenPanel} editLang={editLang} setEditLang={setEditLang} />
        </EditLangCtx.Provider>
      </aside>

      <main className="ed-center" aria-label={t('Live preview')}>
        <Preview p={p} device={device} setDevice={setDevice} guestId={guestId} setGuestId={setGuestId} focusSection={focusSection} lang={editLang} />
      </main>

      <aside className="ed-right" aria-label={t('Design controls')}>
        <h2 className="ed-h">{t('Design')}</h2>
        <DesignControls p={p} />
      </aside>

      <button
        type="button"
        className="fab-design"
        onClick={() => {
          setMobileView('preview');
          setSheet(true);
        }}
        aria-haspopup="dialog"
      >
        <Icon name="palette" /> {t('Design')}
      </button>
      <Sheet open={sheet} onClose={closeSheet} title={t('Design')}>
        <DesignControls p={p} />
      </Sheet>
    </div>
  );
}
