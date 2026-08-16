"use client";

import Link from "next/link";
import { use } from "react";
import { CURRICULUM_ES } from "@/data/curriculum/es";

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
        <Link href="/curso" className="mt-4 inline-block font-medium text-brand-600 hover:underline">
          Volver al curso
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/curso" className="text-sm font-medium text-brand-600 hover:underline">
        ← Curso
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{lesson.title}</h1>
      <p className="mt-4 rounded-xl bg-brand-100 px-4 py-3 text-brand-700">
        El ejercicio interactivo llega en la próxima iteración. Estos son los
        textos de práctica de la lección:
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {lesson.exercises.map((exercise, index) => (
          <li
            key={index}
            className="rounded-xl border border-brand-100 bg-white p-4 font-mono text-lg tracking-wide"
          >
            {exercise.text}
          </li>
        ))}
      </ul>
    </main>
  );
}
