<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Contrat {{ $contrat->numero_contrat }}</title>
    <style>
        body { font-family: 'Times New Roman', serif; padding: 50px; line-height: 1.6; color: #1a1a1a; }
        h1 { text-align: center; color: #1e40af; margin-bottom: 30px; }
        h2 { color: #1e40af; margin-top: 30px; }
        .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-block { width: 45%; border: 1px solid #ccc; padding: 15px; min-height: 100px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONTRAT DE PRESTATION DE SERVICES</h1>
        <p>Réf : {{ $contrat->numero_contrat }}</p>
        <p>Date : {{ $contrat->created_at->format('d/m/Y') }}</p>
    </div>

    <div class="section">
        <h2>Entre les soussignés</h2>
        <p><strong>Le Client :</strong> {{ $contrat->client->prenom }} {{ $contrat->client->nom }}</p>
        <p>Email : {{ $contrat->client->email }}</p>
        @if($contrat->client->telephone)<p>Tél : {{ $contrat->client->telephone }}</p>@endif
    </div>

    <div class="section">
        <h2>Et</h2>
        <p><strong>Le Freelance :</strong> {{ $contrat->freelance->prenom }} {{ $contrat->freelance->nom }}</p>
        <p>Email : {{ $contrat->freelance->email }}</p>
        @if($contrat->freelance->telephone)<p>Tél : {{ $contrat->freelance->telephone }}</p>@endif
    </div>

    <div class="section">
        <h2>Objet du contrat</h2>
        <p>Le présent contrat porte sur la réalisation du projet intitulé « <strong>{{ $contrat->projet->titre }}</strong> ».</p>
        <p>{{ $contrat->projet->description }}</p>
    </div>

    @if($contrat->precontrat)
    <div class="section">
        <h2>Objectifs</h2>
        <p>{{ $contrat->precontrat->objectifs }}</p>
    </div>

    <div class="section">
        <h2>Durée</h2>
        <p>Du {{ $contrat->precontrat->date_debut->format('d/m/Y') }} au {{ $contrat->precontrat->date_fin->format('d/m/Y') }}.</p>
    </div>

    @if($contrat->precontrat->clauses)
    <div class="section">
        <h2>Clauses particulières</h2>
        <p>{{ $contrat->precontrat->clauses }}</p>
    </div>
    @endif
    @endif

    <div class="section">
        <h2>Rémunération</h2>
        <p>Le montant total du contrat est fixé à <strong>{{ number_format($contrat->montant_total, 0, ',', ' ') }} FCFA</strong>.</p>
        <p>Une commission de 5% est prélevée par la plateforme CollabLink sur ce montant.</p>
    </div>

    <div class="signature">
        <div class="signature-block">
            <p><strong>Signature du Client</strong></p>
            <br><br>
            <p>Date : ___________</p>
        </div>
        <div class="signature-block">
            <p><strong>Signature du Freelance</strong></p>
            <br><br>
            <p>Date : ___________</p>
        </div>
    </div>
</body>
</html>
