import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface p-6 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Compass size={28} /></div>
        <h1 className="text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-1 text-slatey">The page you are looking for doesn&apos;t exist.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  );
}
