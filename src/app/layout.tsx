import type { Metadata } from "next";
import "./globals.css";
import { ProgressProvider } from "./providers";

export const metadata: Metadata = {
  title: "Bichimeca — Mecanografía en español",
  description:
    "Aprende mecanografía en español con lecciones adaptativas, precisión primero y práctica diaria.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <ProgressProvider>{children}</ProgressProvider>
      </body>
    </html>
  );
}
