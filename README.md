# SanizOtter

SanizOtter est une application desktop locale qui anonymise un texte avant de l'envoyer a une IA, puis restaure les vraies valeurs quand l'IA renvoie un texte contenant les balises.

L'idee est simple : on colle un texte sensible, SanizOtter remplace les donnees personnelles ou confidentielles par des variables comme `{{PRENOM_1}}`, `{{EMAIL_1}}` ou `{{API_KEY_1}}`, puis on peut donner ce texte anonymise a une IA. Quand l'IA a fini son travail, on recolle sa reponse dans SanizOtter pour remettre les vraies donnees localement.

## Pourquoi ce projet existe

Les assistants IA sont puissants, mais on ne veut pas toujours leur envoyer des noms, emails, numeros, secrets techniques, donnees clients ou informations RGPD. SanizOtter sert de sas local entre le texte original et l'IA.

Objectif : garder le confort du copier-coller, tout en reduisant fortement l'exposition des donnees sensibles.

## Ce qui marche aujourd'hui

- Application Electron + React + TypeScript.
- Interface locale, sans compte et sans backend.
- Mode clair / sombre inspire du design system OtterMorphisme.
- Detection automatique de plusieurs familles de donnees :
  - prenoms et noms probables ;
  - emails ;
  - telephones francais ;
  - SIRET / SIREN ;
  - IBAN ;
  - cartes bancaires probables ;
  - IP, URL, identifiants ;
  - dates ;
  - adresses postales simples ;
  - termes sante / finance configurables dans le code.
- Mode rapide : anonymisation directe.
- Mode revision : les detections restent visibles et modifiables.
- Ajout manuel d'une balise depuis une selection de texte.
- Regles personnalisees exactes ou regex.
- Desanonymisation d'une reponse IA contenant les balises.
- Signalement des balises inconnues.
- Table de correspondance uniquement en session : rien n'est sauvegarde volontairement.
- Tests unitaires du moteur d'anonymisation.
- Configuration pour generer un installateur Windows `.exe`.

## Ce qui ne marche pas encore ou reste imparfait

- La detection automatique n'est pas une garantie juridique RGPD. Elle aide, mais une verification humaine reste necessaire.
- Les noms/prenoms sont detectes par heuristiques et listes simples, donc il peut y avoir des faux positifs et des oublis.
- Les documents PDF, Word, Excel et CSV ne sont pas encore pris en charge : la v1 fonctionne par copier-coller texte.
- La table de correspondance n'est pas persistante : si l'application est fermee ou reinitialisee, les valeurs ne peuvent plus etre restaurees.
- Il n'y a pas encore de chiffrement de projet sauvegarde, car la v1 evite justement de stocker les donnees sensibles.
- L'installateur Windows peut afficher un avertissement SmartScreen tant que l'application n'est pas signee avec un certificat de code signing.

## Workflow utilisateur

1. Coller le texte original dans la zone Source.
2. Cliquer sur `Rapide` ou `Revision`.
3. Copier le texte anonymise.
4. Envoyer ce texte anonymise a l'IA.
5. Coller la reponse IA dans la zone Retour IA.
6. Cliquer sur `Restaurer`.
7. Recuperer le texte final avec les vraies valeurs remises localement.

## Commandes utiles

Installer les dependances :

```powershell
npm install
```

Tester le moteur :

```powershell
npm test
```

Tester en navigateur, sans Electron :

```powershell
npm run web
```

Lancer l'application desktop locale :

```powershell
npm run desktop
```

Lancer le mode developpement Electron :

```powershell
npm run electron:dev
```

Generer l'installateur Windows :

```powershell
npm run dist
```

L'installateur sera genere dans le dossier `release/`.

## Structure du projet

```text
SanizOtter
├─ electron/          # Fenetre desktop Electron
├─ src/               # Interface React et moteur local
├─ tests/             # Tests du moteur d'anonymisation
├─ dist/              # Build web genere
├─ dist-electron/     # Build Electron genere
└─ release/           # Installateur Windows genere
```

## Comment ce projet a ete cree

Ce projet a ete entierement vibe code avec Codex par OpenAI.

Le deroule :

1. On a commence par discuter du besoin : anonymiser un texte avant de l'envoyer a une IA, puis restaurer les vraies donnees apres traitement.
2. On a cree un plan ensemble : format des balises, table de correspondance locale, modes rapide / revision, detection automatique et regles personnalisees.
3. Le design system OtterMorphisme a ete fourni comme direction visuelle : claymorphisme doux, verre liquide, accent menthe, mode jour / nuit.
4. Codex a construit la structure Electron + React + TypeScript.
5. On a corrige les premiers problemes de lancement, les tests, le nom du projet et la preparation GitHub.
6. Le projet evolue par conversation : l'utilisateur donne le cap, Codex propose les commandes PowerShell, implemente, teste et pousse les changements.

C'est donc un prototype vivant, construit en binome humain + IA, avec une intention claire : rendre l'usage de l'IA plus prudent avec les donnees sensibles.

## Licence

Prototype prive pour le moment. A definir avant distribution publique.
