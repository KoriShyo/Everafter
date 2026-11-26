import { useState } from 'react';
import { coupleName, formatDate, TEMPLATES } from '../data.js';
import { useT } from '../i18n.js';
import { signOut, useAuth } from '../auth.js';
import { deleteProject, restoreExample, toast, useProjects } from '../store.js';
import { CoverThumb, Icon, LangSwitch, Logo } from '../components/ui.jsx';

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function EmptyState() {
  const t = useT();
  return (
    <div className="empty">
      <svg className="empty-art" viewBox="0 0 220 150" aria-hidden="true">
        <rect x="30" y="40" width="160" height="100" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M30 40 L110 98 L190 40" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M30 140 L92 86 M190 140 L128 86" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".5" />
        <rect x="52" y="10" width="116" height="70" fill="var(--paper)" stroke="var(--gold)" strokeWidth="1" className="empty-card" />
        <text x="110" y="42" textAnchor="middle" fontFamily="Cormorant Garamond, Noto Serif Khmer, serif" fontStyle="italic" fontSize="17" fill="currentColor">
          {t('Your story')}
        </text>
        <text x="110" y="60" textAnchor="middle" fontFamily="Inter, Kantumruy Pro, sans-serif" fontSize="6.5" letterSpacing={t.lang === 'km' ? 0 : 2} fill="var(--muted)">
          {t('BEGINS HERE')}
        </text>
        <circle cx="110" cy="98" r="11" fill="var(--wine)" />
      </svg>
      <h2>{t('No invitations yet')}</h2>
      <p>{t('Start with your names and date — you can design, preview and invite guests in a few calm steps.')}</p>
      <div className="empty-actions">
        <a className="btn btn-primary" href="#/new">
          <Icon name="plus" /> {t('Create invitation')}
        </a>
        <button type="button" className="btn btn-ghost" onClick={restoreExample}>
          {t('Add the example project')}
        </button>
      </div>
    </div>
  );
}

function ProjectCard({ p, index }) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const name = coupleName(p, ' & ', t('Untitled invitation'));
  const remove = () => {
    const restore = deleteProject(p.id);
    toast(t('Deleted “{name}”', { name }), { action: { label: t('Undo'), run: restore } });
  };
  return (
    <article className="pcard" style={{ '--i': index }}>
      <a href={`#/p/${p.id}/customize`} className="pcard-thumb" aria-label={t('Edit {name}', { name })}>
        <CoverThumb p={p} />
      </a>
      <div className="pcard-body">
        <div className="pcard-meta">
          <span className={`badge badge-${p.status}`}>{p.status === 'ready' ? t('Ready to share') : t('Draft')}</span>
          {p.isExample ? <span className="badge badge-example">{t('Example')}</span> : null}
          <span className="badge badge-lang">{(p.design.lang || 'en') === 'km' ? 'ខ្មែរ' : 'EN'}</span>
          <span className="pcard-tpl">{TEMPLATES[p.template].name}</span>
        </div>
        <h3>{name}</h3>
        <p className="pcard-date">{formatDate(p.content.date, t.lang) || t('Date not set')}</p>
        <p className="pcard-guests">{t(p.guests.length === 1 ? '{n} guest' : '{n} guests', { n: p.guests.length })}</p>
        <div className="pcard-actions">
          <a className="btn btn-sm btn-primary" href={`#/p/${p.id}/customize`}>
            <Icon name="edit" size={15} /> {t('Edit')}
          </a>
          <a className="btn btn-sm btn-ghost" href={`#/i/${p.id}`} target="_blank" rel="noopener">
            <Icon name="eye" size={15} /> {t('Preview')}
          </a>
          <a className="btn btn-sm btn-ghost" href={`#/p/${p.id}/guests`}>
            <Icon name="users" size={15} /> {t('Guests')}
          </a>
          {confirming ? (
            <span className="confirm-del">
              <button type="button" className="btn btn-sm btn-danger" onClick={remove}>
                {t('Delete')}
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>
                {t('Keep')}
              </button>
            </span>
          ) : (
            <button type="button" className="icon-btn" aria-label={t('Delete {name}', { name })} onClick={() => setConfirming(true)}>
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const t = useT();
  const projects = useProjects();
  const { user } = useAuth();
  const [a, em, b] = t('Your invitation|atelier|').split('|');
  return (
    <div className="dash">
      <header className="topbar">
        <Logo />
        <span className="topbar-note">{user && user.email ? user.email : t('Invitations are saved online')}</span>
        <LangSwitch />
        {user && user.uid !== 'local' ? (
          <button type="button" className="btn btn-ghost btn-sm signout" onClick={signOut}>
            {t('Sign out')}
          </button>
        ) : null}
      </header>
      <main className="dash-main" id="main">
        <section className="dash-hero">
          <div>
            <p className="eyebrow">{t(greetingWord())}</p>
            <h1>
              {a} <em>{em}</em> {b}
            </h1>
            <p className="lede">{t('Design each invitation with care, then send every guest a link that greets them by name.')}</p>
          </div>
          {projects.length ? (
            <a className="btn btn-primary btn-lg" href="#/new">
              <Icon name="plus" /> {t('Create invitation')}
            </a>
          ) : null}
        </section>

        {projects.length ? (
          <section aria-labelledby="proj-h">
            <div className="section-head">
              <h2 id="proj-h">{t('Invitations')}</h2>
              <span className="count">{projects.length}</span>
            </div>
            <div className="pgrid">
              {projects.map((p, i) => (
                <ProjectCard key={p.id} p={p} index={i} />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
