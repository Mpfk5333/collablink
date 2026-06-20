<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrat {{ $contrat->numero_contrat }}</title>
    <style>
        @page { margin: 2cm; }
        body { 
            font-family: 'Times New Roman', Georgia, serif; 
            line-height: 1.6; 
            color: #1a1a1a; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #1E3A8A; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 { color: #1E3A8A; font-size: 28px; margin: 0; }
        .header .subtitle { color: #666; margin-top: 5px; }
        .contract-number { 
            background: #f0f4ff; 
            padding: 10px; 
            text-align: center; 
            font-weight: bold; 
            color: #1E3A8A; 
            margin: 20px 0; 
            border-radius: 4px; 
        }
        .signature-status { 
            background: #d1fae5; 
            padding: 8px 15px; 
            border-radius: 4px; 
            color: #065f46; 
            font-weight: 600; 
            text-align: center; 
            margin: 15px 0; 
        }
        .parties { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 30px 0; 
        }
        .party { 
            padding: 15px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
        }
        .party h3 { 
            margin-top: 0; 
            color: #1E3A8A; 
            border-bottom: 2px solid #3B82F6; 
            padding-bottom: 5px; 
        }
        .party p { margin: 5px 0; font-size: 14px; }
        .section { margin: 25px 0; }
        .section h2 { 
            color: #1E3A8A; 
            font-size: 18px; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px; 
        }
        .section p, .section li { font-size: 14px; }
        .signatures { 
            margin-top: 60px; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
        }
        .signature-block { text-align: center; }
        .signature-block .sig-line { 
            height: 80px; 
            border-bottom: 1px solid #000; 
            margin-bottom: 10px; 
            display: flex; 
            align-items: flex-end; 
            justify-content: center; 
        }
        .signature-block .label { font-size: 13px; color: #666; }
        .signature-block .name { font-weight: bold; margin-top: 5px; }
        .footer { 
            margin-top: 60px; 
            padding-top: 15px; 
            border-top: 1px solid #ddd; 
            font-size: 11px; 
            color: #888; 
            text-align: center; 
        }
        .print-btn { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #1E3A8A; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 14px; 
        }
        .print-btn:hover { background: #1E40AF; }
        @media print {
            body { max-width: none; padding: 0; }
            .print-btn { display: none; }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    
    <div class="header">
        <h1>CONTRAT DE PRESTATION FREELANCE</h1>
        <div class="subtitle">Plateforme Collaborative de Gestion des Projets Freelances</div>
    </div>

    <div class="contract-number">
        CONTRAT N° {{ $contrat->numero_contrat }}
    </div>

    <div class="signature-status">
        ✓ CONTRAT SIGNÉ ET VALIDÉ LE {{ $contrat->created_at->format('d/m/Y') }}
    </div>

    <div class="section">
        <p><strong>Objet du contrat :</strong> {{ $contrat->projet->titre }}</p>
        <p><strong>Date de création :</strong> {{ $contrat->created_at->format('d/m/Y') }}</p>
        <p><strong>Statut :</strong> {{ ucfirst($contrat->statut) }}</p>
    </div>

    <div class="parties">
        <div class="party">
            <h3>LE CLIENT</h3>
            <p><strong>{{ $contrat->client->prenom }} {{ $contrat->client->nom }}</strong></p>
            <p>Email : {{ $contrat->client->email }}</p>
            @if($contrat->client->telephone)
                <p>Téléphone : {{ $contrat->client->telephone }}</p>
            @endif
        </div>
        <div class="party">
            <h3>LE PRESTATAIRE (FREELANCE)</h3>
            <p><strong>{{ $contrat->freelance->prenom }} {{ $contrat->freelance->nom }}</strong></p>
            <p>Email : {{ $contrat->freelance->email }}</p>
            @if($contrat->freelance->telephone)
                <p>Téléphone : {{ $contrat->freelance->telephone }}</p>
            @endif
        </div>
    </div>

    <div class="section">
        <h2>Article 1 — Objet de la prestation</h2>
        <p>Le présent contrat a pour objet la réalisation de la prestation suivante :</p>
        <p><strong>{{ $contrat->projet->titre }}</strong></p>
        <p>{{ $contrat->projet->description }}</p>
    </div>

    @if($contrat->precontrat && $contrat->precontrat->objectifs)
    <div class="section">
        <h2>Article 2 — Objectifs de la prestation</h2>
        <p>{{ $contrat->precontrat->objectifs }}</p>
    </div>
    @endif

    <div class="section">
        <h2>Article {{ $contrat->precontrat && $contrat->precontrat->objectifs ? '3' : '2' }} — Montant et modalités de paiement</h2>
        <p>Le montant total du contrat est fixé à <strong>{{ number_format($contrat->montant_total, 0, ',', ' ') }} FCFA</strong> (Francs CFA).</p>
        <p>Le paiement est mis en séquestre sur la plateforme et sera libéré au fur et à mesure de la validation des jalons par le client.</p>
    </div>

    <div class="signatures">
        <div class="signature-block">
            <div class="sig-line">
                <span style="color:#999;font-size:11px;">Signature numérique</span>
            </div>
            <div class="label">Le Client</div>
            <div class="name">{{ $contrat->client->prenom }} {{ $contrat->client->nom }}</div>
            <div style="font-size:11px;color:#999;margin-top:5px;">Signé le {{ $contrat->created_at->format('d/m/Y') }}</div>
        </div>
        <div class="signature-block">
            <div class="sig-line">
                <span style="color:#999;font-size:11px;">Signature numérique</span>
            </div>
            <div class="label">Le Prestataire</div>
            <div class="name">{{ $contrat->freelance->prenom }} {{ $contrat->freelance->nom }}</div>
            <div style="font-size:11px;color:#999;margin-top:5px;">Signé le {{ $contrat->created_at->format('d/m/Y') }}</div>
        </div>
    </div>

    <div class="footer">
        <p>Document généré automatiquement par la Plateforme Freelance — Référence : {{ $contrat->numero_contrat }}</p>
        <p>Ce contrat a une valeur légale entre les deux parties et est archivé sur la plateforme.</p>
    </div>
</body>
</html>
