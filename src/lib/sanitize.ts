// Utilitaire pour nettoyer les réponses API (retirer les mots de passe et données sensibles)

export function sanitizeUser(user: any): any {
  if (!user) return user
  const { motDePasse, ...rest } = user
  return rest
}

export function sanitizeProjet(projet: any): any {
  if (!projet) return projet
  return {
    ...projet,
    client: sanitizeUser(projet.client),
    propositions: projet.propositions?.map((p: any) => ({
      ...p,
      freelance: sanitizeUser(p.freelance),
    })),
    recommandations: projet.recommandations?.map((r: any) => ({
      ...r,
      freelance: sanitizeUser(r.freelance),
    })),
  }
}

export function sanitizeProposition(prop: any): any {
  if (!prop) return prop
  return {
    ...prop,
    projet: prop.projet ? { id: prop.projet.id, titre: prop.projet.titre, budgetEstime: prop.projet.budgetEstime, statut: prop.projet.statut } : undefined,
    freelance: sanitizeUser(prop.freelance),
  }
}

export function sanitizeContrat(contrat: any): any {
  if (!contrat) return contrat
  return {
    ...contrat,
    client: sanitizeUser(contrat.client),
    freelance: sanitizeUser(contrat.freelance),
  }
}

export function sanitizeEvaluation(eval_: any): any {
  if (!eval_) return eval_
  return {
    ...eval_,
    evaluateur: sanitizeUser(eval_.evaluateur),
    evalue: sanitizeUser(eval_.evalue),
  }
}

export function sanitizeLitige(litige: any): any {
  if (!litige) return litige
  return {
    ...litige,
    plaignant: sanitizeUser(litige.plaignant),
    defendeur: sanitizeUser(litige.defendeur),
  }
}

export function sanitizeTransaction(transaction: any): any {
  if (!transaction) return transaction
  return {
    ...transaction,
    portefeuille: transaction.portefeuille ? {
      ...transaction.portefeuille,
      utilisateur: sanitizeUser(transaction.portefeuille.utilisateur),
    } : undefined,
  }
}
