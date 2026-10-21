import React from 'react';
import { Link } from 'react-router';
import { PATHS } from '../navigation/paths';

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center space-y-4">
      <p className="text-5xl font-black text-[#03045E]">404</p>
      <p className="text-slate-600">This page does not exist.</p>
      <Link to={PATHS.home} className="inline-block px-4 py-2 rounded-xl bg-[#03045E] text-white text-sm font-bold">
        Back to portal home
      </Link>
    </div>
  );
}
