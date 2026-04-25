'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-16">
      <div className="card w-full max-w-xl p-8 text-center">
        <span className="badge">Something went wrong</span>
        <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t load this page</h1>
        <p className="mt-3 text-sm text-slate-600">
          {error.message || 'An unexpected error occurred while rendering this route.'}
        </p>
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={reset} className="btn btn-primary-solid">
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
