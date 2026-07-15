import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plateforme de suivi des marchés publics",
  description:
    "POC — Gestion et suivi des marchés publics (Plan de passation, passation, contrats, GED, fournisseurs).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
