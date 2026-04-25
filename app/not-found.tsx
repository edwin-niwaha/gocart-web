import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-16">
      <div className="card w-full max-w-xl p-8 text-center">
        <span className="badge">404</span>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">
          The page you&apos;re looking for may have moved or no longer exists.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/" className="btn btn-primary-solid">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
