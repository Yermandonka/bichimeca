"use client";

import Link from "next/link";
import { use } from "react";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import { LessonRunner } from "./LessonRunner";

export default function LeccionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const lesson = CURRICULUM_ES.find((candidate) => candidate.id === id);

  if (!lesson) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-lg text-ink-600">Esta lección no existe.</p>
        <Link
          href="/curso"
          className="mt-4 inline-block font-medium text-brand-600 hover:underline"
        >
          Volver al curso
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-baseline justify-between">
        <div>
          <Link
            href="/curso"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            ← Curso
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{lesson.title}</h1>
        </div>
        {lesson.introducedKeys.length > 0 && (
          <p className="text-sm text-ink-600">
            Teclas nuevas:{" "}
            <span className="font-mono font-bold text-brand-700">
              {lesson.introducedKeys.map((key) => key.toUpperCase()).join(" · ")}
            </span>
          </p>
        )}
      </header>
      <LessonRunner key={lesson.id} lesson={lesson} />
    </main>
  );
}
