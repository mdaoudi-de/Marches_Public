"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/actions/auth";
import { Button, Field, Input } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { u: "sp", label: "Secrétaire Permanent" },
  { u: "prep", label: "Resp. Préparation" },
  { u: "passation", label: "Resp. Passation" },
  { u: "suivi", label: "Resp. Suivi contrats" },
  { u: "admin", label: "Administrateur" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-2xl font-bold ring-1 ring-white/20">
            MP
          </div>
          <h1 className="text-xl font-bold">Plateforme de suivi des marchés publics</h1>
          <p className="mt-1 text-sm text-brand-100">Gestion & pilotage du cycle de passation</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-xl">
          <form action={formAction} className="space-y-4">
            <Field label="Identifiant" htmlFor="username">
              <Input id="username" name="username" autoComplete="username" autoFocus placeholder="ex. admin" />
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
            </Field>
            {state?.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {state.error}
              </p>
            )}
            <SubmitButton />
          </form>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Comptes de démonstration (mot de passe : <code className="rounded bg-slate-100 px-1">Passw0rd!</code>)</p>
            <ul className="grid grid-cols-1 gap-1 text-xs text-slate-600">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.u} className="flex justify-between">
                  <span className="font-mono text-slate-800">{a.u}</span>
                  <span className="text-slate-400">{a.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-brand-200">
          POC — AFRICA LINK BUSINESS · démonstrateur
        </p>
      </div>
    </main>
  );
}
