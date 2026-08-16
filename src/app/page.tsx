import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-3xl font-bold text-white shadow-lg"
      >
        B
      </span>
      <h1 className="text-4xl font-bold tracking-tight">Bichimeca</h1>
      <p className="max-w-md text-lg text-ink-600">
        Aprende a escribir sin mirar el teclado, con precisión y a tu ritmo.
      </p>
      <Link
        href="/curso"
        className="rounded-full bg-brand-500 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Ir al curso
      </Link>
    </main>
  );
}
