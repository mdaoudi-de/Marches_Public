/**
 * Valeurs "énumérées" (stockées en String faute d'enum SQLite) + libellés FR
 * + tons de badge pour l'affichage. Source unique de vérité pour l'UI et le seed.
 */
import type { Tone } from "@/components/ui-types";

export type Role =
  | "ADMIN"
  | "SECRETAIRE_PERMANENT"
  | "RESP_PREPARATION"
  | "RESP_PASSATION"
  | "RESP_SUIVI";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  SECRETAIRE_PERMANENT: "Secrétaire Permanent",
  RESP_PREPARATION: "Responsable Préparation",
  RESP_PASSATION: "Responsable Passation",
  RESP_SUIVI: "Responsable Suivi des contrats",
};

export type MarketNature = "TRAVAUX" | "FOURNITURES_SERVICES" | "PRESTATIONS_INTELLECTUELLES";

export const NATURE_LABELS: Record<MarketNature, string> = {
  TRAVAUX: "Travaux",
  FOURNITURES_SERVICES: "Fournitures & Services",
  PRESTATIONS_INTELLECTUELLES: "Prestations intellectuelles",
};

export const NATURE_SHORT: Record<MarketNature, string> = {
  TRAVAUX: "Travaux",
  FOURNITURES_SERVICES: "Fournitures",
  PRESTATIONS_INTELLECTUELLES: "Prest. intel.",
};

export type ProcedureType =
  | "AO_OUVERT"
  | "AO_RESTREINT"
  | "DEMANDE_COTATION"
  | "CONSULTATION_FOURNISSEURS"
  | "GRE_A_GRE"
  | "AMI"
  | "SC_QUALITE"
  | "SC_QUALITE_COUT"
  | "SC_MOINDRE_COUT"
  | "SC_BUDGET_DETERMINE"
  | "SC_INDIVIDUEL";

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  AO_OUVERT: "Appel d'offres ouvert",
  AO_RESTREINT: "Appel d'offres restreint",
  DEMANDE_COTATION: "Demande de cotation",
  CONSULTATION_FOURNISSEURS: "Consultation de fournisseurs",
  GRE_A_GRE: "Gré à gré",
  AMI: "Appel à manifestation d'intérêt (AMI)",
  SC_QUALITE: "Sélection de consultants — Qualité",
  SC_QUALITE_COUT: "Sélection de consultants — Qualité-Coût",
  SC_MOINDRE_COUT: "Sélection de consultants — Moindre coût",
  SC_BUDGET_DETERMINE: "Sélection de consultants — Budget déterminé",
  SC_INDIVIDUEL: "Consultant individuel",
};

export type MarketStatus = "PREVU" | "LANCE" | "ATTRIBUE" | "EXECUTE" | "CLOTURE" | "RESILIE";

export const MARKET_STATUS_LABELS: Record<MarketStatus, string> = {
  PREVU: "Prévu",
  LANCE: "Lancé",
  ATTRIBUE: "Attribué",
  EXECUTE: "Exécuté",
  CLOTURE: "Clôturé",
  RESILIE: "Résilié",
};

export const MARKET_STATUS_TONE: Record<MarketStatus, Tone> = {
  PREVU: "gray",
  LANCE: "blue",
  ATTRIBUE: "violet",
  EXECUTE: "amber",
  CLOTURE: "green",
  RESILIE: "red",
};

export type StepStatus = "A_VENIR" | "EN_COURS" | "REALISE" | "EN_RETARD";

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  REALISE: "Réalisé",
  EN_RETARD: "En retard",
};

export const STEP_STATUS_TONE: Record<StepStatus, Tone> = {
  A_VENIR: "gray",
  EN_COURS: "blue",
  REALISE: "green",
  EN_RETARD: "red",
};

export type StepKind = "DATE" | "MONTANT" | "VALIDATION" | "DOCUMENT";

export type SupplierType = "ENTREPRISE" | "CONSULTANT_CABINET" | "CONSULTANT_INDIVIDUEL";

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  ENTREPRISE: "Entreprise",
  CONSULTANT_CABINET: "Cabinet / Bureau d'études",
  CONSULTANT_INDIVIDUEL: "Consultant individuel",
};

