import { useEffect, useRef, useState } from 'react';
import { coupleName } from '../data.js';
import { inv } from '../i18n.js';
import { useProject } from '../store.js';
import { Invitation } from '../components/Invitation.jsx';

export default function Viewer({ id, guestId }) {
  const p = useProject(id);
  const frame = useRef(null);
  const [banner, setBanner] = useState(false);
  const [lang, setLang] = useState(null); // null = invitation's own language
  const guest = p?.guests.find((g) => g.id === guestId);
  const current = lang || p?.design.lang || 'en';
  const L = (k, v) => inv(current, k, v);

  useEffect(() => {
    if (p) {
      const couple = coupleName(p);
      document.title = guest ? L('youreInvitedTitle', { name: guest.name, couple }) : L('inviteTitle', { couple });
    }
    return () => {
      document.title = 'Everafter Studio';
    };
  }, [p, guest, current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p || (guestId && !guest)) {
    return (
      <main className="viewer-missing">
        <p className="eyebrow">Everafter Studio</p>
        <h1>{L('cantOpen')}</h1>
        <p>{!p ? L('missingProject') : L('missingGuest')}</p>
        <a className="btn btn-primary" href="#/">
          {L('goStudio')}
        </a>
      </main>
    );
  }

  return (
    <div className="viewer">
      {banner ? (
        <div className="demo-ribbon" role="note" lang={current}>
          <span>{L('demoRibbon')}</span>
          <button type="button" onClick={() => setBanner(false)} aria-label={L('hideNotice')}>
            ×
          </button>
        </div>
      ) : null}
      <div className="viewer-stage">
        <button
          type="button"
          className="viewer-lang"
          lang={current === 'km' ? 'en' : 'km'}
          aria-label={L('switchLangLabel')}
          onClick={() => setLang(current === 'km' ? 'en' : 'km')}
        >
          {L('switchLang')}
        </button>
        <div className="inv-frame viewer-frame" ref={frame}>
          <Invitation p={p} guestName={guest?.name} scrollRoot={frame} lang={current} />
        </div>
      </div>
    </div>
  );
}
