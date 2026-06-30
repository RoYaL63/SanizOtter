<p align="center">
  <img src="public/sanizotter-logo.png" alt="SanizOtter" width="160" />
</p>

<h1 align="center">SanizOtter</h1>

<p align="center">
  <strong>Le sas local entre vos données sensibles et l'IA.</strong><br/>
  Anonymisez un texte avant de l'envoyer à une IA, puis restaurez les vraies valeurs au retour.
</p>

<p align="center">
  <a href="https://github.com/RoYaL63/SanizOtter/releases"><img src="https://img.shields.io/github/v/release/RoYaL63/SanizOtter?label=t%C3%A9l%C3%A9charger&color=2ea043" alt="Dernière version" /></a>
  <a href="https://github.com/RoYaL63/SanizOtter/actions/workflows/ci.yml"><img src="https://github.com/RoYaL63/SanizOtter/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/plateforme-Windows-blue" alt="Windows" />
  <img src="https://img.shields.io/badge/traitement-100%25%20local-mint?color=3ddc97" alt="100% local" />
</p>

---

## En une phrase

Vous collez un texte sensible, SanizOtter remplace les données personnelles ou confidentielles par des variables comme `{{PRENOM_1}}`, `{{EMAIL_1}}` ou `{{API_KEY_1}}`. Vous envoyez ce texte propre à une IA. Quand l'IA renvoie sa réponse, vous la recollez dans SanizOtter et les vraies valeurs reviennent, en local.

## Pourquoi

Les assistants IA sont utiles, mais on ne veut pas toujours leur transmettre des noms, des emails, des numéros, des secrets techniques, des données clients ou des informations couvertes par le RGPD. SanizOtter garde le confort du copier-coller tout en réduisant fortement l'exposition des données sensibles. Aucun compte, aucun serveur, aucun appel réseau : tout se passe dans la fenêtre.

## Comment ça marche

```
  Texte original                SanizOtter                 Texte anonymisé
 ┌───────────────┐          ┌────────────────┐          ┌───────────────────┐
 │ Marie DUPONT  │   ───▶   │  détection +   │   ───▶   │ {{PRENOM_1}}      │
 │ marie@ex.com  │          │  remplacement  │          │ {{NOM_1}}         │
 │ 06 12 34 56   │          │  (table locale)│          │ {{EMAIL_1}} ...   │
 └───────────────┘          └────────────────┘          └─────────┬─────────┘
                                                                   │  envoi à l'IA
        Texte restauré            SanizOtter              Réponse IA avec balises
 ┌───────────────┐          ┌────────────────┐          ┌─────────▼─────────┐
 │ Marie DUPONT  │   ◀───   │  restauration  │   ◀───   │ Bonjour           │
 │ marie@ex.com  │          │ via table local│          │ {{PRENOM_1}} ...  │
 └───────────────┘          └────────────────┘          └───────────────────┘
```

La table de correspondance entre balises et vraies valeurs ne vit que dans la session en cours. Rien n'est sauvegardé sur le disque.

## Fonctionnalités

- **Détection automatique** de plusieurs familles de données : prénoms et noms probables, emails, téléphones français, SIRET / SIREN, IBAN, cartes bancaires, IP, URL, clés API (Stripe, OpenAI, tokens JWT, secrets webhook), dates, adresses postales simples, termes santé et finance.
- **Détection par étiquette** : sur une ligne `Étiquette : valeur` (Numéro de contrat, Device ID, Secret Webhook, Référence interne…), le mot avant les deux-points indique quoi masquer, et SanizOtter masque la valeur entière en choisissant la catégorie d'après l'étiquette.
- **Règles personnalisées**, exactes ou en regex, sauvegardées localement pour vos secrets métier (clés Stripe, codes client, références internes).
- **Balisage manuel** : sélectionnez un passage dans le texte, choisissez sa catégorie, créez la balise.
- **Tableau de vérification** : chaque détection est listée avec sa valeur, sa catégorie, sa source et son état. Vous pouvez corriger une catégorie ou ignorer une détection avant de copier.
- **Restauration** d'une réponse IA contenant les balises, avec signalement des balises inconnues.
- **Mode clair / sombre** inspiré du design system OtterMorphisme.
- **100% local** : pas de compte, pas de backend, pas d'OCR distant, pas d'appel serveur.

## Installation

### Utilisateur

1. Ouvrez la page [Releases](https://github.com/RoYaL63/SanizOtter/releases).
2. Téléchargez le fichier `SanizOtter-Setup-x.y.z.exe`.
3. Lancez l'installateur et suivez les étapes.

> L'installateur n'est pas encore signé. Windows SmartScreen peut afficher un avertissement : choisissez « Informations complémentaires » puis « Exécuter quand même ».

### Développeur

```powershell
npm install      # dépendances
npm test         # tests du moteur d'anonymisation
npm run web      # aperçu navigateur, sans Electron
npm run desktop  # application desktop locale
npm run dist     # génère l'installateur Windows dans release/
```

## Utilisation

1. Collez le texte original dans la zone **Source**.
2. Cliquez sur **Anonymiser le texte**.
3. Copiez le **texte anonymisé**.
4. Envoyez ce texte à l'IA de votre choix.
5. Collez la réponse de l'IA dans la zone **Restaurer**.
6. Cliquez sur **Restaurer** pour récupérer le texte avec les vraies valeurs.

Besoin d'ajuster ? Le tableau **Balises trouvées** permet de changer une catégorie ou d'ignorer une détection, et le bloc **Options avancées** sert à baliser une sélection à la main.

## Limites connues

- La détection automatique aide mais ne constitue pas une garantie juridique RGPD. Une relecture humaine reste nécessaire.
- Les noms et prénoms reposent sur des heuristiques et des listes simples : il peut y avoir des faux positifs et des oublis.
- Les fichiers PDF, Word, Excel et CSV ne sont pas encore pris en charge. La v1 fonctionne par copier-coller de texte.
- La table de correspondance n'est pas persistante. Si l'application est fermée ou réinitialisée, les valeurs ne peuvent plus être restaurées (c'est un choix de conception pour éviter de stocker les données sensibles).
- L'installateur Windows peut déclencher SmartScreen tant qu'il n'est pas signé avec un certificat de code signing.

## Stack technique

Electron, React 19, TypeScript, Vite. Tests avec Vitest. Build de l'installateur Windows avec electron-builder (cible NSIS).

```text
SanizOtter
├─ electron/   # fenêtre desktop Electron (main + preload)
├─ src/        # interface React et moteur d'anonymisation local
├─ tests/      # tests du moteur
└─ .github/    # workflows CI et release
```

## Comment ce projet a été créé

Prototype vibe codé en binôme humain + IA. Le besoin (anonymiser un texte avant l'IA puis restaurer après), le format des balises, la table de correspondance locale, la détection automatique et les règles personnalisées ont été définis au fil de la conversation. La direction visuelle vient du design system OtterMorphisme : claymorphisme doux, verre liquide, accent menthe, mode jour / nuit.

## Licence

Prototype privé pour le moment. Licence à définir avant distribution publique.