export type ContractType = "SIMPLE" | "BON_COMMANDE" | "CONTRAT_CADRE";

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  SIMPLE: "Marché simple",
  BON_COMMANDE: "À bons de commande",
  CONTRAT_CADRE: "Contrat-cadre",
};

export type ContractStatus =
  | "ACTIF"
  | "SUSPENDU"
  | "RECEPTIONNE_PROVISOIRE"
  | "RECEPTIONNE_DEFINITIF"
  | "RESILIE"
  | "CLOTURE";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  RECEPTIONNE_PROVISOIRE: "Réception provisoire",
  RECEPTIONNE_DEFINITIF: "Réception définitive",
  RESILIE: "Résilié",
  CLOTURE: "Clôturé",
};

export const CONTRACT_STATUS_TONE: Record<ContractStatus, Tone> = {
  ACTIF: "blue",
  SUSPENDU: "amber",
  RECEPTIONNE_PROVISOIRE: "violet",
  RECEPTIONNE_DEFINITIF: "green",
  RESILIE: "red",
  CLOTURE: "gray",
};

export type GuaranteeType =
  | "CAUTION_SOUMISSION"
  | "GARANTIE_BONNE_EXECUTION"
  | "RETENUE_GARANTIE"
  | "GARANTIE_AVANCE";

export const GUARANTEE_TYPE_LABELS: Record<GuaranteeType, string> = {
  CAUTION_SOUMISSION: "Caution de soumission",
  GARANTIE_BONNE_EXECUTION: "Garantie de bonne exécution",
  RETENUE_GARANTIE: "Retenue de garantie",
  GARANTIE_AVANCE: "Garantie de restitution d'avance",
};

export type GuaranteeStatus = "ACTIVE" | "LIBEREE" | "EXPIREE";
export const GUARANTEE_STATUS_LABELS: Record<GuaranteeStatus, string> = {
  ACTIVE: "Active",
  LIBEREE: "Libérée",
  EXPIREE: "Expirée",
};
export const GUARANTEE_STATUS_TONE: Record<GuaranteeStatus, Tone> = {
  ACTIVE: "green",
  LIBEREE: "gray",
  EXPIREE: "red",
};

export type PaymentType = "AVANCE" | "ACOMPTE" | "DECOMPTE" | "SOLDE";
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  AVANCE: "Avance de démarrage",
  ACOMPTE: "Acompte",
  DECOMPTE: "Décompte",
  SOLDE: "Solde",
};

export type PaymentStatus = "EN_ATTENTE" | "PAYE" | "EN_RETARD";
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  EN_ATTENTE: "En attente",
  PAYE: "Payé",
  EN_RETARD: "En retard",
};
export const PAYMENT_STATUS_TONE: Record<PaymentStatus, Tone> = {
  EN_ATTENTE: "amber",
  PAYE: "green",
  EN_RETARD: "red",
};

export type ReceptionType = "LIVRAISON" | "PROVISOIRE" | "DEFINITIVE";
export const RECEPTION_TYPE_LABELS: Record<ReceptionType, string> = {
  LIVRAISON: "Livraison",
  PROVISOIRE: "Réception provisoire",
  DEFINITIVE: "Réception définitive",
};

export type ReceptionStatus = "EN_ATTENTE" | "RECEPTIONNE" | "EN_RETARD";
export const RECEPTION_STATUS_LABELS: Record<ReceptionStatus, string> = {
  EN_ATTENTE: "En attente",
  RECEPTIONNE: "Réceptionné",
  EN_RETARD: "En retard",
};
export const RECEPTION_STATUS_TONE: Record<ReceptionStatus, Tone> = {
  EN_ATTENTE: "amber",
  RECEPTIONNE: "green",
  EN_RETARD: "red",
};

export type ServiceOrderType = "DEMARRAGE" | "ARRET" | "REPRISE" | "MODIFICATION";
export const SERVICE_ORDER_TYPE_LABELS: Record<ServiceOrderType, string> = {
  DEMARRAGE: "Ordre de démarrage",
  ARRET: "Ordre d'arrêt",
  REPRISE: "Ordre de reprise",
  MODIFICATION: "Ordre de modification",
};

