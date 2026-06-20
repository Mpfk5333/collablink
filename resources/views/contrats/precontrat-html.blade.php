<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Précontrat</title>
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
        .pending-banner { 
            background: #fef3c7; 
            padding: 10px; 
            border-radius: 4px; 
            color: #92400e; 
            text-align: center; 
            margin: 20px 0; 
            font-weight: 600; 
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
        .section { margin: 25px 0; }
        .section h2 { 
            color: #1E3A8A; 
            font-size: 18px; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px; 
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
        <h1>PRÉCONTRAT DE PRESTATION</h1>
    </div>
    
    <div class="pending-banner">
        ⏳ Statut : {{ $precontrat->statut === 'en_attente_paiement' ? 'En attente de validation du paiement par l\'administrateur' : ($precontrat->statut === 'en_attente_signature' ? 'En attente de signature par le freelance' : ucfirst($precontrat->statut)) }}
    </div>

    <div class="section">
        <p><strong>Référence :</strong> PRECONTRAT-{{ strtoupper(substr($precontrat->id, 0, 8)) }}</p>
        <p><strong>Date de création :</strong> {{ $precontrat->created_at->format('d/m/Y') }}</p>
        <p><strong>Projet :</strong> {{ $precontrat->projet->titre }}</p>
    </div>

    <div class="parties">
        <div class="party">
            <h3>LE CLIENT</h3>
            <p><strong>{{ $precontrat->projet->client->prenom }} {{ $precontrat->projet->client->nom }}</strong></p>
            <p>Email : {{ $precontrat->projet->client->email }}</p>
        </div>
        <div class="party">
            <h3>LE PRESTATAIRE</h3>
            <p><strong>{{ $precontrat->proposition->freelance->prenom }} {{ $precontrat->proposition->freelance->nom }}</strong></p>
            <p>Email : {{ $precontrat->proposition->freelance->email }}</p>
        </div>
    </div>

    <div class="section">
        <h2>Objectifs</h2>
        <p>{{ $precontrat->objectifs }}</p>
    </div>

    <div class="section">
        <h2>Montant</h2>
        <p><strong>{{ number_format($precontrat->budget_final, 0, ',', ' ') }} FCFA</strong></p>
    </div>

    <div class="section">
        <h2>Période</h2>
        <p>Du {{ \Carbon\Carbon::parse($precontrat->date_debut)->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($precontrat->date_fin)->format('d/m/Y') }}</p>
    </div>

    @if($precontrat->clauses)
    <div class="section">
        <h2>Clauses particulières</h2>
        <p>{{ $precontrat->clauses }}</p>
    </div>
    @endif
</body>
</html>
