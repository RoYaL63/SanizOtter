# Anonymotter

Application desktop locale pour anonymiser un texte avant envoi a une IA, puis restaurer les vraies valeurs depuis une reponse contenant des balises.

## Fonctionnalites v1

- Detection locale RGPD large : emails, telephone, SIRET/SIREN, IBAN, carte bancaire, IP, URL, dates, adresses, noms/prenoms probables, identifiants, termes sante/finance.
- Mode Rapide et mode Revision.
- Regles personnalisees exactes ou regex.
- Ajout manuel depuis une selection de texte.
- Balises stables par session, par exemple {{PRENOM_1}} et {{EMAIL_1}}.
- Desanonymisation avec signalement des balises inconnues.
- Aucune persistance de la table de correspondance.

## Lancement

Installe les dependances, puis lance l'app desktop :

```bash
npm install
npm run electron:dev
```

Tests du moteur :

```bash
npm test
```
