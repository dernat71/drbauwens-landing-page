# Site du Docteur Marie-Sarah Bauwens

Site du cabinet de médecine générale de Grand-Reng / Erquelinnes (Belgique).
Remplace l'ancien site WordPress + thème *Mental Care* (cmsmasters), dont il
reprend la charte : couleurs, typographies, logo et photographies.

- **En production** : https://docteurbauwens.be
- **Mise en ligne** : `git push` sur `main` → GitHub Actions → o2switch

---

## Les technologies, en bref

Le site est **entièrement statique** : trois fichiers que le navigateur sait
lire tels quels, sans rien exécuter côté serveur.

| Brique | Rôle | Remarque |
|---|---|---|
| **HTML** | `index.html`, une seule page | Tout le contenu y est écrit en clair |
| **CSS** | `assets/css/site.css` | Généré par Tailwind, **versionné compilé** |
| **JavaScript** | `assets/js/site.js`, ~8 Ko | Vanilla, aucune bibliothèque |

### Pourquoi « statique » change tout

Sur l'ancien site, chaque visite déclenchait PHP, qui interrogeait MySQL, qui
assemblait la page. D'où les mises à jour de sécurité, les sauvegardes de base,
les plugins à surveiller — et la panne qui a motivé cette refonte.

Ici, le serveur se contente de **renvoyer des fichiers**. Conséquences
directes : pas de base de données, pas de PHP, aucune mise à jour de sécurité à
suivre, rien qui puisse « casser » après une montée de version. Le site peut
être hébergé partout, y compris gratuitement.

### Tailwind CSS v4

Plutôt que d'écrire du CSS à la main, on compose les styles avec des classes
utilitaires directement dans le HTML (`flex`, `mt-6`, `rounded-full`…). Tailwind
lit les fichiers, repère les classes employées et génère **uniquement** le CSS
correspondant — d'où un fichier final de ~32 Ko.

Le point important : `assets/css/site.css` est **compilé et versionné dans le
dépôt**. Le serveur ne construit rien. Node n'intervient que sur votre machine
ou sur le runner GitHub.

Les couleurs, polices et rayons sont centralisés dans le bloc `@theme` de
`src/input.css` :

| Rôle | Variable | Valeur |
|---|---|---|
| Titres, pied de page | `--color-ink` | `#190D39` |
| Boutons principaux | `--color-sand` | `#F3DDBB` |
| Accent lilas | `--color-lilac` | `#E0DAE8` |
| Accent bleu | `--color-sky` | `#C7DDF5` |
| Texte courant | `--color-body` | `#67656E` |

### JavaScript : volontairement minimal

Aucun framework. `site.js` fait cinq choses : menu mobile, fond de l'en-tête au
défilement, apparitions au scroll, lien de navigation actif, et génération du
bandeau d'alerte. **La page reste entièrement lisible et utilisable sans JS** —
seuls les enrichissements disparaissent.

### Dépendances au-delà du navigateur

| Outil | Quand | Où |
|---|---|---|
| **Node + npm** | compilation du CSS | votre machine, runner GitHub |
| **Python + uv + Playwright** | vérifications visuelles | votre machine uniquement |
| **Google Fonts** | Literata, Public Sans | chargées par le visiteur |

Ni Node ni Python ne tournent sur le serveur.

---

## Comment le site est déployé

```
  votre machine          GitHub Actions                    o2switch
  ─────────────          ──────────────                    ────────
  git push main  ───►   npm ci                             
                        npm run build   (Tailwind → CSS)
                        package.sh      (→ dist/)
                        ouvre le pare-feu  ──(API cPanel)──►  SshWhitelist/add
                        rsync --delete  ──────(SSH)────────►  public_html/
                        referme le pare-feu ─(API cPanel)──►  SshWhitelist/remove
                        vérifie que le site répond 200
```

Trois particularités valent d'être connues :

**Le pare-feu s'ouvre et se referme.** o2switch n'accepte le SSH que depuis des
IP autorisées, et plafonne à 5 exceptions. Les runners GitHub changeant d'IP à
chaque exécution, le job ajoute la sienne via l'API cPanel puis la retire —
avec `if: always()`, pour que l'emplacement soit libéré même en cas d'échec.

**La version des assets est automatique.** Le `?v=` des liens CSS/JS est
remplacé par le SHA court du commit. Impossible d'oublier de l'incrémenter.

