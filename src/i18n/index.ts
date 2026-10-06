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
  "timeline.sourceLive": "Live from the database",
  "timeline.sourceLocal": "Prototype data, stored in this browser only",
  "timeline.eventType.research-completed": "Research completed",
  "timeline.eventType.routes-verified": "Filing routes verified",
  "timeline.eventType.draft-approved": "Request draft approved",
  "timeline.eventType.submitted-and-delivered": "Request submitted and delivered",
  "timeline.eventType.acknowledgment-received": "Acknowledgment received",
  "timeline.eventType.deadline-set": "Statutory deadline set",
  "timeline.eventType.clarification-requested": "Clarification requested",
  "timeline.eventType.clarification-answered": "Clarification answered",
  "timeline.eventType.extension-claimed": "Extension claimed",
  "timeline.eventType.fee-estimate-received": "Fee estimate received",
  "timeline.eventType.fee-approved": "Fee approved",
  "timeline.eventType.fee-disputed": "Fee disputed",
  "timeline.eventType.fee-paid": "Fees paid",
  "timeline.eventType.response-overdue": "Response overdue",
  "timeline.eventType.partial-decision-received": "Partial decision received",
  "timeline.eventType.final-decision-received": "Final decision received",
  "timeline.eventType.records-released": "Records released",
  "timeline.eventType.records-published": "Records published",
  "timeline.eventType.dataset-published": "Dataset published",
  "timeline.eventType.appeal-filed": "Appeal filed",
  "timeline.eventType.appeal-resolved": "Appeal resolved",
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
  "timeline.sourceLive": "Données en direct de la base de données",
  "timeline.sourceLocal": "Données de prototype, stockées uniquement dans ce navigateur",
  "timeline.eventType.research-completed": "Recherche terminée",
  "timeline.eventType.routes-verified": "Voies de dépôt vérifiées",
  "timeline.eventType.draft-approved": "Projet de demande approuvé",
  "timeline.eventType.submitted-and-delivered": "Demande déposée et transmise",
  "timeline.eventType.acknowledgment-received": "Accusé de réception reçu",
  "timeline.eventType.deadline-set": "Échéance légale établie",
  "timeline.eventType.clarification-requested": "Précision demandée",
  "timeline.eventType.clarification-answered": "Précision fournie",
  "timeline.eventType.extension-claimed": "Prolongation invoquée",
  "timeline.eventType.fee-estimate-received": "Estimation des frais reçue",
  "timeline.eventType.fee-approved": "Frais approuvés",
  "timeline.eventType.fee-disputed": "Frais contestés",
  "timeline.eventType.fee-paid": "Frais payés",
  "timeline.eventType.response-overdue": "Réponse en retard",
  "timeline.eventType.partial-decision-received": "Décision partielle reçue",
  "timeline.eventType.final-decision-received": "Décision finale reçue",
  "timeline.eventType.records-released": "Dossiers communiqués",
  "timeline.eventType.records-published": "Dossiers publiés",
  "timeline.eventType.dataset-published": "Jeu de données publié",
  "timeline.eventType.appeal-filed": "Recours déposé",
  "timeline.eventType.appeal-resolved": "Recours résolu",
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
