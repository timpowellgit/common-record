export type Locale = "en" | "fr";

export const locales = ["en", "fr"] as const satisfies readonly Locale[];

const en = {
  "timeline.heading": "Public timeline",
  "timeline.intro":
    "Only operator-approved updates appear here. Nothing is published automatically.",
  "timeline.empty":
    "No public updates yet. This campaign is still being researched.",
  "timeline.verifiedBy": "Published by {name}",
  "timeline.requestLabel": "Request",
  "timeline.eventType.research-completed": "Research completed",
  "timeline.eventType.routes-verified": "Filing routes verified",
  "timeline.eventType.request-filed": "Request filed",
  "timeline.eventType.acknowledgment-received": "Acknowledgment received",
  "timeline.eventType.fee-estimate-received": "Fee estimate received",
  "timeline.eventType.fee-paid": "Fees paid",
  "timeline.eventType.response-received": "Response received",
  "timeline.eventType.records-published": "Records published",
} as const;

export type MessageKey = keyof typeof en;

const fr: Record<MessageKey, string> = {
  "timeline.heading": "Chronologie publique",
  "timeline.intro":
    "Seules les mises à jour approuvées par un membre de l'équipe apparaissent ici. Rien n'est publié automatiquement.",
  "timeline.empty":
    "Aucune mise à jour publique pour le moment. Cette campagne est encore en phase de recherche.",
  "timeline.verifiedBy": "Publié par {name}",
  "timeline.requestLabel": "Demande",
  "timeline.eventType.research-completed": "Recherche terminée",
  "timeline.eventType.routes-verified": "Voies de dépôt vérifiées",
  "timeline.eventType.request-filed": "Demande déposée",
  "timeline.eventType.acknowledgment-received": "Accusé de réception reçu",
  "timeline.eventType.fee-estimate-received": "Estimation des frais reçue",
  "timeline.eventType.fee-paid": "Frais payés",
  "timeline.eventType.response-received": "Réponse reçue",
  "timeline.eventType.records-published": "Dossiers publiés",
};

const dictionaries: Record<Locale, Record<MessageKey, string>> = { en, fr };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fr";
}

export function t(
  key: MessageKey,
  locale: Locale = "en",
  params?: Record<string, string>,
): string {
  const template = dictionaries[locale][key] ?? dictionaries.en[key];
  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}

export function timelineEventTypeLabel(
  eventType: string,
  locale: Locale = "en",
): string {
  const key = `timeline.eventType.${eventType}` as MessageKey;
  return t(key, locale);
}

export function messageKeys(locale: Locale = "en"): MessageKey[] {
  return Object.keys(dictionaries[locale]) as MessageKey[];
}
