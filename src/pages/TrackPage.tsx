import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CheckCircle2, Circle, Search, XCircle, MapPin, Copy } from 'lucide-react';
import { useAppState } from '../state/AppStateContext';
import { useLanguage } from '../context/LanguageContext';
import { PATHS } from '../navigation/paths';
import { CitizenComplaint } from '../types/nirikshan';

type Status = CitizenComplaint['status'];

const STAGES: { status: Status; label: string; owner: string }[] = [
  { status: 'SUBMITTED', label: 'Complaint received', owner: 'Citizen' },
  { status: 'INSPECTOR_ASSIGNED', label: 'Inspector assigned', owner: 'District nodal officer' },
  { status: 'INSPECTION_COMPLETED', label: 'Site inspected', owner: 'Field inspector' },
  { status: 'ACTION_ASSIGNED', label: 'Action ordered', owner: 'District nodal officer' },
  { status: 'WORKER_IN_PROGRESS', label: 'Work in progress', owner: 'Action engineer' },
  { status: 'VERIFICATION_PENDING', label: 'Awaiting verification', owner: 'Field inspector' },
  { status: 'RESOLVED', label: 'Resolved', owner: 'District nodal officer' },
];

const stageIndex = (s: Status) => STAGES.findIndex((x) => x.status === s);

/** Public tracking view. Deliberately shows no citizen name, phone or officer phone numbers. */
const Timeline: React.FC<{ c: CitizenComplaint }> = ({ c }) => {
  const current = c.status === 'REJECTED' ? -1 : stageIndex(c.status);
  // ACTION_ASSIGNED is skipped by the current workflow; treat it as done once work has started
  const isDone = (i: number) => current >= 0 && i <= current;

  return (
    <ol className="relative space-y-4">
      {STAGES.map((stage, i) => {
        const done = isDone(i);
        const active = i === current;
        return (
          <li key={stage.status} className="flex gap-3 items-start">
            {done ? (
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${active ? 'text-[#0077B6]' : 'text-emerald-500'}`} aria-hidden />
            ) : (
              <Circle className="w-5 h-5 shrink-0 text-slate-300" aria-hidden />
            )}
            <div>
              <p className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                {stage.label}
                {active && <span className="ml-2 text-[10px] uppercase tracking-wider bg-[#CAF0F8] text-[#03045E] px-2 py-0.5 rounded-full">Current</span>}
              </p>
              <p className="text-xs text-slate-500">{stage.owner}</p>
            </div>
          </li>
        );
      })}
      {c.status === 'REJECTED' && (
        <li className="flex gap-3 items-start">
          <XCircle className="w-5 h-5 shrink-0 text-red-500" aria-hidden />
          <p className="text-sm font-semibold text-red-700">Closed without action (rejected)</p>
        </li>
      )}
    </ol>
  );
};

export default function TrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { complaints, currentUser } = useAppState();
  const [query, setQuery] = useState(id ?? '');

  const complaint = id ? complaints.find((c) => c.id.toLowerCase() === id.toLowerCase()) : undefined;
  const mine = currentUser ? complaints.filter((c) => c.citizenPhone === currentUser.phone).slice(0, 10) : [];

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(PATHS.trackOne(q));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-black text-[#03045E]">{t('navTrack', 'Track complaint')}</h2>
        <p className="text-sm text-slate-500">
          {t('trackIntro', 'Enter the complaint ID you received after submitting (for example CMP-AP-2026-…).')}
        </p>
      </header>

      <form onSubmit={onSearch} className="flex gap-2" role="search">
        <label htmlFor="track-id" className="sr-only">Complaint ID</label>
        <input
          id="track-id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="CMP-AP-2026-..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
        />
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#03045E] hover:bg-[#0077B6] text-white text-sm font-bold flex items-center gap-1.5">
          <Search className="w-4 h-4" aria-hidden />
          <span>{t('trackButton', 'Track')}</span>
        </button>
      </form>

      {id && !complaint && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm">
          No complaint found with ID <span className="font-mono font-bold">{id}</span>. Check the ID and try again.
        </div>
      )}

      {complaint && (
        <article className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Complaint ID</p>
              <p className="font-mono font-bold text-[#03045E] flex items-center gap-2">
                {complaint.id}
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="text-slate-400 hover:text-[#0077B6]"
                  title="Copy tracking link"
                >
                  <Copy className="w-4 h-4" aria-hidden />
                  <span className="sr-only">Copy tracking link</span>
                </button>
              </p>
            </div>
            <p className="text-xs text-slate-500">Submitted {complaint.submittedAt}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Location</p>
              <p className="font-semibold text-slate-900 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 mt-0.5 text-[#0077B6] shrink-0" aria-hidden />
                <span>
                  {[complaint.village, complaint.mandal, complaint.district].filter(Boolean).join(', ')}
                  {complaint.locationLandmark && <span className="block text-xs font-normal text-slate-500">{complaint.locationLandmark}</span>}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Issue</p>
              <p className="font-semibold text-slate-900">{complaint.wasteType ?? 'Water body complaint'}</p>
              <p className="text-xs text-slate-600">{complaint.shortDescription}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Responsible officer</p>
              <p className="font-semibold text-slate-900">{complaint.assignedNodalOfficer}</p>
            </div>
            {complaint.assignedInspector && (
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Field inspector</p>
                <p className="font-semibold text-slate-900">{complaint.assignedInspector}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-5">
            <Timeline c={complaint} />
          </div>
        </article>
      )}

      {!id && mine.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700">{t('trackMine', 'Your recent complaints')}</h3>
          <ul className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl">
            {mine.map((c) => (
              <li key={c.id}>
                <Link to={PATHS.trackOne(c.id)} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="font-mono text-xs text-[#03045E]">{c.id}</span>
                  <span className="text-xs text-slate-500 truncate">{c.village || c.district}</span>
                  <span className="text-[10px] font-bold uppercase text-[#0077B6]">{c.status.replace(/_/g, ' ')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
