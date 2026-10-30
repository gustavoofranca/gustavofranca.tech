import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { FormField } from "@/components/islands/FormField";
import { useTurnstile } from "@/components/islands/useTurnstile";
import type { Locale } from "@/i18n/locales";
import {
  feedbackKey,
  formToInput,
  parseResult,
  type FeedbackKey,
} from "@/lib/contact/request";
import {
  CONTACT_LIMITS,
  contactSchema,
  fieldErrors,
  type ContactField,
  type ContactInput,
  type FieldErrorKey,
} from "@/lib/contact/schema";

type Labels = {
  label: string;
  name: string;
  email: string;
  message: string;
  messageHint: string;
  honeypot: string;
  send: string;
  sending: string;
  success: string;
  // Já com o e-mail de contato no lugar de {email}.
  errors: Record<FieldErrorKey | Exclude<FeedbackKey, "success">, string> & {
    captchaPending: string;
  };
};

type Props = {
  locale: Locale;
  siteKey: string;
  action: string;
  labels: Labels;
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

const FIELDS: readonly ContactField[] = ["name", "email", "message"];

async function post(action: string, data: ContactInput) {
  try {
    const response = await fetch(action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });
    return parseResult(await response.json());
  } catch {
    // Rede caiu ou a resposta não é JSON: vira a mensagem genérica, que aponta o e-mail.
    return null;
  }
}

// Sem JS, este mesmo <form> faz POST nativo para a API, que redireciona com ?status.
// Com JS, a ilha valida com o mesmo schema do servidor e envia por fetch.
export function ContactForm({ locale, siteKey, action, labels }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const turnstile = useTurnstile(widgetRef, siteKey, locale);
  const [errors, setErrors] = useState<
    Partial<Record<ContactField, FieldErrorKey>>
  >({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Com a ilha ativa, as mensagens de erro são as nossas, não os balões do navegador.
  useEffect(() => {
    if (formRef.current) formRef.current.noValidate = true;
  }, []);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const entries = [...new FormData(form)].map(
      ([key, value]) => [key, String(value)] as [string, string],
    );
    const parsed = contactSchema.safeParse(
      formToInput(new URLSearchParams(entries)),
    );
    if (!parsed.success) {
      const found = fieldErrors(parsed.error);
      setErrors(found);
      setStatus({ kind: "idle" });
      const first = FIELDS.find((field) => found[field]);
      if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    if (!parsed.data.turnstileToken) {
      const message = turnstile.failed
        ? labels.errors.captcha
        : labels.errors.captchaPending;
      setStatus({ kind: "error", message });
      return;
    }

    setStatus({ kind: "sending" });
    const result = await post(action, parsed.data);
    turnstile.reset();
    const key = feedbackKey(result);
    if (key === "success") {
      form.reset();
      setStatus({ kind: "sent" });
      return;
    }
    setStatus({ kind: "error", message: labels.errors[key] });
  }

  const sending = status.kind === "sending";
  const errorText = (field: ContactField) => {
    const key = errors[field];
    return key ? labels.errors[key] : undefined;
  };

  return (
    <form
      ref={formRef}
      id="contact-form"
      method="post"
      action={action}
      aria-label={labels.label}
      onSubmit={onSubmit}
      className="flex flex-col gap-5"
    >
      <FormField
        id="contact-name"
        name="name"
        label={labels.name}
        error={errorText("name")}
        autoComplete="name"
        maxLength={CONTACT_LIMITS.nameMax}
      />
      <FormField
        id="contact-email"
        name="email"
        type="email"
        label={labels.email}
        error={errorText("email")}
        autoComplete="email"
        maxLength={CONTACT_LIMITS.emailMax}
      />
      <FormField
        id="contact-message"
        name="message"
        multiline
        label={labels.message}
        hint={labels.messageHint}
        error={errorText("message")}
        autoComplete="off"
        minLength={CONTACT_LIMITS.messageMin}
        maxLength={CONTACT_LIMITS.messageMax}
      />

      {/* Honeypot: invisível e fora da ordem de foco; só robô preenche. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">{labels.honeypot}</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <input type="hidden" name="locale" value={locale} />

      {/* Altura reservada (65 px é a do widget) para não empurrar o botão quando ele aparece. */}
      <div
        ref={widgetRef}
        className="min-h-[65px] [html:not([data-theme])_&]:hidden"
      />

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-10 items-center justify-center self-start rounded-(--radius-control) bg-fg px-4 text-sm font-medium text-bg transition-colors duration-(--duration-fast) hover:bg-muted disabled:cursor-wait disabled:opacity-70"
        >
          {sending ? labels.sending : labels.send}
        </button>
        <p role="status" className="text-sm font-medium text-fg empty:hidden">
          {status.kind === "sent" ? labels.success : ""}
        </p>
        <p
          role="alert"
          className="text-sm font-medium text-accent empty:hidden"
        >
          {status.kind === "error" ? status.message : ""}
        </p>
      </div>
    </form>
  );
}
