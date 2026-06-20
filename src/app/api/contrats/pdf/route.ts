import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/contrats/pdf?id=<precontratId ou contratId>
// Retourne une page HTML imprimable représentant le contrat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new NextResponse('ID du contrat requis', { status: 400 })
    }

    // Chercher le contrat soit par id, soit par precontratId
    let contrat = await db.contrat.findFirst({
      where: { OR: [{ id }, { precontratId: id }] },
      include: {
        projet: true,
        client: true,
        freelance: { include: { profilFreelance: true } },
        precontrat: { include: { proposition: true } },
        jalons: { orderBy: { ordre: 'asc' } },
      }
    })

    if (!contrat) {
      // Peut-être un précontrat pas encore signé
      const precontrat = await db.precontrat.findUnique({
        where: { id },
        include: {
          proposition: { include: { freelance: { include: { profilFreelance: true } }, projet: { include: { client: true } } } },
          projet: true,
        }
      })

      if (!precontrat) {
        return new NextResponse('Contrat introuvable', { status: 404 })
      }

      // Générer HTML pour précontrat non signé
      const html = genererHtmlPrecontrat(precontrat)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="precontrat-${precontrat.id}.html"`,
        }
      })
    }

    const html = genererHtmlContrat(contrat)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="contrat-${contrat.numeroContrat}.html"`,
      }
    })
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return new NextResponse('Erreur lors de la génération du document', { status: 500 })
  }
}