export type AmendmentStatus = "EN_COURS" | "APPROUVE" | "REJETE";
export const AMENDMENT_STATUS_LABELS: Record<AmendmentStatus, string> = {
  EN_COURS: "En cours",
  APPROUVE: "Approuvé",
  REJETE: "Rejeté",
};

export type PurchaseOrderStatus = "EMISE" | "LIVREE" | "PAYEE" | "ANNULEE";
export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  EMISE: "Émise",
  LIVREE: "Livrée",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};
export const PO_STATUS_TONE: Record<PurchaseOrderStatus, Tone> = {
  EMISE: "blue",
  LIVREE: "violet",
  PAYEE: "green",
  ANNULEE: "gray",
};

export type PurchaseRequestStatus = "DEMANDE" | "APPROUVEE" | "COMMANDEE" | "PAYEE" | "REJETEE";
export const PR_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  DEMANDE: "Demande",
  APPROUVEE: "Approuvée",
  COMMANDEE: "Commandée",
  PAYEE: "Payée",
  REJETEE: "Rejetée",
};
export const PR_STATUS_TONE: Record<PurchaseRequestStatus, Tone> = {
  DEMANDE: "gray",
  APPROUVEE: "blue",
  COMMANDEE: "violet",
  PAYEE: "green",
  REJETEE: "red",
};

export type DocumentCategory =
  | "DAO"
  | "DPQ"
  | "TDR"
  | "PV"
  | "RAPPORT_EVALUATION"
  | "CONTRAT"
  | "ORDRE_SERVICE"
  | "FACTURE"
  | "AVIS_NON_OBJECTION"
  | "AVENANT"
  | "GARANTIE"
  | "AUTRE";

export const DOC_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  DAO: "Dossier d'appel d'offres (DAO)",
  DPQ: "Dossier de pré-qualification (DPQ)",
  TDR: "Termes de référence (TDR)",
  PV: "Procès-verbal",
  RAPPORT_EVALUATION: "Rapport d'évaluation",
  CONTRAT: "Contrat",
  ORDRE_SERVICE: "Ordre de service",
  FACTURE: "Facture",
  AVIS_NON_OBJECTION: "Avis de non-objection",
  AVENANT: "Avenant",
  GARANTIE: "Garantie",
  AUTRE: "Autre",
};

export type AlertType =
  | "RETARD_PUBLICATION"
  | "ETAPE_EN_RETARD"
  | "ECHEANCE_CONTRAT"
  | "GARANTIE_EXPIRATION"
  | "RETARD_LIVRAISON"
  | "PAIEMENT_ATTENTE"
  | "DOC_TIERS_EXPIRATION"
  | "TIERS_RISQUE_ELEVE"
  | "TIERS_REEVALUATION_DUE"
  | "TIERS_INCIDENT";

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  RETARD_PUBLICATION: "Retard de publication",
  ETAPE_EN_RETARD: "Étape en retard",
  ECHEANCE_CONTRAT: "Échéance de contrat",
  GARANTIE_EXPIRATION: "Garantie arrivant à expiration",
  RETARD_LIVRAISON: "Retard de livraison",
  PAIEMENT_ATTENTE: "Paiement en attente",
  DOC_TIERS_EXPIRATION: "Pièce d'un tiers arrivant à expiration",
  TIERS_RISQUE_ELEVE: "Tiers à risque élevé",
  TIERS_REEVALUATION_DUE: "Réévaluation d'un tiers échue",
  TIERS_INCIDENT: "Incident de surveillance (tiers)",
};

export type AlertSeverity = "INFO" | "WARNING" | "CRITIQUE";
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  INFO: "Info",
  WARNING: "À surveiller",
  CRITIQUE: "Critique",
};
export const ALERT_SEVERITY_TONE: Record<AlertSeverity, Tone> = {
  INFO: "blue",
  WARNING: "amber",
  CRITIQUE: "red",
};

