import { useMemo, useState } from 'react';
import { coupleLink, coupleName, guestLink, uid } from '../data.js';
import { inv, useT } from '../i18n.js';
import { copyText, ensureOwnerToken, resetOwnerToken, setGuests, setStatus, toast } from '../store.js';
import { Icon } from '../components/ui.jsx';

const enc = encodeURIComponent;

/** Copy button with confirmation and a manual-copy fallback when the clipboard is blocked. */
function CopyButton({ text, label, ariaLabel, onCopied, primary = true }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState(false);
  const copy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1600);
    } else {
      setManual(true);
      toast(t('Clipboard unavailable — the full link is selected below'));
    }
  };
  return (
    <>
      <button type="button" className={`btn btn-sm ${copied ? 'btn-copied' : primary ? 'btn-primary' : 'btn-ghost'}`} onClick={copy} aria-label={ariaLabel}>
        <Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? t('Copied') : label}
      </button>
      {manual ? (
        <span className="manual-link">
          <input readOnly value={text} autoFocus onFocus={(e) => e.target.select()} aria-label={ariaLabel} />
          <button type="button" className="btn btn-sm btn-text" onClick={() => setManual(false)}>
            {t('Done')}
          </button>
        </span>
      ) : null}
    </>
  );
}

const TelegramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M21.4 4.3 18.3 19c-.2 1-.8 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.5 13 1.9 11.6c-1-.3-1-1 .2-1.5L20 3.2c.8-.3 1.6.2 1.4 1.1Z" />
  </svg>
);

/** Ready-to-send personal message + channels. Opens the app; the person still presses send there. */
function SendPanel({ p, g, link, onSent }) {
  const t = useT();
  const lang = p.design.lang || 'en';
  const couple = coupleName(p, lang === 'km' ? ' និង ' : ' & ');
  const message = inv(lang, 'shareMessage', { name: g.name, couple, link });
  const textOnly = inv(lang, 'shareMessage', { name: g.name, couple, link: '' }).trim();
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const share = async () => {
    try {
      await navigator.share({ text: message });
      onSent();
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="send-panel">
      <p className="send-label">{t('Message preview')}</p>
      <p className="send-msg" lang={lang}>
        {message}
      </p>
      <div className="send-actions">
        <a className="btn btn-sm btn-telegram" href={`https://t.me/share/url?url=${enc(link)}&text=${enc(textOnly)}`} target="_blank" rel="noopener noreferrer" onClick={onSent}>
          <TelegramIcon /> Telegram
        </a>
        <a className="btn btn-sm btn-ghost" href={`sms:?&body=${enc(message)}`} onClick={onSent}>
          SMS
        </a>
        {canShare ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={share}>
            {t('Share…')}
          </button>
        ) : null}
        <CopyButton
          primary={false}
          text={message}
          label={t('Copy message')}
          ariaLabel={t('Copy message')}
          onCopied={() => {
            onSent();
            toast(t('Copied message for {name}', { name: g.name }));
          }}
        />
      </div>
    </div>
  );
}