**Un garde-fou précède le `rsync --delete`.** Le job s'arrête si `index.html`,
`.htaccess` ou le CSS manquent dans `dist/` — un dossier vide effacerait le
site en production.

La marche à suivre complète (bascule depuis WordPress, secrets GitHub, clés
SSH) est dans **[DEPLOIEMENT.md](DEPLOIEMENT.md)**.

### Sans la CI

```bash
npm run package     # → docteurbauwens-site.zip
```

L'archive contient exactement ce qui doit vivre dans `public_html`, fichiers à
la racine. Elle se téléverse et se décompresse depuis le gestionnaire de
fichiers cPanel.

---

## 1. Mettre à jour les « Infos du moment »

C'est la seule partie qui bouge régulièrement (absences, fermetures du
laboratoire, inscriptions). Tout est dans `index.html` :

```html
<!-- ═════ INFOS DU MOMENT — 🔧 SECTION À METTRE À JOUR RÉGULIÈREMENT ═════ -->
<section id="infos">
```

- **Modifier** : éditez le texte dans son `<article class="card …">`.
- **Supprimer** : retirez tout le bloc `<article>…</article>`.
- **Ajouter** : copiez un `<article>` existant et adaptez-le. Trois pastilles
  de couleur disponibles : `bg-sand` (sable), `bg-lilac` (lilas), `bg-sky` (bleu).
- **Plus aucune annonce** : supprimez toute la `<section id="infos">`, ainsi que
  les liens « Infos du moment » dans le menu bureau, le menu mobile et le pied
  de page.

Aucune recompilation nécessaire : ces changements ne touchent que le HTML.

### Le bandeau d'alerte en haut de page

Les annonces sont loin sous la ligne de flottaison. `site.js` construit donc
automatiquement un bandeau résumé dans le premier écran, juste au-dessus du
titre.

**Rien à maintenir en double** : il est généré à partir des `<article>` de
`#infos`, en reprenant la pastille de catégorie et le titre de chacun. Modifiez
l'annonce, le bandeau suit.

- Pour qu'une annonce **ne remonte pas** dans le bandeau, ajoutez
  `data-alerte="non"` sur son `<article>`. C'est le cas d'« Inscriptions
  ouvertes », information positive et non alerte.
- S'il ne reste aucune annonce à signaler, le bandeau ne s'affiche pas.

## 2. Modifier le design

```bash
npm install      # une seule fois
npm run dev      # recompile à chaque sauvegarde pendant l'édition
npm run build    # compilation unique, minifiée
```

Recompiler n'est nécessaire que si vous ajoutez de **nouvelles** classes
Tailwind dans le HTML ou le JS.

> **⚠️ Déploiement manuel uniquement** — après toute modification de
> `site.css` ou `site.js`, incrémentez le numéro de version dans `index.html`
> et `404.html` : `site.css?v=16` → `?v=17`.
>
> `.htaccess` demande aux navigateurs de conserver ces fichiers un an
> (`immutable`). Sans changement d'URL, un visiteur déjà venu ne recevrait
> **jamais** la nouvelle version. **La CI s'en charge automatiquement** (elle y
> met le SHA du commit) : ce réflexe ne concerne que les envois à la main.

## 3. Prévisualiser en local

```bash
npm run serve      # http://localhost:8080
```

`serve.py` est un petit serveur qui **désactive explicitement le cache**.
`python -m http.server` n'envoie aucun en-tête de cache, et Chrome ressert
alors d'anciens fichiers sans prévenir — on croit que la modification n'a pas
été prise en compte. Ce serveur évite ce faux problème.

## 4. Structure du dépôt

```
index.html              La page du site (contenu, métadonnées, JSON-LD)
404.html                Page d'erreur
src/input.css           Source Tailwind : thème + composants
assets/css/site.css     CSS compilé — ne pas éditer à la main
assets/js/site.js       Menu mobile, en-tête, apparitions, bandeau d'alerte
assets/img/             Logo, portrait, illustrations, photos, icônes
.htaccess               Configuration Apache (HTTPS, cache, sécurité, redirections)
robots.txt  sitemap.xml  site.webmanifest  favicon.ico

serve.py                Serveur local sans cache
package.sh              Construit dist/ et l'archive de déploiement
package.json            Scripts npm
.github/workflows/
  deploy.yml            Pipeline CI/CD vers o2switch
DEPLOIEMENT.md          Bascule depuis WordPress + configuration de la CI
```