export type AlertStatus = "ACTIVE" | "ACQUITTEE" | "RESOLUE";
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  ACTIVE: "Active",
  ACQUITTEE: "Acquittée",
  RESOLUE: "Résolue",
};

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VALIDATE"
  | "EXPORT"
  | "UPLOAD";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  VALIDATE: "Validation",
  EXPORT: "Export",
  UPLOAD: "Import fichier",
};

export type AppModule =
  | "DASHBOARD"
  | "PPM"
  | "PASSATION"
  | "CONTRATS"
  | "ACHATS"
  | "FOURNISSEURS"
  | "TIERS"
  | "GED"
  | "ALERTES"
  | "ADMIN";

/** Petit utilitaire tolérant : renvoie le libellé, sinon la clé brute. */
export function label<T extends string>(map: Record<T, string>, key: string | null | undefined): string {
  if (!key) return "—";
  return (map as Record<string, string>)[key] ?? key;
}

/* ================= Module 8 — Tiers / Due Diligence ===================== */

export type RiskLevel = "FAIBLE" | "MOYEN" | "ELEVE" | "CRITIQUE";
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  FAIBLE: "Faible", MOYEN: "Moyen", ELEVE: "Élevé", CRITIQUE: "Critique",
};
export const RISK_LEVEL_TONE: Record<RiskLevel, Tone> = {
  FAIBLE: "green", MOYEN: "amber", ELEVE: "red", CRITIQUE: "red",
};

export type ThirdPartyDecision = "VALIDE" | "VALIDE_CONDITIONNEL" | "DD_RENFORCEE" | "REJETE";
export const DECISION_LABELS: Record<ThirdPartyDecision, string> = {
  VALIDE: "Validé", VALIDE_CONDITIONNEL: "Validation conditionnelle",
  DD_RENFORCEE: "Due diligence renforcée", REJETE: "Rejeté",
};
export const DECISION_TONE: Record<ThirdPartyDecision, Tone> = {
  VALIDE: "green", VALIDE_CONDITIONNEL: "amber", DD_RENFORCEE: "violet", REJETE: "red",
};

export type ThirdPartyStage =
  | "ENREGISTRE" | "COLLECTE" | "VERIF_AUTO" | "QUESTIONNAIRE" | "SCREENING"
  | "SCORING" | "DECISION" | "SURVEILLANCE" | "REEVALUATION";
export const STAGE_LABELS: Record<ThirdPartyStage, string> = {
  ENREGISTRE: "Enregistré", COLLECTE: "Collecte documentaire", VERIF_AUTO: "Vérifications automatiques",
  QUESTIONNAIRE: "Questionnaire DD", SCREENING: "Screening", SCORING: "Scoring",
  DECISION: "Décision", SURVEILLANCE: "Surveillance continue", REEVALUATION: "Réévaluation",
};

export const REPRESENTATIVE_ROLE_LABELS: Record<string, string> = {
  GERANT: "Gérant", DG: "Directeur Général", PRESIDENT: "Président", PERSONNE_HABILITEE: "Personne habilitée",
};

export type ThirdPartyDocType =
  | "RCCM" | "ID_NATIONAL" | "NIF" | "ATTESTATION_FISCALE" | "ATTESTATION_CNSS"
  | "AGREMENT" | "LICENCE" | "STATUTS" | "PIECE_DIRIGEANT" | "PROCURATION" | "RIB";
export const TP_DOC_LABELS: Record<ThirdPartyDocType, string> = {
  RCCM: "RCCM", ID_NATIONAL: "ID National", NIF: "NIF", ATTESTATION_FISCALE: "Attestation fiscale",
  ATTESTATION_CNSS: "Attestation CNSS", AGREMENT: "Agrément", LICENCE: "Licence", STATUTS: "Statuts",
  PIECE_DIRIGEANT: "Pièce d'identité des dirigeants", PROCURATION: "Procuration", RIB: "RIB bancaire",
};
export const TP_DOC_ORDER: ThirdPartyDocType[] = [
  "RCCM", "ID_NATIONAL", "NIF", "ATTESTATION_FISCALE", "ATTESTATION_CNSS",
  "AGREMENT", "LICENCE", "STATUTS", "PIECE_DIRIGEANT", "PROCURATION", "RIB",
];

