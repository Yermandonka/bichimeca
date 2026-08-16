import type { ReactNode } from "react";
import { CURRICULUM_ES } from "@/data/curriculum/es";

export function generateStaticParams() {
  return CURRICULUM_ES.map((lesson) => ({ id: lesson.id }));
}

export default function LeccionLayout({ children }: { children: ReactNode }) {
  return children;
}
