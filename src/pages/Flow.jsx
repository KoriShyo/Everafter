import { useRef, useState } from 'react';
import { coupleName, designForTemplate, isValidUrl, TEMPLATES } from '../data.js';
import { useT } from '../i18n.js';
import { createProject, setContent, setInviteLang, updateProject, useProject } from '../store.js';
import { CoverThumb, Field, Icon, LangSwitch, Logo, SaveIndicator } from '../components/ui.jsx';
import Editor from './Editor.jsx';
import Guests from './Guests.jsx';

const STEPS = [
  ['details', 'Wedding details'],
  ['design', 'Choose design'],
  ['customize', 'Customize'],
  ['guests', 'Send to couple'],
];

function Stepper({ id, step }) {
  const t = useT();
  const current = STEPS.findIndex(([k]) => k === step);
  return (
    <nav className="stepper" aria-label={t('Invitation steps')}>
      <ol>
        {STEPS.map(([k, label], i) => {
          const state = i === current ? 'current' : i < current ? 'done' : 'todo';
          const inner = (
            <>
              <span className="st-n">{state === 'done' ? <Icon name="check" size={13} /> : i + 1}</span>
              <span className="st-l">{t(label)}</span>
            </>
          );
          return (
            <li key={k} className={`st st-${state}`}>
              {id ? (
                <a href={`#/p/${id}/${k}`} aria-current={i === current ? 'step' : undefined}>
                  {inner}
                </a>
              ) : (
                <span aria-current={i === current ? 'step' : undefined} aria-disabled={i !== current}>
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------- Step 1: details ---------------- */
const blank = { partner1: '', partner2: '', date: '', time: '', venueName: '', venueAddress: '', mapUrl: '' };

function validate(v) {
  const e = {};
  if (!v.partner1.trim()) e.partner1 = 'Please enter the first partner’s name.';
  if (!v.partner2.trim()) e.partner2 = 'Please enter the second partner’s name.';
  if (!v.date) e.date = 'Choose the wedding date.';
  if (v.mapUrl && !isValidUrl(v.mapUrl)) e.mapUrl = 'Use a full link starting with https://';
  return e;
}

function DetailsStep({ p }) {
  const t = useT();
  const [draft, setDraft] = useState(blank);
  const [draftLang, setDraftLang] = useState(t.lang);
  const [errors, setErrors] = useState({});
  const [tried, setTried] = useState(false);
  const values = p ? p.content : draft;
  const inviteLang = p ? p.design.lang || 'en' : draftLang;

  const set = (k) => (e) => {
    const v = e.target.value;
    if (p) setContent(p.id, { [k]: v }, `details.${k}`);
    else setDraft((d) => ({ ...d, [k]: v }));
    if (tried) setErrors(validate({ ...values, [k]: v }));
  };

  const next = (e) => {
    e.preventDefault();
    setTried(true);
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    if (p) location.hash = `#/p/${p.id}/design`;
    else {
      const created = createProject({ ...draft, lang: draftLang });
      location.hash = `#/p/${created.id}/design`;
    }
  };

  const input = (k, label, type = 'text', extra = {}) => (
    <Field id={`f-${k}`} label={t(label)} error={errors[k] ? t(errors[k]) : ''} hint={extra.hint ? t(extra.hint) : ''}>
      <input
        id={`f-${k}`}
        type={type}
        value={values[k]}
        onChange={set(k)}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `f-${k}-err` : undefined}
        placeholder={extra.placeholder ? t(extra.placeholder) : undefined}
        autoComplete="off"
        required={extra.required}
      />
    </Field>
  );

  const [a, em, b] = t('Tell us about|the day|').split('|');
  return (
    <form className="form-page" onSubmit={next} noValidate>
      <div className="form-intro">
        <p className="eyebrow">{t('Step one')}</p>
        <h1>
          {a} <em>{em}</em> {b}
        </h1>
        <p className="lede">{t('These details appear on every invitation. You can refine them at any time.')}</p>
      </div>
      <fieldset className="form-card">
        <legend>{t('The couple')}</legend>
        <div className="grid-2">
          {input('partner1', 'First partner', 'text', { placeholder: 'e.g. Sophea', required: true })}
          {input('partner2', 'Second partner', 'text', { placeholder: 'e.g. Dara', required: true })}
        </div>
      </fieldset>
      <fieldset className="form-card">
        <legend>{t('Date & place')}</legend>
        <div className="grid-2">
          {input('date', 'Wedding date', 'date', { required: true })}
          {input('time', 'Ceremony time', 'time', { hint: 'Optional' })}
        </div>
        {input('venueName', 'Venue', 'text', { placeholder: 'e.g. The Riverside Pavilion' })}
        {input('venueAddress', 'Address', 'text', { placeholder: 'Street, city' })}
        {input('mapUrl', 'Map link', 'url', { placeholder: 'https://maps.google.com/…', hint: 'Paste a Google Maps or Apple Maps link' })}
      </fieldset>
      <fieldset className="form-card">
        <legend>{t('Invitation language')}</legend>
        <div className="field">
          <LangSwitch
            label={t('Invitation language')}
            value={inviteLang}
            onChange={(l) => (p ? setInviteLang(p.id, l) : setDraftLang(l))}
          />
          <p className="field-hint">{t('The language guests see first. They can still switch on their invitation.')}</p>
        </div>
      </fieldset>
      <div className="form-actions">
        <a className="btn btn-ghost" href={p ? `#/p/${p.id}/customize` : '#/'}>
          {p ? t('Back to editor') : t('Cancel')}
        </a>
        <button type="submit" className="btn btn-primary btn-lg">
          {t('Continue to design')} <Icon name="chevron" />
        </button>
      </div>
    </form>
  );
}

/* ---------------- Step 2: design ---------------- */
function DesignStep({ p }) {
  const t = useT();
  const choose = (key) => {
    if (key === p.template) return;
    updateProject(p.id, (x) => ({ ...x, template: key, design: designForTemplate(key, x.design) }), { group: 'template' });
  };
  const [a, em, b] = t('Choose a|design|').split('|');
  return (
    <div className="form-page wide">
      <div className="form-intro">
        <p className="eyebrow">{t('Step two')}</p>
        <h1>
          {a} <em>{em}</em> {b}
        </h1>
        <p className="lede">{t('Each template has its own layout, rhythm and palette. Your words carry over — switch freely.')}</p>
      </div>
      <div className="tpl-grid" role="radiogroup" aria-label={t('Invitation template')}>
        {Object.entries(TEMPLATES).map(([key, tpl]) => {
          const preview = key === p.template ? p : { ...p, template: key, design: designForTemplate(key, p.design) };
          const selected = key === p.template;
          return (
            <button type="button" role="radio" aria-checked={selected} key={key} className={`tpl-card ${selected ? 'selected' : ''}`} onClick={() => choose(key)}>
              <CoverThumb p={preview} />
              <span className="tpl-info">
                <span className="tpl-name">{tpl.name}</span>
                <span className="tpl-blurb">{t(tpl.blurb)}</span>
                <span className="tpl-swatches" aria-hidden="true">
                  {['bg', 'accent', 'gold', 'ink'].map((c) => (
                    <i key={c} style={{ background: tpl.palettes[0][c] }} />
                  ))}
                </span>
              </span>
              <span className="tpl-check" aria-hidden="true">
                <Icon name="check" size={14} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="form-actions">
        <a className="btn btn-ghost" href={`#/p/${p.id}/details`}>
          <Icon name="back" /> {t('Details')}
        </a>
        <a className="btn btn-primary btn-lg" href={`#/p/${p.id}/customize`}>
          {t('Customize {name}', { name: TEMPLATES[p.template].name })} <Icon name="chevron" />
        </a>
      </div>
    </div>
  );
}

/* ---------------- shell ---------------- */
export default function Flow({ id, step }) {
  const t = useT();
  const p = useProject(id);
  const prevIdx = useRef(STEPS.findIndex(([k]) => k === step));
  const idx = STEPS.findIndex(([k]) => k === step);
  const dir = idx >= prevIdx.current ? 1 : -1;
  if (prevIdx.current !== idx) prevIdx.current = idx;

  if (id && !p) {
    return (
      <div className="dash">
        <header className="topbar">
          <Logo />
          <span className="topbar-spacer" />
          <LangSwitch />
        </header>
        <main className="notfound">
          <h1>{t('We couldn’t find that invitation')}</h1>
          <p>{t('It may have been deleted, or it was created in a different browser.')}</p>
          <a className="btn btn-primary" href="#/">
            {t('Back to invitations')}
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className={`flow flow-${step}`}>
      <header className="topbar flow-top">
        <a href="#/" className="icon-btn" aria-label={t('Back to all invitations')}>
          <Icon name="back" />
        </a>
        <div className="flow-title">
          <span className="flow-name">{p ? coupleName(p, ' & ', t('Untitled invitation')) : t('New invitation')}</span>
          {p ? <SaveIndicator /> : <span className="save">{t('Not saved yet')}</span>}
        </div>
        <Stepper id={id} step={step} />
        <LangSwitch />
      </header>
      <div className="step-anim" key={step} style={{ '--dir': dir }}>
        {step === 'details' && <DetailsStep p={p} />}
        {step === 'design' && p && <DesignStep p={p} />}
        {step === 'customize' && p && <Editor p={p} />}
        {step === 'guests' && p && <Guests p={p} />}
      </div>
    </div>
  );
}
