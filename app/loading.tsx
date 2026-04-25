export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-16">
      <div className="card w-full max-w-lg p-8 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--brand-green)]" />
        <h1 className="mt-5 text-2xl font-bold">Loading GoCart</h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re preparing your storefront experience.
        </p>
      </div>
    </div>
  );
}
