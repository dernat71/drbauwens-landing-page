# Notes pour Claude

Site du cabinet du **Dr Marie-Sarah Bauwens**, médecine générale à Grand-Reng
(commune d'Erquelinnes, Belgique). En production sur https://docteurbauwens.be

Le propriétaire est l'époux de la praticienne, ingénieur data — technique,
mais ce n'est pas lui qui tient le site au quotidien. Les échanges se font
**en français**.

---

## Avant de toucher à quoi que ce soit

**C'est un site médical en production.** Des patients y cherchent un numéro de
téléphone, des horaires, une date d'absence. Une erreur factuelle y coûte plus
cher qu'une imperfection visuelle.

**Ne jamais inventer une donnée de contact.** Si un numéro, un horaire ou un
nom est incertain, le signaler et demander confirmation plutôt que de combler
le trou.

**Vérifier visuellement, ne pas supposer.** Playwright est installé dans
`.venv`. Les scripts `_scrape/check.py` (débordement horizontal sur cinq
formats) et `_scrape/audit.py` (alt, liens vides, titres, menu mobile) servent
à ça. `_scrape/` est ignoré par Git — recréer les scripts au besoin.

---

## La pile technique

Site **statique**, aucune dépendance à l'exécution. Le serveur ne fait que
renvoyer des fichiers : ni PHP, ni base de données, ni Node.

| Brique | Fichier | Remarque |
|---|---|---|
| HTML | `index.html` | page unique |
| CSS | `assets/css/site.css` | Tailwind v4 **compilé et versionné** |
| JS | `assets/js/site.js` | vanilla, aucune bibliothèque |

Le thème est dans le bloc `@theme` de `src/input.css` : indigo `#190D39`,
sable `#F3DDBB`, lilas `#E0DAE8`, polices Literata (titres) et Public Sans.
Ces valeurs viennent du thème WordPress d'origine (*Mental Care*, cmsmasters),
échantillonnées dans son CSS — ne pas les « améliorer » sans demander.

`npm run build` régénère le CSS. **Toujours recompiler après avoir ajouté des
classes Tailwind**, sinon elles n'existent pas dans le fichier livré.

---

## Déployer

```bash
task doctor       # vérifie outils et identifiants
task deploy       # construit, contrôle, envoie en FTPS, vérifie
task deploy:dry   # simulation, sans rien écrire
```

Le workflow GitHub Actions appelle **exactement les mêmes tâches**. Une seule
implémentation : ne pas en introduire une seconde dans le workflow.

Identifiants : `.env` en local (ignoré par Git), secrets GitHub en CI. Task
ignore un `.env` absent et une variable d'environnement prime sur le fichier.

Hébergeur **o2switch**, serveur `batterie.o2switch.net`. Détails et pièges
dans `DEPLOIEMENT.md`.

### Pourquoi FTPS et non SSH

Le port 22 n'est ouvert qu'aux IP en liste blanche (5 maximum), incompatible
avec des runners GitHub. Le contournement par jeton d'API cPanel est
impraticable : l'interface *Manage API Tokens* est « expérimentale » et
n'affiche aucun formulaire. Le port 21 est libre, FTPS chiffre. **Ne pas
proposer de revenir à SSH sans vérifier que ces conditions ont changé.**

---

## Pièges à connaître

**Le cache.** `.htaccess` marque CSS et JS `immutable` pour un an. Le `?v=` de
leurs URL est remplacé au déploiement par le SHA du commit — ne pas le figer
en dur ni supprimer ce mécanisme.

**En développement**, utiliser `task serve` (ou `python3 serve.py`), pas
`python -m http.server` : ce dernier n'envoie aucun en-tête de cache et Chrome
ressert alors d'anciens fichiers. Plusieurs faux bugs ont eu cette cause.

**Le serveur limite le débit.** Trop de requêtes rapprochées vers
`docteurbauwens.be` déclenchent des **429**, et la page renvoyée n'est plus le
site. Espacer les vérifications, sinon on diagnostique des problèmes
inexistants.

**Le `<h1>` porte le SEO local.** Le surtitre « Médecin généraliste à
Grand-Reng & Erquelinnes » est un `<span>` *à l'intérieur* du `<h1>`, stylé en
surtitre. Visuellement c'est un sous-titre discret, mais c'est ce qui porte le
métier et les localités. **Ne pas sortir ce span du h1.**

**Deux balises `google-site-verification`** dans le `<head>` viennent de
l'ancien site. Les supprimer ferait perdre l'accès à Google Search Console.

**`priceRange` est volontairement absent** du JSON-LD. Le test des résultats
enrichis le signale comme facultatif manquant : c'est **normal et assumé**.
Les honoraires d'un généraliste sont encadrés, pas une fourchette
commerciale, et rien ne justifie d'inventer une valeur. Ne pas « corriger »
cet avertissement.

---

## Les annonces

`<section id="infos">` dans `index.html`. C'est la seule partie qui bouge
souvent : absences, fermetures du laboratoire, inscriptions.

`site.js` construit automatiquement le bandeau d'alerte du haut de page à
partir de ces `<article>` — **source unique, rien à maintenir en double**.
Une annonce portant `data-alerte="non"` n'y remonte pas (réservé aux
informations positives). S'il ne reste aucune annonce à signaler, le bandeau
disparaît de lui-même.

Sous ce bandeau, un **second petit bandeau permanent** « Nouveaux patients »
renvoie vers la carte `#nouveaux-patients` (marquée `data-bandeau="patients"`,
et aussi `data-alerte="non"` pour ne pas remonter deux fois). Résultat : toujours
un bandeau au minimum (patients), deux au maximum quand une annonce est active.
Supprimer cette carte fait disparaître le bandeau permanent.

Avec une seule carte, la grille est `mx-auto mt-12 grid max-w-xl gap-6` ;
avec plusieurs, repasser à `mt-12 grid gap-6 lg:grid-cols-3`.

Coordonnées des remplaçants et modèle HTML prêt à coller : `REMPLACANTS.md`.

---

## Conventions

- **Commits en français**, corps explicatif : ce qui change et *pourquoi*.
  Terminer par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- **Branche puis PR** pour les changements de fond. Le propriétaire demande
  parfois explicitement un push direct sur `main` — dans ce cas seulement.
- Après modification du CSS ou du JS, **recompiler** avant de commiter.
- La CI ne se déclenche que sur les chemins qui affectent le site déployé
  (voir `paths:` dans le workflow) : modifier la documentation ne déploie pas.

---

## Où est quoi

| Fichier | Contenu |
|---|---|
| `README.md` | Pile technique, déploiement, structure, visuels, SEO |
| `DEPLOIEMENT.md` | Bascule depuis WordPress, compte FTP, secrets, dépannage |
| `REMPLACANTS.md` | Médecins remplaçants + modèle d'annonce d'absence |
| `Taskfile.yml` | Toute la logique de déploiement |

---

## En suspens

- `areaServed` du JSON-LD liste Grand-Reng, Erquelinnes, Peissant et Rouveroy.
  À élargir si la patientèle s'étend (Estinnes couvrirait Peissant et
  Rouveroy d'un coup).
- Les polices sont chargées depuis Google Fonts, et la carte Google Maps
  transmet l'IP du visiteur. Aucun cookie n'est déposé (vérifié), mais si la
  question RGPD se pose, il faudrait héberger les polices localement **et**
  revenir à un plan OpenStreetMap.