export type DocControlStatus = "OK" | "MANQUANT" | "EXPIRE" | "INCOHERENT" | "FORMAT_INVALIDE" | "DOUBLON";
export const DOC_CONTROL_LABELS: Record<DocControlStatus, string> = {
  OK: "Conforme", MANQUANT: "Manquant", EXPIRE: "Expiré", INCOHERENT: "Incohérent",
  FORMAT_INVALIDE: "Format invalide", DOUBLON: "Doublon",
};
export const DOC_CONTROL_TONE: Record<DocControlStatus, Tone> = {
  OK: "green", MANQUANT: "red", EXPIRE: "red", INCOHERENT: "amber", FORMAT_INVALIDE: "amber", DOUBLON: "amber",
};

export type DueDiligenceQuestion =
  | "ANTICORRUPTION" | "CODE_CONDUITE" | "CONDAMNATION" | "EXCLUSION_MP"
  | "PROCEDURE_JUDICIAIRE" | "LIENS_AGENTS_PUBLICS" | "LBC_FT";
export const DD_QUESTION_LABELS: Record<DueDiligenceQuestion, string> = {
  ANTICORRUPTION: "Disposez-vous d'un programme anticorruption ?",
  CODE_CONDUITE: "Disposez-vous d'un code de conduite ?",
  CONDAMNATION: "Avez-vous déjà été condamné ?",
  EXCLUSION_MP: "Avez-vous déjà été exclu d'un marché public ?",
  PROCEDURE_JUDICIAIRE: "Êtes-vous impliqué dans une procédure judiciaire ?",
  LIENS_AGENTS_PUBLICS: "Avez-vous des liens avec des agents publics ?",
  LBC_FT: "Disposez-vous d'une politique LBC/FT ?",
};
/** Réponse considérée « à risque » pour chaque question. */
export const DD_RISKY_ANSWER: Record<DueDiligenceQuestion, "OUI" | "NON"> = {
  ANTICORRUPTION: "NON", CODE_CONDUITE: "NON", CONDAMNATION: "OUI", EXCLUSION_MP: "OUI",
  PROCEDURE_JUDICIAIRE: "OUI", LIENS_AGENTS_PUBLICS: "OUI", LBC_FT: "NON",
};
export const DD_ORDER: DueDiligenceQuestion[] = [
  "ANTICORRUPTION", "CODE_CONDUITE", "CONDAMNATION", "EXCLUSION_MP",
  "PROCEDURE_JUDICIAIRE", "LIENS_AGENTS_PUBLICS", "LBC_FT",
];

export type InvestigationItem =
  | "VERIF_PHYSIQUE" | "VISITE_LOCAUX" | "VERIF_BANCAIRE" | "REFERENCES_CLIENTS" | "BENEF_EFFECTIFS"
  | "ANALYSE_FINANCIERE" | "SOUS_TRAITANTS" | "ENTRETIEN_DIRIGEANTS" | "CONFLITS_INTERETS" | "MEDIAS";
export const INVESTIGATION_LABELS: Record<InvestigationItem, string> = {
  VERIF_PHYSIQUE: "Vérification physique de l'entreprise", VISITE_LOCAUX: "Visite des locaux",
  VERIF_BANCAIRE: "Vérification bancaire", REFERENCES_CLIENTS: "Vérification des références clients",
  BENEF_EFFECTIFS: "Contrôle des bénéficiaires effectifs", ANALYSE_FINANCIERE: "Analyse financière",
  SOUS_TRAITANTS: "Vérification des sous-traitants", ENTRETIEN_DIRIGEANTS: "Entretien avec les dirigeants",
  CONFLITS_INTERETS: "Vérification des conflits d'intérêts", MEDIAS: "Analyse des médias",
};
export const INVESTIGATION_ORDER: InvestigationItem[] = [
  "VERIF_PHYSIQUE", "VISITE_LOCAUX", "VERIF_BANCAIRE", "REFERENCES_CLIENTS", "BENEF_EFFECTIFS",
  "ANALYSE_FINANCIERE", "SOUS_TRAITANTS", "ENTRETIEN_DIRIGEANTS", "CONFLITS_INTERETS", "MEDIAS",
];