## 5. Visuels

Tous repris de la médiathèque de l'ancien site :

| Fichier | Origine | Emplacement |
|---|---|---|
| `logo.svg` / `logo-light.svg` | Logo noir et blanc d'origine | En-tête / pied de page |
| `consultation-*` | `doctor_patient_illustration_round_corner` | Hero (visuel principal) |
| `ballon.svg` | `home-3-svg-1.svg` (montgolfière) | Au-dessus du manifeste |
| `stethoscope-*` | Photo stéthoscope | Section Consultations |
| `visite-domicile.svg` | `file-1.svg` (médecin en voiture) | Bandeau Visites à domicile |
| `prise-de-sang-*` | Photo prise de sang | Section Prises de sang |
| `portrait-*` | Photo du Dr Bauwens | Section Votre médecin |
| `line-1.svg`, `line-2.svg` | Courbes décoratives du thème | Hero, CTA final |

L'illustration médecin/patient est servie en WebP avec un repli PNG quantifié
en 64 couleurs (33 Ko au lieu de 577 Ko, sans perte visible sur un aplat).
`visite-domicile.svg` a été recoloré du noir pur vers l'indigo de la charte.

## 6. Services externes

| Service | Usage | Où le modifier |
|---|---|---|
| Mobminder | Prise de rendez-vous | 8 liens `booking.mobminder.com` |
| Google Maps | Carte du cabinet | `<iframe src>` de la section `#contact` |
| Google Fonts | Literata, Public Sans | `<link>` dans le `<head>` |

### Le plan

La carte affiche la **fiche Google Maps du cabinet** — celle qui porte le nom,
les avis et l'itinéraire. L'embed fonctionne **sans clé API**.

Elle porte `loading="lazy"` : le navigateur ne la charge qu'à l'approche du
visiteur. Un visiteur qui ne descend jamais jusqu'au contact ne télécharge rien
(page à 144 Ko) ; la carte ajoute ~1,2 Mo uniquement pour ceux qui l'atteignent.

Si la question de la vie privée se posait : l'`<iframe>` transmet l'IP du
visiteur à Google dès son chargement, sans consentement. Elle ne dépose aucun
cookie (vérifié), et la page appelle de toute façon déjà Google Fonts. Pour
supprimer tout contact avec Google, il faudrait héberger les polices localement
**et** revenir à un plan OpenStreetMap.

## 7. Référencement

L'enjeu est le **SEO local** : les patients cherchent « médecin généraliste »
suivi d'un nom de commune.

- **`<h1>`** : le surtitre « Médecin généraliste à Grand-Reng & Erquelinnes »
  est *à l'intérieur* du `<h1>`, avec le style d'un surtitre. Le rendu reste
  celui d'un sous-titre discret, mais Google lit un H1 qui porte le métier et
  les localités. **Ne pas sortir ce `<span>` du `<h1>`.**
- **`<title>` 60 caractères, meta description 149** — calibrés pour ne pas être
  tronqués dans les résultats.
- **Deux blocs JSON-LD** : `MedicalClinic` (adresse, horaires du secrétariat
  *et* des prises de sang, services, zone desservie, `sameAs` vers la fiche
  Google Business Profile) et `FAQPage` (5 questions).
- **`areaServed`** : Grand-Reng, Erquelinnes, Peissant, Rouveroy. À compléter si
  la patientèle s'étend.

> **⚠️ Deux balises `google-site-verification` dans le `<head>`** sont reprises
> de l'ancien site WordPress. Les supprimer ferait perdre l'accès à Google
> Search Console.

À noter : les résultats enrichis FAQ ont été retirés de Google le 7 mai 2026.
Le `FAQPage` reste utile pour la compréhension de la page et pour les citations
dans les moteurs de réponse IA, mais n'attendez pas d'affichage enrichi.

## 8. Accessibilité & performances

- Contenu entièrement lisible et navigable sans JavaScript.
- Navigation au clavier, lien d'évitement, `aria-*` sur les éléments interactifs.
- Animations désactivées si `prefers-reduced-motion` est actif.
- Images en WebP avec repli JPEG/PNG, `srcset` responsive, `loading="lazy"`.
- Vérifié sans débordement horizontal de 360 à 1920 px.
- Page à 144 Ko au chargement initial (hors carte).
