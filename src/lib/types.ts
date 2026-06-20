// ============================================================================
// TYPES ET INTERFACES POUR L'API COLLABLINK
// ============================================================================

// ============================================================================
// AUTH & USERS
// ============================================================================

export interface User {
  id: string
  email: string
  nom: string
  prenom: string
  role: 'client' | 'freelance' | 'admin'
  photoUrl?: string
  signatureUrl?: string
  dateCreation: Date
  estActif: boolean
  profilClient?: ProfilClient
  profilFreelance?: ProfilFreelance
  portefeuille?: Portefeuille
}

export interface AuthResponse {
  token: string
  user: User
}

// ============================================================================
// PROFILS
// ============================================================================

export interface ProfilClient {
  id: string
  utilisateurId: string
  nomEntreprise?: string
  descriptionEntreprise?: string
  nombreEmployes?: number
  secteurActivite?: string
  budgetMoyen?: number
  dateCreation: Date
}

export interface ProfilFreelance {
  id: string
  utilisateurId: string
  bio?: string
  lienPortfolio?: string
  lienLinkedIn?: string
  lienGitHub?: string
  tauxHoraire?: number
  tauxFixe?: number
  disponibilite?: 'temps-plein' | 'temps-partiel' | 'ponctuel'
  experienceAnnees?: number
  competences?: FreelanceCompetence[]
  experiences?: ExperienceProfessionnelle[]
  noteMoyenne?: number
  nombreAvis?: number
  dateCreation: Date
}

export interface ExperienceProfessionnelle {
  id: string
  profilFreelanceId: string
  poste: string
  entreprise: string
  dateDebut: Date
  dateFin?: Date
  description?: string
  technologies?: string[]
}

// ============================================================================
// COMPÉTENCES
// ============================================================================

export interface CategorieCompetence {
  id: string
  nom: string
  description?: string
  icone?: string
  dateCreation: Date
}

export interface Competence {
  id: string
  categorieId: string
  nom: string
  description?: string
  niveauDifficulte?: 'debutant' | 'intermediaire' | 'avance' | 'expert'
  categorie?: CategorieCompetence
  dateCreation: Date
}

export interface FreelanceCompetence {
  id: string
  profilFreelanceId: string
  competenceId: string
  niveau?: 'debutant' | 'intermediaire' | 'avance' | 'expert'
  experienceAnnees?: number
  competence?: Competence
}

// ============================================================================
// PROJETS
// ============================================================================

export interface Projet {
  id: string
  clientId: string
  titre: string
  description: string
  budget?: number
  typeContrat?: 'forfait' | 'horaire' | 'fixe'
  dureeEstimee?: string
  statut: 'brouillon' | 'publie' | 'en_cours' | 'termine' | 'annule'
  cahierChargesUrl?: string
  datePublication?: Date
  dateDebut?: Date
  dateFin?: Date
  competences?: ProjetCompetence[]
  propositions?: Proposition[]
  client?: ProfilClient
  contrats?: Contrat[]
}

export interface ProjetCompetence {
  id: string
  projetId: string
  competenceId: string
  competence?: Competence
}

// ============================================================================
// PROPOSITIONS
// ============================================================================

export interface Proposition {
  id: string
  projetId: string
  freelanceId: string
  montantPropose: number
  dureeProposee?: string
  description?: string
  statut: 'en_attente' | 'accepte' | 'refuse' | 'en_cours' | 'termine'
  dateProposition: Date
  freelance?: ProfilFreelance
  projet?: Projet
  contrat?: Contrat
}

export interface PropositionIA {
  id: string
  projetId: string
  freelanceId: string
  montantPropose: number
  dureeProposee?: string
  description?: string
  scoreCompatibilite: number
  statut:
    | 'en_attente'
    | 'negociation'
    | 'accepte'
    | 'refuse'
    | 'en_cours'
    | 'termine'
  raison?: string
  dateProposition: Date
  freelance?: ProfilFreelance
  projet?: Projet
}