export type RiskRubric =
  | "IDENTITE_JURIDIQUE" | "SITUATION_ADMINISTRATIVE" | "DOCUMENTS" | "SITUATION_FISCALE"
  | "GOUVERNANCE" | "REPUTATION" | "HISTORIQUE_MARCHES" | "INTEGRITE";
export const RUBRIC_LABELS: Record<RiskRubric, string> = {
  IDENTITE_JURIDIQUE: "Identité juridique", SITUATION_ADMINISTRATIVE: "Situation administrative",
  DOCUMENTS: "Documents", SITUATION_FISCALE: "Situation fiscale", GOUVERNANCE: "Gouvernance",
  REPUTATION: "Réputation", HISTORIQUE_MARCHES: "Historique des marchés", INTEGRITE: "Intégrité",
};
/** Pondérations (Σ = 100) issues du document source. */
export const RUBRIC_WEIGHTS: Record<RiskRubric, number> = {
  IDENTITE_JURIDIQUE: 15, SITUATION_ADMINISTRATIVE: 10, DOCUMENTS: 10, SITUATION_FISCALE: 10,
  GOUVERNANCE: 10, REPUTATION: 15, HISTORIQUE_MARCHES: 15, INTEGRITE: 15,
};
export const RUBRIC_ORDER: RiskRubric[] = [
  "IDENTITE_JURIDIQUE", "SITUATION_ADMINISTRATIVE", "DOCUMENTS", "SITUATION_FISCALE",
  "GOUVERNANCE", "REPUTATION", "HISTORIQUE_MARCHES", "INTEGRITE",
];

export type InternalControlKey = "C1" | "C2" | "C3" | "C4" | "C5" | "C7" | "C8";
export const CONTROL_LABELS: Record<InternalControlKey, string> = {
  C1: "Récurrence d'attribution de marchés de même type au tiers",
  C2: "Absence de concurrence effective (faute de candidats)",
  C3: "Attribution récurrente à un tiers dont la note technique < 2,5/10",
  C4: "Conformité aux attentes de la « fiche bilan » des marchés précédents",
  C5: "Signalements sur l'intégrité (conflit d'intérêts, agent FONAREV)",
  C7: "Performance du contrôle comptable",
  C8: "Performance du contrôle interne de la direction (suivi des prestations)",
};
export const CONTROL_ORDER: InternalControlKey[] = ["C1", "C2", "C3", "C4", "C5", "C7", "C8"];

export type MonitoringEventType =
  | "CHANGEMENT_DIRIGEANT" | "CHANGEMENT_ACTIONNARIAT" | "MODIF_RCCM" | "NOUVELLE_SANCTION"
  | "DECISION_JUDICIAIRE" | "FAILLITE" | "INCIDENT_CONTRACTUEL" | "PENALITES_REPETEES"
  | "DEPASSEMENT_DELAIS" | "CHANGEMENT_RIB" | "VARIATION_MONTANTS";
export const MONITORING_LABELS: Record<MonitoringEventType, string> = {
  CHANGEMENT_DIRIGEANT: "Changement de dirigeant", CHANGEMENT_ACTIONNARIAT: "Changement d'actionnariat",
  MODIF_RCCM: "Modification du RCCM", NOUVELLE_SANCTION: "Nouvelle sanction",
  DECISION_JUDICIAIRE: "Décision judiciaire", FAILLITE: "Faillite ou dissolution",
  INCIDENT_CONTRACTUEL: "Incident contractuel", PENALITES_REPETEES: "Pénalités répétées",
  DEPASSEMENT_DELAIS: "Dépassement des délais contractuels", CHANGEMENT_RIB: "Modification des coordonnées bancaires",
  VARIATION_MONTANTS: "Variation inhabituelle des montants facturés",
};

export type AnswerYNU = "OUI" | "NON" | "NSP";
export const ANSWER_LABELS: Record<AnswerYNU, string> = { OUI: "Oui", NON: "Non", NSP: "Non renseigné" };
