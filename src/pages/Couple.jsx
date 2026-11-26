import { useEffect } from 'react';
import { coupleName, formatDate } from '../data.js';
import { useT } from '../i18n.js';
import { useProjectByOwnerToken } from '../store.js';
import { CoverThumb, LangSwitch } from '../components/ui.jsx';
import { DemoNote, GuestManager } from './Guests.jsx';

/** The couple's own page: add guests and copy their personal links. No design controls. */
export default function Couple({ token }) {
  const t = useT();
  const p = useProjectByOwnerToken(token);

  useEffect(() => {
    if (p) document.title = `${coupleName(p)} · ${t('Guest links')}`;
    return () => {
      document.title = 'Everafter Studio';
    };
  }, [p, t.lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) {
    return (
      <div className="dash">
        <header className="topbar">
          <span className="logo-text">Everafter <em>Studio</em></span>
          <span className="topbar-spacer" />
          <LangSwitch />
        </header>
        <main className="notfound">
          <h1>{t('This couple link isn’t valid here')}</h1>
          <p>{t('The link may have been replaced by your designer, or it was created on a different device. Ask your designer for the latest link.')}</p>
        </main>
      </div>
    );
  }

  const [a, em, b] = t('Your guest|links|').split('|');
  return (
    <div className="dash couple-page">
      <header className="topbar">
        <span className="logo-text">
          Everafter <em>Studio</em>
        </span>
        <span className="topbar-spacer" />
        <LangSwitch />
      </header>
      <main className="form-page wide">
        <section className="couple-hero">
          <div className="couple-hero-thumb">
            <CoverThumb p={p} />
          </div>
          <div>
            <p className="eyebrow">{coupleName(p, ' & ', t('Untitled invitation'))}</p>
            <h1 className="couple-h1">
              {a} <em>{em}</em> {b}
            </h1>
            <p className="lede">{t('Add each guest’s name, then copy their personal link and send it by Telegram, Messenger or SMS. Each guest sees their own name on the invitation.')}</p>
            <p className="couple-date">{formatDate(p.content.date, t.lang) || t('Date not set')}</p>
            <a className="btn btn-ghost" href={`#/i/${p.id}`} target="_blank" rel="noopener">
              {t('Preview invitation')}
            </a>
          </div>
        </section>
        <DemoNote />
        <GuestManager p={p} numbered />
      </main>
    </div>
  );
}
