"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TEXTS_ES } from "@/data/texts/es";
import {
  createSession,
  handleBackspace,
  handleInput,
  summarize,
  type Session,
} from "@/domain/engine/session";
import {
  formatAccuracy,
  formatDuration,
  formatPpm,
} from "@/domain/metrics/format";
import { appendSession } from "@/domain/progress/progress";
import { mergeSessionKeyStats } from "@/domain/progress/keyStats";
import { useProgress } from "@/app/providers";

function randomText(excludeId?: string) {
  const candidates = TEXTS_ES.filter((entry) => entry.id !== excludeId);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Modo texto: free typing over full, naturally punctuated Spanish
 * paragraphs in the engine's test mode (mistakes advance, backspace
 * corrects). Every run is stored and shown in a detailed ranking.
 */
export default function TextoPage() {
  const { progress, updateProgress } = useProgress();
  const [textEntry, setTextEntry] = useState(() => randomText());
  const [session, setSession] = useState<Session>(() =>
    createSession({ text: textEntry.text, mode: "test" }),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  const startNew = useCallback((excludeId?: string) => {
    const next = randomText(excludeId);
    savedRef.current = false;
    setTextEntry(next);
    setSession(createSession({ text: next.text, mode: "test" }));
    inputRef.current?.focus();
  }, []);

  const feedChar = useCallback((char: string) => {
    setSession((current) => handleInput(current, { char, timeMs: performance.now() }));
  }, []);

  // Store the finished run exactly once.
  useEffect(() => {
    if (!session.isComplete || session.totalKeystrokes === 0) return;
    if (savedRef.current || progress === null) return;
    savedRef.current = true;
    const summary = summarize(session);
    const nowIso = new Date().toISOString();
    updateProgress((current) =>
      appendSession(
        {
          ...current,
          keyStats: mergeSessionKeyStats(current.keyStats, session.keyStats, nowIso),
        },
        {
          id: crypto.randomUUID(),
          completedAt: nowIso,
          lessonId: `texto:${textEntry.id}`,
          exerciseType: "texto",
          durationMs: Math.round(summary.durationMs),
          totalKeystrokes: summary.totalKeystrokes,
          correctKeystrokes: summary.correctKeystrokes,
          errors: summary.errors,
          accuracy: summary.accuracy,
          ppm: summary.ppm,
          rawPpm: summary.rawPpm,
          consistency: summary.consistency,
          xp: 30,
        },
      ),
    );
  }, [session, progress, textEntry.id, updateProgress]);

  if (progress === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-ink-400">
        Cargando…
      </main>
    );
  }

  const runs = progress.sessions
    .filter((entry) => entry.exerciseType === "texto")
    .sort((a, b) => b.ppm - a.ppm)
    .slice(0, 8);
  const summary = session.isComplete ? summarize(session) : null;
  const titleById = new Map(TEXTS_ES.map((entry) => [`texto:${entry.id}`, entry.title]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
            ← Inicio
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Modo texto</h1>
        </div>
        <p className="text-sm text-ink-600">
          Texto: <span className="font-bold text-brand-700">{textEntry.title}</span>
        </p>
      </header>

      {summary ? (
        <section
          role="status"
          className="rounded-3xl border-2 border-brand-100 bg-noche-900 p-8 text-center shadow-[6px_6px_0_rgba(0,0,0,0.35)]"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Texto completado
          </p>
          <h2 className="mt-1 text-2xl font-bold">{textEntry.title}</h2>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl bg-brand-50 p-4">
              <dt className="text-sm text-ink-600">Velocidad</dt>
              <dd className="text-2xl font-bold">{formatPpm(summary.ppm)} PPM</dd>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4">
              <dt className="text-sm text-ink-600">Velocidad bruta</dt>
              <dd className="text-2xl font-bold">{formatPpm(summary.rawPpm)} PPM</dd>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4">
              <dt className="text-sm text-ink-600">Precisión</dt>
              <dd className="text-2xl font-bold">{formatAccuracy(summary.accuracy)}</dd>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4">
              <dt className="text-sm text-ink-600">Errores</dt>
              <dd className="text-2xl font-bold">{summary.errors}</dd>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4">
              <dt className="text-sm text-ink-600">Corregidos</dt>
              <dd className="text-2xl font-bold">{summary.correctedPositions}</dd>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4">
              <dt className="text-sm text-ink-600">Tiempo</dt>
              <dd className="text-2xl font-bold">{formatDuration(summary.durationMs)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => startNew(textEntry.id)}
            className="mt-8 rounded-2xl bg-brand-500 px-10 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413]"
          >
            Otro texto
          </button>
        </section>
      ) : (
        <>
          {/* Clicking the text refocuses the hidden input that captures typing. */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="cursor-text rounded-3xl border-2 border-brand-100 bg-noche-900 p-8 shadow-[6px_6px_0_rgba(0,0,0,0.35)]"
          >
            <p
              aria-label={`Texto a escribir: ${textEntry.text}`}
              className="select-none font-mono text-xl leading-relaxed"
            >
              {[...textEntry.text].map((char, index) => {
                const typed = session.buffer[index];
                const isCurrent = index === session.position;
                const state =
                  typed === undefined
                    ? isCurrent
                      ? "current"
                      : "future"
                    : typed === char
                      ? "correct"
                      : "wrong";
                return (
                  <span
                    key={index}
                    className={
                      state === "current"
                        ? "rounded bg-brand-100 underline decoration-brand-500 decoration-2 underline-offset-4"
                        : state === "correct"
                          ? "text-menta-400"
                          : state === "wrong"
                            ? "rounded bg-red-400/30 text-red-300"
                            : "text-ink-400"
                    }
                  >
                    {char}
                  </span>
                );
              })}
            </p>
            <input
              ref={inputRef}
              autoFocus
              aria-label="Zona de escritura"
              className="absolute h-0 w-0 opacity-0"
              value=""
              onChange={() => undefined}
              onBeforeInput={(event) => {
                const native = event.nativeEvent as InputEvent;
                event.preventDefault();
                if (native.data) for (const char of native.data) feedChar(char);
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace") {
                  event.preventDefault();
                  setSession((current) =>
                    handleBackspace(current, { timeMs: performance.now() }),
                  );
                  return;
                }
                if (
                  event.key.length === 1 &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  feedChar(event.key);
                }
              }}
            />
          </div>
          <p className="mt-3 flex justify-between text-sm text-ink-400">
            <span>
              Modo real: los errores avanzan y se corrigen con retroceso.
            </span>
            <span>
              {session.position}/{textEntry.text.length} · {session.errors} errores
            </span>
          </p>
          <button
            type="button"
            onClick={() => startNew(textEntry.id)}
            className="mt-3 text-sm font-medium text-brand-600 hover:underline"
          >
            Cambiar de texto
          </button>
        </>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-black">Ranking de textos</h2>
        {runs.length === 0 ? (
          <p className="mt-2 text-ink-600">
            Completa tu primer texto para estrenar el ranking.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border-2 border-brand-100">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-brand-100/60 text-ink-600">
                <tr>
                  <th className="px-4 py-2 font-semibold">#</th>
                  <th className="px-4 py-2 font-semibold">Texto</th>
                  <th className="px-4 py-2 font-semibold">PPM</th>
                  <th className="px-4 py-2 font-semibold">Precisión</th>
                  <th className="px-4 py-2 font-semibold">Errores</th>
                  <th className="px-4 py-2 font-semibold">Tiempo</th>
                  <th className="px-4 py-2 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, index) => (
                  <tr
                    key={run.id}
                    className={index === 0 ? "bg-sol-400/10 font-semibold" : ""}
                  >
                    <td className="px-4 py-2">{index === 0 ? "🏆" : index + 1}</td>
                    <td className="px-4 py-2">
                      {titleById.get(run.lessonId) ?? run.lessonId}
                    </td>
                    <td className="px-4 py-2">{formatPpm(run.ppm)}</td>
                    <td className="px-4 py-2">{formatAccuracy(run.accuracy)}</td>
                    <td className="px-4 py-2">{run.errors}</td>
                    <td className="px-4 py-2">{formatDuration(run.durationMs)}</td>
                    <td className="px-4 py-2 text-ink-600">
                      {run.completedAt.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