function GuestRow({ p, g }) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState(g.name);
  const [error, setError] = useState('');
  const link = guestLink(p.id, g.id);

  const markSent = () => setGuests(p.id, (list) => list.map((x) => (x.id === g.id ? { ...x, sentAt: Date.now() } : x)));
  const cancel = () => {
    setEditing(false);
    setName(g.name);
    setError('');
  };
  const save = () => {
    const v = name.trim();
    if (!v) {
      setError(t('Name can’t be blank.'));
      return;
    }
    setGuests(p.id, (list) => list.map((x) => (x.id === g.id ? { ...x, name: v } : x)));
    setEditing(false);
    setError('');
    toast(t('Name updated — the link stays the same'));
  };
  const remove = () => {
    let snapshot;
    setGuests(p.id, (list) => {
      snapshot = list;
      return list.filter((x) => x.id !== g.id);
    });
    toast(t('Removed {name}', { name: g.name }), { action: { label: t('Undo'), run: () => setGuests(p.id, () => snapshot) } });
  };

  return (
    <li className={`guest ${sending ? 'is-sending' : ''}`}>
      <div className="guest-main">
        {editing ? (
          <form
            className="guest-edit"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="sr-only" htmlFor={`gn-${g.id}`}>
              {t('Guest name')}
            </label>
            <input
              id={`gn-${g.id}`}
              value={name}
              autoFocus
              aria-invalid={!!error}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => e.key === 'Escape' && cancel()}
            />
            <button type="submit" className="btn btn-sm btn-primary">
              {t('Save')}
            </button>
            <button type="button" className="btn btn-sm btn-text" onClick={cancel}>
              {t('Cancel')}
            </button>
            {error ? (
              <p className="field-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        ) : (
          <>
            <span className="guest-avatar" aria-hidden="true">
              {g.name.trim()[0]?.toUpperCase()}
            </span>
            <span className="guest-text">
              <span className="guest-name">{g.name}</span>
              <span className={`sent-state ${g.sentAt ? 'is-sent' : ''}`}>
                {g.sentAt ? (
                  <>
                    <Icon name="check" size={12} /> {t('Sent')}
                  </>
                ) : (
                  t('Not sent yet')
                )}
              </span>
            </span>
          </>
        )}
      </div>
      {!editing ? (
        <div className="guest-actions">
          <button
            type="button"
            className={`btn btn-sm ${sending ? 'btn-ghost' : 'btn-primary'}`}
            aria-expanded={sending}
            aria-label={t('Send to {name}', { name: g.name })}
            onClick={() => setSending((v) => !v)}
          >
            <Icon name={sending ? 'close' : 'external'} size={15} /> {t('Send')}
          </button>
          <CopyButton
            primary={false}
            text={link}
            label={t('Copy link')}
            ariaLabel={t('Copy link for {name}', { name: g.name })}
            onCopied={() => toast(t('Copied demo link for {name}', { name: g.name }))}
          />
          <a className="icon-btn" href={`#/i/${p.id}/${g.id}`} target="_blank" rel="noopener" aria-label={t('Preview invitation for {name}', { name: g.name })} title={t('Preview')}>
            <Icon name="eye" size={16} />
          </a>
          <button type="button" className="icon-btn" aria-label={t('Rename {name}', { name: g.name })} title={t('Rename {name}', { name: g.name })} onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} />
          </button>
          <button type="button" className="icon-btn" aria-label={t('Delete {name}', { name: g.name })} title={t('Delete')} onClick={remove}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      ) : null}
      {sending && !editing ? <SendPanel p={p} g={g} link={link} onSent={markSent} /> : null}
    </li>
  );
}