export interface RecommandationIA {
  id: string
  projetId: string
  freelanceId: string
  scoreCompatibilite: number
  criteres?: Record<string, number>
  raison?: string
  dateGeneration: Date
}

// ============================================================================
// CONTRATS
// ============================================================================

export interface Contrat {
  id: string
  propositionId?: string
  projetId: string
  clientId: string
  freelanceId: string
  dateSignatureClient?: Date
  dateSignatureFreelance?: Date
  montantFinal: number
  statut:
    | 'en_attente'
    | 'en_cours'
    | 'suspend'
    | 'termine'
    | 'resilie'
    | 'litige'
  termaisonRaison?: string
  dateCreation: Date
  jalons?: Jalon[]
}

export interface Jalon {
  id: string
  contratId: string
  titre: string
  description?: string
  montant: number
  pourcentage?: number
  statut: 'en_attente' | 'valide' | 'refuse' | 'en_revision'
  dateEcheance?: Date
  dateValidation?: Date
  raisonRefus?: string
  dateCreation: Date
}

// ============================================================================
// FEUILLE DE ROUTE
// ============================================================================

export interface FeuilleRoute {
  id: string
  contratId: string
  titre?: string
  description?: string
  etapes?: any[]
  statut: 'planifie' | 'en_cours' | 'termine'
  dateCreation: Date
  dateModification: Date
}

// ============================================================================
// PORTEFEUILLE & TRANSACTIONS
// ============================================================================

export interface Portefeuille {
  id: string
  utilisateurId: string
  solde: number
  montantBloqueContrats: number
  montantDisponible: number
  dateCreation: Date
  transactions?: Transaction[]
}

export interface Transaction {
  id: string
  portefeuilleId: string
  type: 'depot' | 'retrait' | 'paiement' | 'reception' | 'remboursement'
  montant: number
  statut: 'en_attente' | 'validee' | 'rejetee' | 'remboursee'
  raison?: string
  methodePaiement?: string
  justificatifUrl?: string
  dateTransaction: Date
  dateValidation?: Date
}

// ============================================================================
// MESSAGERIE
// ============================================================================

export interface Messagerie {
  id: string
  utilisateur1Id: string
  utilisateur2Id: string
  dernierMessage?: string
  dateDernierMessage?: Date
  messages?: Message[]
}

export interface Message {
  id: string
  messaguerieId: string
  expediteurId: string
  contenu: string
  fichierUrl?: string
  estLu: boolean
  dateEnvoi: Date
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface Notification {
  id: string
  utilisateurId: string
  titre: string
  contenu: string
  type:
    | 'proposition'
    | 'contrat'
    | 'jalon'
    | 'message'
    | 'evaluation'
    | 'litige'
    | 'transaction'
    | 'commentaire'
  referenceId?: string
  referenceType?:
    | 'proposition'
    | 'contrat'
    | 'jalon'
    | 'messagerie'
    | 'evaluation'
    | 'litige'
    | 'transaction'
  estLue: boolean
  dateCreation: Date
  dateExpiration?: Date
}

// ============================================================================
// LITIGES
// ============================================================================

export interface Litige {
  id: string
  contratId: string
  initiateurdId: string
  titreProbleme: string
  descriptionProbleme: string
  statut:
    | 'ouvert'
    | 'en_cours'
    | 'resolu'
    | 'ferme'
    | 'remboursement_demande'
  priorite: 'basse' | 'normale' | 'haute' | 'critique'
  preuveUrl?: string
  dateCreation: Date
  dateResolution?: Date
}

// ============================================================================
// ÉVALUATIONS
// ============================================================================

export interface Evaluation {
  id: string
  contratId: string
  evaluateurId: string
  evalueId: string
  note: number
  commentaire?: string
  aspectsEvalues?: {
    qualite?: number
    communication?: number
    respect_delais?: number
    professionnalisme?: number
  }
  dateEvaluation: Date
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}
