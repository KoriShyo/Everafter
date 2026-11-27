import { useState } from 'react';
import { useT } from '../i18n.js';
import { authMessage, resetPassword, signIn, signInGoogle, signUp } from '../auth.js';
import { Field, LangSwitch, Logo } from '../components/ui.jsx';
import { googleSignIn } from '../firebaseConfig.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const t = useT();
  const [mode, setMode] = useState('in'); // in | up | reset
  const [v, setV] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const go = (m) => {
    setMode(m);
    setErrors({});
    setFormError('');
    setSent(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (mode === 'up' && !v.name.trim()) err.name = 'Please enter your name.';
    if (!EMAIL.test(v.email.trim())) err.email = 'Enter a valid email address.';
    if (mode !== 'reset' && !v.password) err.password = 'Enter your password.';
    if (mode === 'up' && v.password && v.password.length < 6) err.password = 'Choose a password with at least 6 characters.';
    setErrors(err);
    setFormError('');
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      if (mode === 'up') await signUp(v.name.trim(), v.email.trim(), v.password);
      else if (mode === 'in') await signIn(v.email.trim(), v.password);
      else {
        await resetPassword(v.email.trim());
        setSent(true);
      }
    } catch (ex) {
      setFormError(authMessage(ex));
    }
    setBusy(false);
  };

  const google = async () => {
    setBusy(true);
    setFormError('');
    try {
      await signInGoogle();
    } catch (ex) {
      setFormError(authMessage(ex));
    }
    setBusy(false);
  };

  const title = mode === 'up' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back';
  const lede =
    mode === 'up'
      ? 'Sign up to design invitations and reach them from any device.'
      : mode === 'reset'
        ? 'Enter your email and we’ll send you a link to choose a new password.'
        : 'Sign in to your invitation atelier.';

  return (
    <div className="dash">
      <header className="topbar">
        <Logo />
        <span className="topbar-spacer" />
        <LangSwitch />
      </header>
      <main className="auth-main" id="main">
        <form className="form-card auth-card" onSubmit={submit} noValidate>
          <p className="eyebrow">Everafter Studio</p>
          <h1 className="auth-h1">{t(title)}</h1>
          <p className="lede">{t(lede)}</p>

          {mode === 'up' ? (
            <Field id="au-name" label={t('Your name')} error={errors.name && t(errors.name)}>
              <input id="au-name" autoComplete="name" value={v.name} onChange={set('name')} aria-invalid={!!errors.name} />
            </Field>
          ) : null}
          <Field id="au-email" label={t('Email')} error={errors.email && t(errors.email)}>
            <input
              id="au-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={v.email}
              onChange={set('email')}
              aria-invalid={!!errors.email}
            />
          </Field>
          {mode !== 'reset' ? (
            <Field id="au-pass" label={t('Password')} error={errors.password && t(errors.password)}>
              <input
                id="au-pass"
                type="password"
                autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
                value={v.password}
                onChange={set('password')}
                aria-invalid={!!errors.password}
              />
            </Field>
          ) : null}

          {formError ? (
            <p className="field-error" role="alert">
              {t(formError)}
            </p>
          ) : null}
          {sent ? (
            <p className="auth-ok" role="status">
              {t('Check your inbox — the reset link is on its way.')}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={busy}>
            {busy ? t('Please wait…') : t(mode === 'up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in')}
          </button>

          {mode !== 'reset' && googleSignIn ? (
            <>
              <p className="auth-or">
                <span>{t('or')}</span>
              </p>
              <button type="button" className="btn btn-ghost auth-google" onClick={google} disabled={busy}>
                {t('Continue with Google')}
              </button>
            </>
          ) : null}

          <p className="auth-switch">
            {mode === 'in' ? (
              <>
                {t('New here?')}{' '}
                <button type="button" className="link-btn" onClick={() => go('up')}>
                  {t('Create an account')}
                </button>
                <br />
                <button type="button" className="link-btn" onClick={() => go('reset')}>
                  {t('Forgot your password?')}
                </button>
              </>
            ) : (
              <button type="button" className="link-btn" onClick={() => go('in')}>
                {mode === 'up' ? t('Already have an account? Sign in') : t('Back to sign in')}
              </button>
            )}
          </p>
        </form>
      </main>
    </div>
  );
}
