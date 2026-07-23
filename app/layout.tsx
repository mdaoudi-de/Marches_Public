import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Probitech — Marchés publics & Due Diligence (FONAREV)",
  description:
    "Probitech — plateforme de gestion des marchés publics et de due diligence des tiers pour FONAREV (RDC).",
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
