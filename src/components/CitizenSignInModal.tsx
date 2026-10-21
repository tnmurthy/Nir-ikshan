import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; phone: string }) => void;
}

/**
 * Cloud-mode citizen sign-in. Creates an anonymous Supabase session (done by AppState.login)
 * and records the contact details the citizen gives. The mobile number is NOT verified yet;
 * switch to Supabase phone OTP once a DLT-registered SMS sender is available.
 */
export const CitizenSignInModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  if (!isOpen) return null;

  const valid = name.trim().length >= 2 && /^[6-9][0-9]{9}$/.test(phone.replace(/\D/g, '').slice(-10));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60" role="dialog" aria-modal="true" aria-labelledby="citizen-signin-title">
      <form
        className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onLoginSuccess({ name: name.trim(), phone: phone.replace(/\D/g, '').slice(-10) });
          onClose();
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0077B6]" aria-hidden />
            <h2 id="citizen-signin-title" className="font-black text-[#03045E]">{t('citizenSignInTitle', 'Your contact details')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500">{t('citizenSignInHint', 'Officers use these only to contact you about your complaint. They are never shown publicly.')}</p>
        <div className="space-y-1">
          <label htmlFor="cit-name" className="text-xs font-semibold text-slate-600">{t('fullName', 'Full name')}</label>
          <input id="cit-name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <div className="space-y-1">
          <label htmlFor="cit-phone" className="text-xs font-semibold text-slate-600">{t('mobileNumber', 'Mobile number')}</label>
          <input id="cit-phone" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel-national" placeholder="10-digit mobile" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm" />
        </div>
        <button type="submit" disabled={!valid} className="w-full px-4 py-2.5 rounded-xl bg-[#03045E] hover:bg-[#0077B6] disabled:opacity-50 text-white text-sm font-bold">
          {t('continue', 'Continue')}
        </button>
      </form>
    </div>
  );
};
