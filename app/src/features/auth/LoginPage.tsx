"use client";

import {
  ArrowRight, BellRing, Eye, EyeOff, Leaf, LockKeyhole, Mail, RadioTower, TrendingUp,
} from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export type LoginCredentials = { email: string; password: string };

// LoginScreen fornece a integração real; o componente visual também pode ser renderizado isoladamente.
async function loginUnavailable(): Promise<void> {
  throw new Error("O acesso à plataforma ainda não está disponível. Entre em contato com o administrador.");
}

export function LoginPage({ onLogin = loginUnavailable }: {
  onLogin?: (credentials: LoginCredentials) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Informe um e-mail válido.";
    if (!password) next.password = "Informe sua senha.";
    setErrors(next);
    setError("");
    if (Object.keys(next).length) return;
    submitting.current = true;
    setPending(true);
    try {
      await onLogin({ email: email.trim().toLowerCase(), password });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="hero-band on-dark relative isolate overflow-hidden px-6 py-8 text-white sm:px-10 lg:flex lg:min-h-dvh lg:flex-col lg:px-14 lg:py-12 xl:px-20">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-300 text-forest ring-1 ring-white/20">
            <Leaf className="size-6" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">Agritech</p>
            <p className="text-xs text-white/70">Portal Climático</p>
          </div>
        </div>

        <div className="relative z-10 hidden max-w-lg lg:my-auto lg:block lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-300/25 bg-brand-300/10 px-3 py-1.5 text-[11px] font-semibold tracking-widest text-brand-200 uppercase">
            <span className="size-1.5 rounded-full bg-brand-300" aria-hidden />
            Tecnologia que acompanha o campo
          </span>
          <h2 className="mt-7 text-[clamp(2.5rem,4vw,3.75rem)] leading-[1.08] font-semibold tracking-tight">
            O clima no campo,<br /><span className="text-brand-300">em uma visão.</span>
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75">
            Acompanhe suas estações, entenda o comportamento do clima e transforme dados em decisões.
          </p>
          <div className="mt-10 space-y-5 border-t border-white/15 pt-7">
            {[
              { icon: RadioTower, title: "Estações conectadas", text: "Medições e status da rede em um só lugar." },
              { icon: TrendingUp, title: "Informação para planejar", text: "Histórico, estatísticas e previsão meteorológica." },
              { icon: BellRing, title: "Atenção ao que importa", text: "Alertas e ocorrências para acompanhar de perto." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-300 ring-1 ring-white/10">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-white/95">{title}</p>
                  <p className="mt-0.5 text-[13px] text-white/65">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="hidden text-xs text-white/55 lg:block">Monitoramento meteorológico para o dia a dia no campo.</p>
      </section>

      <section aria-labelledby="login-title" className="flex min-w-0 flex-col items-center justify-center px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[24px] border border-line bg-surface p-6 shadow-[var(--shadow-lift)] sm:p-9">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <p className="mt-6 text-[11px] font-semibold tracking-[0.16em] text-brand-700 uppercase">Acesso à plataforma</p>
            <h1 id="login-title" className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-ink">Bem-vindo de volta</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">Entre com suas credenciais para acessar o Portal Climático.</p>

            <form aria-label="Entrar no Portal Climático" noValidate onSubmit={submit} className="mt-8 space-y-5">
              <Field label="E-mail" error={errors.email}>
                {(props) => (
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-faint" aria-hidden />
                    <Input {...props} type="email" name="email" autoComplete="username" inputMode="email"
                      placeholder="seu.email@exemplo.com" className="h-11 pl-10" maxLength={150}
                      value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} required />
                  </div>
                )}
              </Field>
              <Field label="Senha" error={errors.password}>
                {(props) => (
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-faint" aria-hidden />
                    <Input {...props} type={visible ? "text" : "password"} name="password" autoComplete="current-password"
                      placeholder="Digite sua senha" className="h-11 pr-12 pl-10" maxLength={1024}
                      value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} required />
                    <button type="button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible}
                      disabled={pending} onClick={() => setVisible((value) => !value)}
                      className="absolute top-1 right-1 inline-flex size-9 items-center justify-center rounded-md text-faint hover:bg-subtle hover:text-ink disabled:opacity-50">
                      {visible ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
                    </button>
                  </div>
                )}
              </Field>
              {error && (
                <p role="alert" className="rounded-lg border border-danger/15 bg-danger-soft p-3 text-[13px] leading-relaxed text-danger">{error}</p>
              )}
              <Button type="submit" className="h-11 w-full justify-between px-4" loading={pending}>
                {pending ? "Entrando…" : "Entrar na plataforma"}
                {!pending && <ArrowRight className="size-4" aria-hidden />}
              </Button>
            </form>
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-center text-xs leading-relaxed text-muted">Precisa de acesso ou de ajuda com sua senha?<br />
                <span className="font-medium text-ink">Entre em contato com o administrador.</span>
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-faint">Agritech · Portal Climático</p>
        </div>
      </section>
    </main>
  );
}