/** Add / search / send to guests. Used by the couple's page and (optionally) the studio. */
export function GuestManager({ p, footer, numbered = false }) {
  const t = useT();
  const [mode, setMode] = useState('single');
  const [single, setSingle] = useState('');
  const [bulk, setBulk] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? p.guests.filter((g) => g.name.toLowerCase().includes(q)) : p.guests;
  }, [p.guests, query]);
  const sentCount = p.guests.filter((g) => g.sentAt).length;

  const add = (names) => {
    const existing = new Set(p.guests.map((g) => g.name.toLowerCase()));
    const fresh = [];
    let dupes = 0;
    names.forEach((n) => {
      const key = n.toLowerCase();
      if (existing.has(key)) dupes += 1;
      else {
        existing.add(key);
        fresh.push({ id: uid(12), name: n, createdAt: Date.now() });
      }
    });
    if (fresh.length) setGuests(p.id, (list) => [...fresh, ...list]);
    return { added: fresh.length, dupes };
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'single') {
      const v = single.trim();
      if (!v) return setError(t('Enter a guest name.'));
      const r = add([v]);
      if (!r.added) return setError(t('{name} is already on the list.', { name: v }));
      setSingle('');
      setError('');
      toast(t('Added {name}', { name: v }));
    } else {
      const lines = bulk.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      if (!lines.length) return setError(t('Paste at least one name — one per line.'));
      const r = add(lines);
      setBulk('');
      setError('');
      toast(t('Added {n} guests', { n: r.added }) + (r.dupes ? t(' · skipped {d} already listed', { d: r.dupes }) : ''));
    }
  };

  const bulkCount = bulk.split(/\r?\n/).filter((s) => s.trim()).length;
  const switchMode = (m) => {
    setMode(m);
    setError('');
  };

  return (
    <div className="guests-layout">
      <section className="form-card add-card" aria-labelledby="add-h">
        {numbered ? <span className="step-tag">{t('Step 1')}</span> : null}
        <h2 id="add-h">{numbered ? t('Add your guests') : t('Add guests')}</h2>
        {numbered ? <p className="field-hint card-intro">{t('Type one name, or paste your whole list — one name per line.')}</p> : null}
        <div className="seg seg-2" role="tablist" aria-label={t('Add mode')}>
          <button type="button" role="tab" aria-selected={mode === 'single'} className={mode === 'single' ? 'on' : ''} onClick={() => switchMode('single')}>
            {t('One guest')}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'bulk'} className={mode === 'bulk' ? 'on' : ''} onClick={() => switchMode('bulk')}>
            {t('Paste a list')}
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          {mode === 'single' ? (
            <div className={`field ${error ? 'has-error' : ''}`}>
              <label htmlFor="g-single">{t('Guest or household name')}</label>
              <div className="inline-add">
                <input
                  id="g-single"
                  value={single}
                  placeholder={t('e.g. Mr. & Mrs. Chan')}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'g-err' : undefined}
                  onChange={(e) => {
                    setSingle(e.target.value);
                    if (error) setError('');
                  }}
                />
                <button type="submit" className="btn btn-primary">
                  <Icon name="plus" size={16} /> {t('Add')}
                </button>
              </div>
            </div>
          ) : (
            <div className={`field ${error ? 'has-error' : ''}`}>
              <label htmlFor="g-bulk">{t('Names, one per line')}</label>
              <textarea
                id="g-bulk"
                rows={7}
                value={bulk}
                placeholder={'Sen Visal\nលោក និងលោកស្រី ចាន់\nAunt Sreyleak'}
                aria-invalid={!!error}
                aria-describedby={error ? 'g-err' : undefined}
                onChange={(e) => {
                  setBulk(e.target.value);
                  if (error) setError('');
                }}
              />
              <button type="submit" className="btn btn-primary">
                <Icon name="plus" size={16} /> {t('Add {n} guests', { n: bulkCount || '' })}
              </button>
            </div>
          )}
          {error ? (
            <p className="field-error" id="g-err" role="alert">
              {error}
            </p>
          ) : null}
        </form>
        <div className="status-box">
          <p>{t('{n} guests on the list', { n: p.guests.length })}</p>
          {p.guests.length ? (
            <div className="sent-progress" aria-label={t('{s} of {n} sent', { s: sentCount, n: p.guests.length })}>
              <span className="sent-bar">
                <i style={{ width: `${(sentCount / p.guests.length) * 100}%` }} />
              </span>
              <span>{t('{s} of {n} sent', { s: sentCount, n: p.guests.length })}</span>
            </div>
          ) : null}
          {footer}
        </div>
      </section>

      <section className="guest-list-card" aria-labelledby="list-h">
        <div className="list-head">
          <div>
            {numbered ? <span className="step-tag">{t('Step 2')}</span> : null}
            <h2 id="list-h">{numbered ? t('Send each guest their invitation') : t('Guest list')}</h2>
            {numbered ? <p className="field-hint card-intro">{t('Press Send next to a name. Telegram or SMS opens with a personal message ready — you just press send.')}</p> : null}
          </div>
          {p.guests.length ? (
            <label className="search">
              <Icon name="search" size={16} />
              <span className="sr-only">{t('Search guests')}</span>
              <input type="search" placeholder={t('Search guests')} value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          ) : null}
        </div>
        {!p.guests.length ? (
          <div className="list-empty">
            <svg viewBox="0 0 120 80" aria-hidden="true">
              <rect x="14" y="18" width="92" height="56" rx="2" fill="none" stroke="currentColor" />
              <path d="M14 18 L60 50 L106 18" fill="none" stroke="currentColor" />
              <circle cx="60" cy="50" r="6" fill="var(--wine)" />
            </svg>
            <h3>{t('No guests yet')}</h3>
            <p>{t('Add a name on the left — or paste your whole list at once.')}</p>
          </div>
        ) : filtered.length ? (
          <ul className="guest-list">
            {filtered.map((g) => (
              <GuestRow key={g.id} p={p} g={g} />
            ))}
          </ul>
        ) : (
          <div className="list-empty small">
            <p>{t('No guests match “{q}”.', { q: query })}</p>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setQuery('')}>
              {t('Clear search')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export function DemoNote() {
  const t = useT();
  return (
    <div className="demo-note" role="note">
      <Icon name="eye" size={16} />
      <p>
        <strong>{t('Share links.')}</strong>{' '}
        {t(
          'Links open on any phone once the top bar shows “Saved”. Links use a private guest code — never the guest’s name — and stay the same if you rename someone.',
        )}
      </p>
    </div>
  );
}

function OwnerLinkCard({ p }) {
  const t = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  const link = p.ownerToken ? coupleLink(p.ownerToken) : '';
  const steps = ['You send this link to the couple.', 'The couple opens it and types their guests’ names.', 'They send each guest a personal invitation link.'];
  return (
    <section className="owner-card" aria-labelledby="owner-h">
      <div className="owner-main">
        <h2 id="owner-h">{t('Wedding owner link')}</h2>
        {p.ownerToken ? (
          <div className="owner-link-box">
            <code className="couple-url" title={link}>
              …/c/<strong>{p.ownerToken}</strong>
            </code>
            <div className="couple-card-actions">
              <CopyButton text={link} label={t('Copy owner link')} ariaLabel={t('Copy owner link')} onCopied={() => toast(t('Copied owner link'))} />
              <a
                className="btn btn-sm btn-telegram"
                href={`https://t.me/share/url?url=${enc(link)}&text=${enc(t('Hi! Here is the page to add your wedding guests and send their invitations: {link}', { link: '' }).trim())}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('Send owner link by Telegram')}
              >
                <TelegramIcon /> Telegram
              </a>
              <a className="btn btn-sm btn-ghost" href={`#/c/${p.ownerToken}`} target="_blank" rel="noopener">
                <Icon name="external" size={15} /> {t('Open')}
              </a>
              {confirmReset ? (
                <span className="confirm-del">
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      resetOwnerToken(p.id);
                      setConfirmReset(false);
                      toast(t('New couple link created — the old one no longer works'));
                    }}
                  >
                    {t('Replace link')}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmReset(false)}>
                    {t('Keep')}
                  </button>
                </span>
              ) : (
                <button type="button" className="btn btn-sm btn-text" onClick={() => setConfirmReset(true)}>
                  {t('Replace link')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-lg owner-create" onClick={() => ensureOwnerToken(p.id)}>
            <Icon name="users" size={18} /> {t('Create wedding owner link')}
          </button>
        )}
        <label className="check-inline">
          <input type="checkbox" checked={p.status === 'ready'} onChange={(e) => setStatus(p.id, e.target.checked ? 'ready' : 'draft')} />
          {t('Mark invitation as ready to share')}
        </label>
      </div>
      <div className="owner-how">
        <h3>{t('How it works')}</h3>
        <ol>
          {steps.map((s, i) => (
            <li key={s}>
              <span className="how-n">{i + 1}</span>
              <span>{t(s)}</span>
            </li>
          ))}
        </ol>
        <p className="field-hint">{t('The couple can’t change your design.')}</p>
      </div>
    </section>
  );
}

/** Studio step 4: hand the invitation to the wedding owner. */
export default function Guests({ p }) {
  const t = useT();
  const [a, em, b] = t('Send to the|wedding owner|').split('|');
  return (
    <div className="form-page wide guests-page">
      <div className="form-intro">
        <p className="eyebrow">{t('Step four')}</p>
        <h1>
          {a} <em>{em}</em> {b}
        </h1>
        <p className="lede">{t('Create one private link for the couple. They add their guests and send each person a personal invitation.')}</p>
      </div>

      <OwnerLinkCard p={p} />
      <DemoNote />

      <details className="optional-guests">
        <summary>
          <Icon name="chevron" size={15} className="panel-chev" /> {t('Add guests yourself (optional)')}
          <span className="count">{p.guests.length}</span>
        </summary>
        <GuestManager p={p} />
      </details>

      <div className="form-actions">
        <a className="btn btn-ghost" href={`#/p/${p.id}/customize`}>
          <Icon name="back" /> {t('Back to editor')}
        </a>
        <a className="btn btn-ghost" href="#/">
          {t('Done — all invitations')}
        </a>
      </div>
    </div>
  );
}
