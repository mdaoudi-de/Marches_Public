/**
 * Définition des templates de procédure, fidèles aux 9 variantes du modèle
 * Excel (3 natures × 3 modalités) + 2 procédures allégées. Chaque template
 * = phases → étapes. L'étape « Montant du contrat » est de type MONTANT
 * (prévu vs réalisé sur un montant, et non sur une date).
 */
export interface TemplateDef {
  key: string;
  name: string;
  nature: "TRAVAUX" | "FOURNITURES_SERVICES" | "PRESTATIONS_INTELLECTUELLES";
  procedureType: string;
  requiresPrequalification: boolean;
  requiresRevuePrealable: boolean;
  phases: { name: string; steps: string[] }[];
}

const CONCLUSION_TRAVAUX = [
  "Mise au point du contrat",
  "Non-objection sur contrat",
  "Approbation du contrat",
  "Date d'enregistrement",
  "Montant du contrat",
  "Date de notification",
  "Date d'entrée en vigueur",
  "Date de début des travaux",
];

const CONCLUSION_FOURN = [
  "Mise au point du contrat",
  "Non-objection sur contrat",
  "Approbation du contrat",
  "Date d'enregistrement",
  "Montant du contrat",
  "Date de notification",
  "Date d'entrée en vigueur",
  "Date de livraison",
];

const CONCLUSION_PI = [
  "Négociation du contrat",
  "Non-objection sur le contrat",
  "Approbation du contrat",
  "Date d'enregistrement",
  "Montant du contrat",
  "Date de notification",
  "Date d'entrée en vigueur",
  "Date de début des prestations",
];

