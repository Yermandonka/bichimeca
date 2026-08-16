"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "@/domain/curriculum/types";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import {
  createSession,
  handleBackspace,
  handleInput,
  summarize,
  type Session,
} from "@/domain/engine/session";
import {
  combineKeyStats,
  combineSummaries,
  type CompletedExercise,
} from "@/domain/engine/aggregate";
import {
  formatAccuracy,
  formatDuration,
  formatPpm,
} from "@/domain/metrics/format";
import { nextLessonAfter } from "@/domain/curriculum/ordering";
import { appendSession } from "@/domain/progress/progress";
import { starsForAccuracy } from "@/domain/gamification/gamification";
import { mergeSessionKeyStats } from "@/domain/progress/keyStats";
import { useProgress } from "@/app/providers";
import { keyGuidance } from "@/domain/keyboard/teaching";
import { VirtualKeyboard } from "./VirtualKeyboard";

export function LessonRunner({ lesson }: { lesson: Lesson }) {
  const { progress, updateProgress } = useProgress();
  const [phase, setPhase] = useState<"intro" | "typing">("intro");
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [session, setSession] = useState<Session>(() =>
    createSession({ text: lesson.exercises[0].text, mode: "learning" }),
  );
  const [completed, setCompleted] = useState<CompletedExercise[]>([]);
  /** "carrera" dynamic: 0..100 energy drained by time, refilled by hits. */
  const [energy, setEnergy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  const isLessonDone = completed.length === lesson.exercises.length;

  // Carrera: the turbo bar drains while typing; it never punishes, it only
  // invites a steady pace. Correct keys refill it (see feedChar).
  useEffect(() => {
    if (lesson.dynamic !== "carrera" || phase !== "typing" || isLessonDone) return;
    const interval = window.setInterval(() => {
      setEnergy((value) => Math.max(0, value - 0.9));
    }, 200);
    return () => window.clearInterval(interval);
  }, [lesson.dynamic, phase, isLessonDone]);

  const nextLesson = useMemo(
    () => nextLessonAfter(CURRICULUM_ES, lesson.id),
    [lesson.id],
  );

  const feedChar = useCallback(
    (char: string) => {
      setSession((current) => {
        const next = handleInput(current, { char, timeMs: performance.now() });
        return next;
      });
      if (lesson.dynamic === "carrera") {
        // Refill on any attempt; steady typing keeps the flame alive.
        setEnergy((value) => Math.min(100, value + 2.2));
      }
    },
    [lesson.dynamic],
  );

  // When the current exercise completes, archive it and start the next one.
  useEffect(() => {
    if (!session.isComplete || session.totalKeystrokes === 0) return;
    setCompleted((done) => [
      ...done,
      { summary: summarize(session), keyStats: session.keyStats },
    ]);
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < lesson.exercises.length) {
      setExerciseIndex(nextIndex);
      setEnergy(100);
      setSession(
        createSession({
          text: lesson.exercises[nextIndex].text,
          mode: "learning",
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- driven only by completion
  }, [session.isComplete]);

  // Persist the lesson result exactly once.
  useEffect(() => {
    if (!isLessonDone || savedRef.current || progress === null) return;
    savedRef.current = true;
    const totals = combineSummaries(completed);
    const nowIso = new Date().toISOString();
    updateProgress((current) =>
      appendSession(
        {
          ...current,
          keyStats: mergeSessionKeyStats(
            current.keyStats,
            combineKeyStats(completed),
            nowIso,
          ),
        },
        {
          id: crypto.randomUUID(),
          completedAt: nowIso,
          lessonId: lesson.id,
          exerciseType: lesson.type,
          durationMs: Math.round(totals.durationMs),
          totalKeystrokes: totals.totalKeystrokes,
          correctKeystrokes: totals.correctKeystrokes,
          errors: totals.errors,
          accuracy: totals.accuracy,
          ppm: totals.ppm,
          rawPpm: totals.rawPpm,
          consistency: totals.consistency,
          xp: lesson.xp,
        },
      ),
    );
  }, [isLessonDone, completed, progress, lesson, updateProgress]);

  const restart = useCallback(() => {
    savedRef.current = false;
    setCompleted([]);
    setExerciseIndex(0);
    setEnergy(100);
    setSession(createSession({ text: lesson.exercises[0].text, mode: "learning" }));
    inputRef.current?.focus();
  }, [lesson]);

  if (isLessonDone) {
    const totals = combineSummaries(completed);
    return (
      <section
        role="status"
        className="mx-auto mt-8 max-w-xl rounded-3xl border border-brand-100 bg-noche-900 p-8 text-center shadow-lg"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Lección completada
        </p>
        <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
        <p
          className="mt-3 text-3xl tracking-widest"
          aria-label={`${starsForAccuracy(totals.accuracy)} de 3 estrellas`}
        >
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              aria-hidden="true"
              className={
                star <= starsForAccuracy(totals.accuracy)
                  ? "text-sol-400"
                  : "text-ink-900/15"
              }
            >
              ★
            </span>
          ))}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Velocidad</dt>
            <dd className="text-2xl font-bold">
              {formatPpm(totals.ppm)} <span className="text-base font-medium">PPM</span>
            </dd>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Precisión</dt>
            <dd className="text-2xl font-bold">{formatAccuracy(totals.accuracy)}</dd>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Errores</dt>
            <dd className="text-2xl font-bold">{totals.errors}</dd>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Tiempo</dt>
            <dd className="text-2xl font-bold">{formatDuration(totals.durationMs)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-lg font-semibold text-brand-600">+{lesson.xp} XP</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {nextLesson ? (
            <Link
              href={`/leccion/${nextLesson.id}`}
              className="w-full rounded-2xl bg-brand-500 px-8 py-3 text-lg font-bold text-noche-950 shadow-[4px_4px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[2px_2px_0_#7a2413]"
            >
              Siguiente
            </Link>
          ) : (
            <Link
              href="/curso"
              className="w-full rounded-2xl bg-brand-500 px-8 py-3 text-lg font-bold text-noche-950 shadow-[4px_4px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[2px_2px_0_#7a2413]"
            >
              Volver al curso
            </Link>
          )}
          <button
            type="button"
            onClick={restart}
            className="w-full rounded-full border border-brand-100 px-8 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Repetir
          </button>
        </div>
      </section>
    );
  }

  if (phase === "intro") {
    const guides = lesson.introducedKeys.flatMap((key) => {
      const guidance = keyGuidance(key);
      return guidance ? [{ key, guidance }] : [];
    });
    return (
      <section className="mx-auto mt-8 max-w-2xl rounded-3xl border-2 border-brand-100 bg-noche-900 p-8 shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
        {guides.length > 0 && (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Teclas nuevas
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {guides.map(({ key, guidance }) => (
                <div key={key} className="flex items-start gap-5">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-brand-500 bg-brand-100 font-mono text-3xl font-black text-brand-700 shadow-[3px_3px_0_#7a2413]">
                    {key === " " ? "␣" : key.toUpperCase()}
                  </span>
                  <div>
                    <p className="font-bold">
                      {guidance.fingerLabel}
                      <span className="font-normal text-ink-600">
                        {" "}
                        ·{" "}
                        {guidance.hand === "las dos"
                          ? "las dos manos"
                          : `mano ${guidance.hand}`}
                      </span>
                    </p>
                    <p className="mt-1 text-ink-600">{guidance.movement}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {lesson.tip && (
          <div
            className={`rounded-2xl border-l-4 border-sol-400 bg-brand-100/50 p-5 ${
              guides.length > 0 ? "mt-7" : ""
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-sol-400">
              Consejo
            </p>
            <p className="mt-2 text-lg leading-relaxed text-ink-900">{lesson.tip}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setPhase("typing")}
          className="mt-8 w-full rounded-2xl bg-brand-500 px-8 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413]"
        >
          Empezar a escribir
        </button>
      </section>
    );
  }

  const text = lesson.exercises[exerciseIndex].text;

  // Dynamic panels: same pedagogy underneath, more juice on top.
  let dynamicPanel: React.ReactNode = null;
  if (lesson.dynamic === "carrera") {
    dynamicPanel = (
      <div className="mb-4 rounded-2xl border-2 border-brand-100 bg-noche-900 p-4">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>🏁 Carrera turbo</span>
          <span className={energy > 0 ? "text-sol-400" : "text-ink-400"}>
            {energy > 0 ? "⚡ ¡Energía viva!" : "Recupera el ritmo"}
          </span>
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-noche-950">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sol-400 transition-all duration-200"
            style={{ width: `${energy}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink-600">
          Cada tecla alimenta la llama: escribe con ritmo constante para que no
          se apague. Sin castigos, solo velocidad.
        </p>
      </div>
    );
  } else if (lesson.dynamic === "globos") {
    const tokens = text.split(" ");
    const tokensDone = session.isComplete
      ? tokens.length
      : text.slice(0, session.position).split(" ").length - 1;
    dynamicPanel = (
      <div className="mb-4 rounded-2xl border-2 border-brand-100 bg-noche-900 p-4 text-center">
        <p className="text-sm font-bold">🎈 Revienta un globo por palabra</p>
        <p className="mt-2 text-3xl tracking-wide">
          {tokens.map((_, index) => (
            <span
              key={index}
              className={
                index < tokensDone
                  ? "anim-pop-in inline-block"
                  : index === tokensDone
                    ? "anim-wobble inline-block"
                    : "inline-block opacity-40"
              }
            >
              {index < tokensDone ? "✨" : "🎈"}
            </span>
          ))}
        </p>
      </div>
    );
  } else if (lesson.dynamic === "jefe") {
    const totalChars = lesson.exercises.reduce(
      (acc, exercise) => acc + exercise.text.length,
      0,
    );
    const typedChars =
      completed.reduce((acc, entry) => acc + entry.summary.correctKeystrokes, 0) +
      session.position;
    const health = Math.max(0, 100 - (typedChars / totalChars) * 100);
    dynamicPanel = (
      <div className="mb-4 rounded-2xl border-2 border-red-400/40 bg-noche-900 p-4">
        <div className="flex items-center gap-4">
          <span
            className={`text-5xl ${session.currentPositionErrored ? "" : "anim-drift"}`}
            aria-hidden="true"
          >
            🐲
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="uppercase tracking-wide text-red-300">
                👑 Combate final
              </span>
              <span>{Math.ceil(health)} %</span>
            </div>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-noche-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-brand-500 transition-all duration-200"
                style={{ width: `${health}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-600">
              Cada tecla correcta le quita energía al dragón. ¡Derrótalo
              escribiendo!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8">
      {dynamicPanel}
      <div className="mb-4 flex items-center justify-between text-sm text-ink-600">
        <span>
          Ejercicio {exerciseIndex + 1} de {lesson.exercises.length}
        </span>
        <span aria-hidden="true" className="flex gap-1.5">
          {lesson.exercises.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-6 rounded-full ${
                index < exerciseIndex
                  ? "bg-brand-500"
                  : index === exerciseIndex
                    ? "bg-brand-100 ring-1 ring-brand-500"
                    : "bg-ink-900/10"
              }`}
            />
          ))}
        </span>
      </div>

      {/* Clicking the text refocuses the hidden input that captures typing. */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="cursor-text rounded-3xl border-2 border-brand-100 bg-noche-900 p-8 shadow-[6px_6px_0_rgba(0,0,0,0.35)]"
      >
        <p
          aria-label={`Texto a escribir: ${text}`}
          className="select-none font-mono text-3xl leading-relaxed tracking-wider"
        >
          {[...text].map((char, index) => {
            const isPast = index < session.position;
            const isCurrent = index === session.position;
            const errored = isCurrent && session.currentPositionErrored;
            return (
              <span
                key={index}
                className={
                  errored
                    ? "rounded bg-red-100 text-red-700 underline decoration-2 underline-offset-4"
                    : isCurrent
                      ? "rounded bg-brand-100 text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4"
                      : isPast
                        ? "text-menta-400"
                        : "text-ink-400"
                }
              >
                {char === " " ? " " : char}
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
            // Only composition results (dead keys, IME) reach this handler:
            // plain printable keys are consumed at keydown below, and their
            // preventDefault suppresses the corresponding beforeinput.
            const native = event.nativeEvent as InputEvent;
            event.preventDefault();
            if (native.data) {
              for (const char of native.data) feedChar(char);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              setSession((current) =>
                handleBackspace(current, { timeMs: performance.now() }),
              );
              return;
            }
            // Consume plain printable keys (single character, no modifier,
            // not composing) at keydown — the earliest and most reliable
            // event across browsers; space in particular does not deliver a
            // usable beforeinput everywhere and would scroll the page.
            // Dead keys report "Dead"/"Process" (length > 1) or isComposing,
            // so they fall through to the beforeinput handler above.
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

      <VirtualKeyboard
        expectedChar={session.text[session.position] ?? null}
        hasError={session.currentPositionErrored}
      />

      <p className="mt-4 text-center text-sm text-ink-400">
        Escribe el texto. Los errores no avanzan: pulsa la tecla correcta para
        continuar.
      </p>
    </section>
  );
}
