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

export function LessonRunner({ lesson }: { lesson: Lesson }) {
  const { progress, updateProgress } = useProgress();
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [session, setSession] = useState<Session>(() =>
    createSession({ text: lesson.exercises[0].text, mode: "learning" }),
  );
  const [completed, setCompleted] = useState<CompletedExercise[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  const isLessonDone = completed.length === lesson.exercises.length;

  const nextLesson = useMemo(
    () => nextLessonAfter(CURRICULUM_ES, lesson.id),
    [lesson.id],
  );

  const feedChar = useCallback((char: string) => {
    setSession((current) => {
      const next = handleInput(current, { char, timeMs: performance.now() });
      return next;
    });
  }, []);

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
    setSession(createSession({ text: lesson.exercises[0].text, mode: "learning" }));
    inputRef.current?.focus();
  }, [lesson]);

  if (isLessonDone) {
    const totals = combineSummaries(completed);
    return (
      <section
        role="status"
        className="mx-auto mt-8 max-w-xl rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-lg"
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
                  ? "text-brand-500"
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
              className="w-full rounded-full bg-brand-500 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-brand-600"
            >
              Siguiente
            </Link>
          ) : (
            <Link
              href="/curso"
              className="w-full rounded-full bg-brand-500 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-brand-600"
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

  const text = lesson.exercises[exerciseIndex].text;

  return (
    <section className="mt-8">
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
        className="cursor-text rounded-3xl border border-brand-100 bg-white p-8 shadow-md"
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
                        ? "text-brand-600"
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
            }
          }}
        />
      </div>

      <p className="mt-4 text-center text-sm text-ink-400">
        Escribe el texto. Los errores no avanzan: pulsa la tecla correcta para
        continuar.
      </p>
    </section>
  );
}