export const TEMPLATES: TemplateDef[] = [
  /* ------------------------------------------------------------- Travaux */
  {
    key: "TRAVAUX_PREQUAL",
    name: "Travaux — Appel d'offres avec pré-qualification",
    nature: "TRAVAUX",
    procedureType: "AO_RESTREINT",
    requiresPrequalification: true,
    requiresRevuePrealable: true,
    phases: [
      {
        name: "Phase 1 : Pré-qualification",
        steps: [
          "Études et élaboration du DPQ",
          "Non-objection sur DPQ",
          "Publication de l'APQ",
          "Date limite de dépôt des candidatures",
          "Évaluation des candidatures",
          "Non-objection sur rapport d'évaluation",
        ],
      },
      {
        name: "Phase 2 : Appel d'offres",
        steps: [
          "Élaboration du DAO",
          "Non-objection sur DAO",
          "Publication de l'AAO",
          "Date limite de dépôt des offres",
        ],
      },
      {
        name: "Phase 3 : Évaluation des offres",
        steps: ["Évaluation des offres", "Non-objection sur rapport d'évaluation", "Publication de l'attribution"],
      },
      { name: "Phase 4 : Conclusion et notification", steps: CONCLUSION_TRAVAUX },
    ],
  },
  {
    key: "TRAVAUX_OUVERT",
    name: "Travaux — Appel d'offres ouvert (avec revue préalable)",
    nature: "TRAVAUX",
    procedureType: "AO_OUVERT",
    requiresPrequalification: false,
    requiresRevuePrealable: true,
    phases: [
      {
        name: "Phase 1 : Appel d'offres",
        steps: ["Élaboration du DAO", "Non-objection sur DAO", "Publication de l'AAO", "Date limite de dépôt des offres"],
      },
      {
        name: "Phase 2 : Évaluation des offres",
        steps: ["Évaluation des offres", "Non-objection sur rapport d'évaluation", "Publication de l'attribution"],
      },
      { name: "Phase 3 : Conclusion et notification", steps: CONCLUSION_TRAVAUX },
    ],
  },
  {
    key: "TRAVAUX_SANS_REVUE",
    name: "Travaux — Appel d'offres ouvert (sans revue préalable des DAO)",
    nature: "TRAVAUX",
    procedureType: "AO_OUVERT",
    requiresPrequalification: false,
    requiresRevuePrealable: false,
    phases: [
      {
        name: "Phase 1 : Appel d'offres",
        steps: ["Élaboration du DAO", "Publication de l'AAO", "Date limite de dépôt des offres"],
      },
      {
        name: "Phase 2 : Évaluation des offres",
        steps: ["Évaluation des offres", "Non-objection sur rapport d'évaluation", "Publication de l'attribution"],
      },
      { name: "Phase 3 : Conclusion et notification", steps: CONCLUSION_TRAVAUX },
    ],
  },

  /* --------------------------------------------------------- Fournitures */
  {
    key: "FOURN_PREQUAL",
    name: "Fournitures & Services — AO avec pré-qualification",
    nature: "FOURNITURES_SERVICES",
    procedureType: "AO_RESTREINT",
    requiresPrequalification: true,
    requiresRevuePrealable: true,
    phases: [
      {
        name: "Phase 1 : Pré-qualification",
        steps: [
          "Élaboration du DPQ",
          "Non-objection sur DPQ",
          "Publication de l'APQ",
          "Date limite de dépôt des candidatures",
          "Évaluation des candidatures",
          "Non-objection sur rapport d'évaluation",
        ],
      },
      {
        name: "Phase 2 : Appel d'offres",
        steps: ["Élaboration du DAO", "Non-objection sur DAO", "Publication de l'AAO", "Date limite de dépôt des offres"],
      },
      {
        name: "Phase 3 : Évaluation des offres",
        steps: ["Évaluation des offres", "Non-objection sur rapport d'évaluation", "Publication de l'attribution"],
      },
      { name: "Phase 4 : Conclusion et notification", steps: CONCLUSION_FOURN },
    ],
  },
  {
    key: "FOURN_OUVERT",
    name: "Fournitures & Services — AO ouvert (avec revue préalable)",
    nature: "FOURNITURES_SERVICES",
    procedureType: "AO_OUVERT",
    requiresPrequalification: false,
    requiresRevuePrealable: true,
    phases: [
      {
        name: "Phase 1 : Appel d'offres",
        steps: ["Élaboration du DAO", "Non-objection sur DAO", "Publication de l'AAO", "Date limite de dépôt des offres"],
      },
      {
        name: "Phase 2 : Évaluation des offres",
        steps: ["Évaluation des offres", "Non-objection sur rapport d'évaluation", "Publication de l'attribution"],
      },
      { name: "Phase 3 : Conclusion et notification", steps: CONCLUSION_FOURN },
    ],
  },
  {
    key: "FOURN_SANS_REVUE",
    name: "Fournitures & Services — AO ouvert (sans revue préalable des DAO)",
    nature: "FOURNITURES_SERVICES",
    procedureType: "AO_OUVERT",
    requiresPrequalification: false,
    requiresRevuePrealable: false,
    phases: [
      {
        name: "Phase 1 : Appel d'offres",
        steps: ["Élaboration du DAO", "Publication de l'AAO", "Date limite de dépôt des offres"],
      },
      {
        name: "Phase 2 : Évaluation des offres",
        steps: ["Évaluation des offres", "Non-objection sur rapport d'évaluation", "Publication de l'attribution"],
      },
      { name: "Phase 3 : Conclusion et notification", steps: CONCLUSION_FOURN },
    ],
  },

  /* ----------------------------------------------- Prestations intellect. */
  {
    key: "PI_AMI",
    name: "Prestations intellectuelles — Sélection avec présélection (AMI)",
    nature: "PRESTATIONS_INTELLECTUELLES",
    procedureType: "SC_QUALITE_COUT",
    requiresPrequalification: true,
    requiresRevuePrealable: true,
    phases: [
      {
        name: "Phase 1 : Présélection (AMI)",
        steps: [
          "Préparation de l'AMI",
          "Non-objection sur l'AMI",
          "Publication de l'AMI",
          "Dépôt des manifestations d'intérêt",
          "Évaluation des manifestations d'intérêt",
          "Non-objection sur la liste restreinte",
        ],
      },
      {
        name: "Phase 2 : Appel d'offres",
        steps: [
          "Élaboration des TDR et de la DP",
          "Non-objection sur les TDR et la DP",
          "Envoi des lettres d'invitation",
          "Date limite de dépôt des propositions",
        ],
      },
      {
        name: "Phase 3 : Évaluation des offres",
        steps: [
          "Évaluation des propositions techniques",
          "Non-objection sur rapport PT",
          "Invitation à l'ouverture des propositions financières",
          "Évaluation combinée PT/PF",
        ],
      },
      { name: "Phase 4 : Conclusion et notification", steps: CONCLUSION_PI },
    ],
  },
  {
    key: "PI_RESTREINTE",
    name: "Prestations intellectuelles — Consultation restreinte",
    nature: "PRESTATIONS_INTELLECTUELLES",
    procedureType: "SC_QUALITE",
    requiresPrequalification: false,
    requiresRevuePrealable: true,
    phases: [
      {
        name: "Phase 1 : Appel d'offres",
        steps: [
          "Non-objection sur la liste restreinte",
          "Élaboration des TDR et de la DP",
          "Non-objection sur les TDR et la DP",
          "Envoi des lettres d'invitation",
          "Date limite de dépôt des propositions",
        ],
      },
      {
        name: "Phase 2 : Évaluation des offres",
        steps: [
          "Évaluation des propositions techniques",
          "Non-objection sur rapport PT",
          "Invitation à l'ouverture des propositions financières",
          "Évaluation combinée PT/PF",
        ],
      },
      { name: "Phase 3 : Conclusion et notification", steps: CONCLUSION_PI },
    ],
  },
  {
    key: "PI_RESTREINTE_SANS_REVUE",
    name: "Prestations intellectuelles — Consultation restreinte (sans revue préalable de la DP)",
    nature: "PRESTATIONS_INTELLECTUELLES",
    procedureType: "SC_MOINDRE_COUT",
    requiresPrequalification: false,
    requiresRevuePrealable: false,
    phases: [
      {
        name: "Phase 1 : Appel d'offres",
        steps: [
          "Non-objection sur la liste restreinte",
          "Élaboration des TDR et de la DP",
          "Envoi des lettres d'invitation",
          "Date limite de dépôt des propositions",
        ],
      },
      {
        name: "Phase 2 : Évaluation des offres",
        steps: [
          "Évaluation des propositions techniques",
          "Non-objection sur rapport PT",
          "Invitation à l'ouverture des propositions financières",
          "Évaluation combinée PT/PF",
        ],
      },
      { name: "Phase 3 : Conclusion et notification", steps: CONCLUSION_PI },
    ],
  },

  /* ------------------------------------------------ Procédures allégées */
  {
    key: "FOURN_COTATION",
    name: "Fournitures — Demande de cotation (procédure allégée)",
    nature: "FOURNITURES_SERVICES",
    procedureType: "DEMANDE_COTATION",
    requiresPrequalification: false,
    requiresRevuePrealable: false,
    phases: [
      {
        name: "Phase 1 : Consultation",
        steps: ["Élaboration de la demande de cotation", "Envoi de la demande aux fournisseurs", "Date limite de dépôt des cotations"],
      },
      {
        name: "Phase 2 : Évaluation et attribution",
        steps: ["Évaluation des cotations", "Publication de l'attribution"],
      },
      {
        name: "Phase 3 : Conclusion",
        steps: ["Signature du contrat / bon de commande", "Montant du contrat", "Date de notification", "Date de livraison"],
      },
    ],
  },
  {
    key: "TRAVAUX_GRE_A_GRE",
    name: "Travaux — Gré à gré (entente directe)",
    nature: "TRAVAUX",
    procedureType: "GRE_A_GRE",
    requiresPrequalification: false,
    requiresRevuePrealable: true,
    phases: [
      {
        name: "Phase 1 : Entente directe",
        steps: ["Justification du recours au gré à gré", "Non-objection sur le recours au gré à gré", "Négociation avec le fournisseur"],
      },
      {
        name: "Phase 2 : Conclusion",
        steps: ["Approbation du contrat", "Montant du contrat", "Date de notification", "Date d'entrée en vigueur", "Date de début des travaux"],
      },
    ],
  },
];