function genererHtmlContrat(contrat: any): string {
  const client = contrat.client
  const freelance = contrat.freelance
  const projet = contrat.projet
  const precontrat = contrat.precontrat
  const jalons = contrat.jalons || []
  const dateSignature = new Date(contrat.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrat ${contrat.numeroContrat}</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: 'Times New Roman', Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #1E3A8A; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1E3A8A; font-size: 28px; margin: 0; }
    .header .subtitle { color: #666; margin-top: 5px; }
    .contract-number { background: #f0f4ff; padding: 10px; text-align: center; font-weight: bold; color: #1E3A8A; margin: 20px 0; border-radius: 4px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
    .party { padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
    .party h3 { margin-top: 0; color: #1E3A8A; border-bottom: 2px solid #3B82F6; padding-bottom: 5px; }
    .party p { margin: 5px 0; font-size: 14px; }
    .section { margin: 25px 0; }
    .section h2 { color: #1E3A8A; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .section p, .section li { font-size: 14px; }
    .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .signature-block { text-align: center; }
    .signature-block .sig-img { height: 80px; border-bottom: 1px solid #000; margin-bottom: 10px; display: flex; align-items: flex-end; justify-content: center; }
    .signature-block .sig-img img { max-height: 70px; max-width: 200px; }
    .signature-block .label { font-size: 13px; color: #666; }
    .signature-block .name { font-weight: bold; margin-top: 5px; }
    .footer { margin-top: 60px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
    .signature-status { background: #d1fae5; padding: 8px 15px; border-radius: 4px; color: #065f46; font-weight: 600; text-align: center; margin: 15px 0; }
    .badges { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0; }
    .badge { padding: 4px 10px; border-radius: 12px; background: #e0e7ff; color: #3730a3; font-size: 12px; }
    @media print {
      body { max-width: none; padding: 0; }
      .no-print { display: none; }
    }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #1E3A8A; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .print-btn:hover { background: #1E40AF; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
  
  <div class="header">
    <h1>CONTRAT DE PRESTATION FREELANCE</h1>
    <div class="subtitle">Plateforme Collaborative de Gestion des Projets Freelances</div>
  </div>

  <div class="contract-number">
    CONTRAT N° ${contrat.numeroContrat}
  </div>

  <div class="signature-status">
    ✓ CONTRAT SIGNÉ ET VALIDÉ LE ${dateSignature}
  </div>

  <div class="section">
    <p><strong>Objet du contrat :</strong> ${escapeHtml(projet?.titre || 'Prestation freelance')}</p>
    <p><strong>Date de création :</strong> ${dateSignature}</p>
    <p><strong>Statut :</strong> Actif</p>
  </div>

  <div class="parties">
    <div class="party">
      <h3>LE CLIENT</h3>
      <p><strong>${escapeHtml(client?.prenom || '')} ${escapeHtml(client?.nom || '')}</strong></p>
      <p>Email : ${escapeHtml(client?.email || '')}</p>
      ${client?.telephone ? `<p>Téléphone : ${escapeHtml(client.telephone)}</p>` : ''}
      ${client?.pays ? `<p>Pays : ${escapeHtml(client.pays)}</p>` : ''}
    </div>
    <div class="party">
      <h3>LE PRESTATAIRE (FREELANCE)</h3>
      <p><strong>${escapeHtml(freelance?.prenom || '')} ${escapeHtml(freelance?.nom || '')}</strong></p>
      <p>Email : ${escapeHtml(freelance?.email || '')}</p>
      ${freelance?.telephone ? `<p>Téléphone : ${escapeHtml(freelance.telephone)}</p>` : ''}
      ${freelance?.pays ? `<p>Pays : ${escapeHtml(freelance.pays)}</p>` : ''}
      ${freelance?.profilFreelance?.titreProfessionnel ? `<p>Titre : ${escapeHtml(freelance.profilFreelance.titreProfessionnel)}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Article 1 — Objet de la prestation</h2>
    <p>Le présent contrat a pour objet la réalisation de la prestation suivante :</p>
    <p><strong>${escapeHtml(projet?.titre || '')}</strong></p>
    <p>${escapeHtml(projet?.description || '')}</p>
  </div>

  ${precontrat?.objectifs ? `
  <div class="section">
    <h2>Article 2 — Objectifs de la prestation</h2>
    <p>${escapeHtml(precontrat.objectifs)}</p>
  </div>` : ''}

  <div class="section">
    <h2>Article ${precontrat?.objectifs ? '3' : '2'} — Montant et modalités de paiement</h2>
    <p>Le montant total du contrat est fixé à <strong>${contrat.montantTotal?.toLocaleString('fr-FR')} FCFA</strong> (Francs CFA).</p>
    <p>Le paiement est mis en séquestre sur la plateforme et sera libéré au fur et à mesure de la validation des jalons par le client.</p>
  </div>

  <div class="section">
    <h2>Article ${precontrat?.objectifs ? '4' : '3'} — Délai d'exécution</h2>
    <p><strong>Date de début :</strong> ${precontrat?.dateDebut ? new Date(precontrat.dateDebut).toLocaleDateString('fr-FR') : dateSignature}</p>
    <p><strong>Date de fin prévue :</strong> ${precontrat?.dateFin ? new Date(precontrat.dateFin).toLocaleDateString('fr-FR') : (projet?.delaiLivraison ? new Date(projet.delaiLivraison).toLocaleDateString('fr-FR') : 'Non précisée')}</p>
  </div>

  ${jalons.length > 0 ? `
  <div class="section">
    <h2>Article ${precontrat?.objectifs ? '5' : '4'} — Jalons et livrables</h2>
    <ol>
      ${jalons.map((j: any, i: number) => `
        <li><strong>${escapeHtml(j.titre)}</strong> — Montant : ${j.montantAlloue?.toLocaleString('fr-FR')} FCFA — Échéance : ${new Date(j.dateEcheance).toLocaleDateString('fr-FR')}${j.description ? `<br/><em>${escapeHtml(j.description)}</em>` : ''}</li>
      `).join('')}
    </ol>
  </div>` : ''}

  ${precontrat?.clauses ? `
  <div class="section">
    <h2>Article ${precontrat?.objectifs ? '6' : '5'} — Clauses particulières</h2>
    <p>${escapeHtml(precontrat.clauses)}</p>
  </div>` : ''}

  <div class="section">
    <h2>Article ${precontrat?.objectifs ? (precontrat?.clauses ? '7' : '6') : (precontrat?.clauses ? '6' : '5')} — Propriété intellectuelle et confidentialité</h2>
    <p>Les livrables réalisés dans le cadre de ce contrat deviennent la propriété du client dès validation finale du jalon concerné. Chaque partie s'engage à conserver la confidentialité des informations échangées durant l'exécution du contrat.</p>
  </div>

  <div class="section">
    <h2>Article ${precontrat?.objectifs ? (precontrat?.clauses ? '8' : '7') : (precontrat?.clauses ? '7' : '6')} — Litiges et résolution</h2>
    <p>En cas de désaccord, les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera soumis à l'arbitrage de l'administrateur de la plateforme. La décision de l'administrateur est souveraine.</p>
  </div>

  <div class="signatures">
    <div class="signature-block">
      <div class="sig-img">
        ${client?.signatureUrl ? `<img src="${client.signatureUrl}" alt="Signature client"/>` : '<span style="color:#999;font-size:11px;">Signature numérique</span>'}
      </div>
      <div class="label">Le Client</div>
      <div class="name">${escapeHtml(client?.prenom || '')} ${escapeHtml(client?.nom || '')}</div>
      <div style="font-size:11px;color:#999;margin-top:5px;">Signé le ${dateSignature}</div>
    </div>
    <div class="signature-block">
      <div class="sig-img">
        ${freelance?.signatureUrl ? `<img src="${freelance.signatureUrl}" alt="Signature freelance"/>` : '<span style="color:#999;font-size:11px;">Signature numérique</span>'}
      </div>
      <div class="label">Le Prestataire</div>
      <div class="name">${escapeHtml(freelance?.prenom || '')} ${escapeHtml(freelance?.nom || '')}</div>
      <div style="font-size:11px;color:#999;margin-top:5px;">Signé le ${dateSignature}</div>
    </div>
  </div>

  <div class="footer">
    <p>Document généré automatiquement par la Plateforme Freelance — Référence : ${contrat.numeroContrat}</p>
    <p>Ce contrat a une valeur légale entre les deux parties et est archivé sur la plateforme.</p>
  </div>

  <script>
    // Auto-open print dialog after a short delay
    setTimeout(() => { /* ne pas imprimer automatiquement */ }, 500);
  </script>
</body>
</html>`
}

function genererHtmlPrecontrat(precontrat: any): string {
  const projet = precontrat.projet || precontrat.proposition?.projet
  const client = projet?.client
  const freelance = precontrat.proposition?.freelance
  const dateCreation = new Date(precontrat.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Précontrat</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: 'Times New Roman', Georgia, serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #1E3A8A; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1E3A8A; font-size: 28px; margin: 0; }
    .pending-banner { background: #fef3c7; padding: 10px; border-radius: 4px; color: #92400e; text-align: center; margin: 20px 0; font-weight: 600; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
    .party { padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
    .party h3 { margin-top: 0; color: #1E3A8A; border-bottom: 2px solid #3B82F6; padding-bottom: 5px; }
    .section { margin: 25px 0; }
    .section h2 { color: #1E3A8A; font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>PRÉCONTRAT DE PRESTATION</h1>
  </div>
  
  <div class="pending-banner">
    ⏳ Statut : ${precontrat.statut === 'en_attente_paiement' ? 'En attente de validation du paiement par l\'administrateur' : precontrat.statut === 'genere' ? 'En attente de validation par le freelance' : precontrat.statut}
  </div>

  <div class="section">
    <p><strong>Référence :</strong> PRECONTRAT-${precontrat.id.substring(0, 8).toUpperCase()}</p>
    <p><strong>Date de création :</strong> ${dateCreation}</p>
    <p><strong>Projet :</strong> ${escapeHtml(projet?.titre || '')}</p>
  </div>

  <div class="parties">
    <div class="party">
      <h3>LE CLIENT</h3>
      <p><strong>${escapeHtml(client?.prenom || '')} ${escapeHtml(client?.nom || '')}</strong></p>
      <p>Email : ${escapeHtml(client?.email || '')}</p>
    </div>
    <div class="party">
      <h3>LE PRESTATAIRE</h3>
      <p><strong>${escapeHtml(freelance?.prenom || '')} ${escapeHtml(freelance?.nom || '')}</strong></p>
      <p>Email : ${escapeHtml(freelance?.email || '')}</p>
    </div>
  </div>

  <div class="section">
    <h2>Objectifs</h2>
    <p>${escapeHtml(precontrat.objectifs || '')}</p>
  </div>

  <div class="section">
    <h2>Montant</h2>
    <p><strong>${precontrat.budgetFinal?.toLocaleString('fr-FR')} FCFA</strong></p>
  </div>

  <div class="section">
    <h2>Période</h2>
    <p>Du ${new Date(precontrat.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(precontrat.dateFin).toLocaleDateString('fr-FR')}</p>
  </div>

  ${precontrat.clauses ? `
  <div class="section">
    <h2>Clauses particulières</h2>
    <p>${escapeHtml(precontrat.clauses)}</p>
  </div>` : ''}
</body>
</html>`
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
