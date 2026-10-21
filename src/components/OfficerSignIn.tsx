import React, { useState } from 'react';
import { ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { sendOfficialCode, verifyOfficialCode } from '../lib/auth';
import { useLanguage } from '../context/LanguageContext';

/** Officer sign-in with an emailed one-time code. Only pre-registered officer accounts can sign in. */
export const OfficerSignIn: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]';
  const button = 'w-full px-4 py-2.5 rounded-xl bg-[#03045E] hover:bg-[#0077B6] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2';

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xs">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#CAF0F8] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-[#0077B6]" aria-hidden />
        </div>
        <h2 className="text-xl font-black text-[#03045E]">{t('navConsole', 'Officer console')}</h2>
        <p className="text-sm text-slate-500">
          {step === 'email'
            ? t('officerEmailHint', 'Enter your registered official email. We will send a 6-digit sign-in code.')
            : t('officerCodeHint', 'Enter the code sent to your email.')}
        </p>
      </div>

      {step === 'email' ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await sendOfficialCode(email);
              setStep('code');
            });
          }}
        >
          <label htmlFor="officer-email" className="sr-only">Official email</label>
          <input id="officer-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@department.gov.in" className={input} />
          <button type="submit" disabled={busy} className={button}>
            <Mail className="w-4 h-4" aria-hidden />
            <span>{busy ? 'Sending…' : t('officerSendCode', 'Send code')}</span>
          </button>
        </form>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await verifyOfficialCode(email, code);
            });
          }}
        >
          <label htmlFor="officer-code" className="sr-only">Sign-in code</label>
          <input id="officer-code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6,8}" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className={`${input} font-mono tracking-widest text-center`} />
          <button type="submit" disabled={busy} className={button}>
            <KeyRound className="w-4 h-4" aria-hidden />
            <span>{busy ? 'Verifying…' : t('consoleSignIn', 'Sign in')}</span>
          </button>
          <button type="button" onClick={() => setStep('email')} className="w-full text-xs text-slate-500 hover:text-[#0077B6]">
            {t('officerChangeEmail', 'Use a different email')}
          </button>
        </form>
      )}

      {error && <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}
    </div>
  );
};
