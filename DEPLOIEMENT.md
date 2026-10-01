# Déployer le site sur o2switch

Remplacer l'installation WordPress de `docteurbauwens.be` par cette version
statique, puis automatiser les mises à jour suivantes via GitHub Actions.

- **Étapes 1 à 4** : la bascule initiale, une seule fois (~30 min).
- **Étape 5** : le pipeline CI/CD, à configurer une fois (~20 min). Ensuite,
  un `git push` suffit.

---

## Deux choses qui simplifient beaucoup

**Rien à installer sur le serveur.** Pas de Node, pas de npm, pas de PHP, pas
de base de données. Le CSS Tailwind est compilé avant envoi : o2switch n'a que
des fichiers statiques à servir. Leur propre documentation le confirme —
l'outil Node.js est inutile « si vous n'avez besoin que des exécutables node
et npm », et ici même pas. npm ne tourne que sur votre machine ou sur le
runner GitHub.

**Rien à changer côté domaine.** Vérifié : `docteurbauwens.be` pointe déjà sur
`109.234.167.39` (o2switch, en-tête `PowerBoost-v3`), `www` suit, et WordPress
est installé à la racine de `public_html`. Vous remplacez le contenu d'un
dossier. Aucune modification DNS, donc aucune propagation ni coupure, et le
certificat SSL reste valable.

---

## 1. Avant de commencer

Vous avez choisi de ne pas conserver de sauvegarde de WordPress : l'étape 2
est donc définitive. À noter tout de même qu'o2switch réalise des sauvegardes
automatiques, accessibles dans **JetBackup 5** — elles restent disponibles
quelques jours si un besoin imprévu survenait.

Notez simplement de côté :

- l'URL de réservation : `https://booking.mobminder.com/docteurbauwens/`
- l'accès au compte Google Search Console (les deux balises de vérification de
  l'ancien site sont reprises dans `index.html`, mais gardez l'accès au compte)

## 2. Supprimer WordPress

cPanel → **Logiciel** → **Softaculous Apps Installer** → icône **Toutes les
installations** (en haut à droite) → ligne WordPress → icône **corbeille**.

Cochez les trois options : suppression du répertoire, de la base de données et
de l'utilisateur de la base.

Ouvrez ensuite le **gestionnaire de fichiers** et vérifiez que `public_html`
est réellement vide. Softaculous laisse souvent des restes : `wp-config.php`,
`error_log`, `php.ini`, parfois `wp-content/`.

> ⚠️ Activez l'affichage des fichiers cachés (engrenage en haut à droite →
> *Show hidden files*), sinon vous ne verrez pas l'ancien `.htaccess`. Il
> entrerait en conflit avec le nouveau.

Ne touchez pas aux dossiers situés **en dehors** de `public_html` (`mail`,
`logs`, `ssl`, `etc`…).

## 3. Envoyer le site, la première fois

Sur votre machine :

```bash
npm install        # la première fois seulement
npm run package    # → docteurbauwens-site.zip
```

Puis cPanel → **Gestionnaire de fichiers** → entrer dans `public_html` →
**Envoyer** → déposer l'archive → clic droit dessus → **Extraire** → supprimer
le `.zip`.

Les fichiers sont à la racine de l'archive, ils se placent donc directement au
bon endroit. L'archive est assez petite pour l'outil de décompression de
cPanel ; o2switch
le déconseille seulement pour les gros dossiers.

**Vérifiez que `.htaccess` est bien présent** (fichiers cachés affichés). C'est
lui qui force le HTTPS, redirige `www`, gère le cache et renvoie les anciennes
URL WordPress vers l'accueil.

## 4. Vérifier

En **navigation privée** :

- [ ] `https://docteurbauwens.be` affiche le nouveau site
- [ ] `http://…` bascule en `https://`, et `www.…` redirige sans `www`
- [ ] Cadenas HTTPS valide
- [ ] Le bandeau « Infos du moment » apparaît, la carte Google Maps se charge
- [ ] « Prendre rendez-vous » ouvre Mobminder
- [ ] Affichage correct sur téléphone
- [ ] `/wp-admin/` renvoie vers l'accueil, `/page-inexistante` affiche la 404
- [ ] `/sitemap.xml` répond

Puis dans **Google Search Console** : vérifier que la propriété est toujours
validée, soumettre `https://docteurbauwens.be/sitemap.xml`, demander une
réindexation de l'accueil.

Le certificat SSL est déjà en place et se renouvelle seul (AutoSSL /
Let's Encrypt). Pour le confirmer : cPanel → **Sécurité** → **Let's Encrypt SSL**.

---

## 5. Automatiser avec GitHub Actions

Le workflow `.github/workflows/deploy.yml` construit le site et l'envoie en
**FTPS** à chaque push sur `main`.

### Pourquoi FTPS et non SSH

Le premier pipeline passait par rsync over SSH. Deux obstacles l'ont écarté :

1. **Le port 22 n'est ouvert qu'aux IP en liste blanche** (5 au maximum),
   alors que les runners GitHub changent d'IP à chaque exécution.
2. Contourner cela demandait un **jeton d'API cPanel** — mais l'interface
   *Manage API Tokens* est marquée « expérimentale » et n'affiche aucun
   formulaire sur ce serveur.

Test de connectivité depuis l'extérieur :

```
port 21   (FTP)     ouvert     ← aucune restriction d'IP
port 22   (SSH)     filtré
port 2083 (cPanel)  ouvert
```

Le port 21 étant libre et FTPS chiffrant la connexion, cette voie supprime
d'un coup le jeton d'API, la clé SSH et la gymnastique d'ouverture de
pare-feu. Le pipeline passe de 11 à 6 étapes.

### Les quatre secrets à créer

Dépôt GitHub → **Settings** → **Environments** → `production` → *Add secret*.

| Secret | Valeur | Où la trouver |
|---|---|---|
| `O2SWITCH_FTP_SERVER` | `batterie.o2switch.net` | barre d'adresse du cPanel |
| `O2SWITCH_FTP_USER` | l'utilisateur du compte FTP | cPanel → **Comptes FTP** |
| `O2SWITCH_FTP_PASSWORD` | son mot de passe | défini à la création du compte |
| `O2SWITCH_FTP_DIR` | `/public_html/` (**avec** le slash final) | — |

### Créer un compte FTP dédié

cPanel → chercher « FTP » → **Comptes FTP** → *Ajouter un compte FTP*.

- **Répertoire** : `public_html` — le compte ne verra que le site, rien d'autre
  du serveur.
- **Quota** : illimité.

Mieux vaut un compte dédié que votre compte principal : son mot de passe vit
dans GitHub, et il se révoque sans conséquence sur le reste de l'hébergement.

Le `server-dir` dépend du répertoire racine donné au compte FTP :

- compte limité à `public_html` → `O2SWITCH_FTP_DIR` = `/`
- compte sur tout le répertoire personnel → `O2SWITCH_FTP_DIR` = `/public_html/`

Dans le doute, lancez le workflow une première fois : les journaux affichent
le chemin atteint.

### Les garde-fous

- **Vérification de la construction** — le job s'arrête si `dist/index.html`,
  `dist/.htaccess` ou le CSS manquent.
- **Transfert incrémental** — un fichier d'état `.github-deploy-state.json`
  reste sur le serveur ; seuls les fichiers modifiés remontent.
- **Exclusions** — `.well-known` (renouvellement des certificats), `cgi-bin`
  et `.htpasswd` sont préservés.
- **`concurrency`** — deux déploiements ne peuvent pas se chevaucher.
- **Version des assets automatique** — le `?v=` est remplacé par le SHA court
  du commit. Plus besoin de l'incrémenter à la main.
- **Contrôle final** — le job vérifie que le site répond 200 et que la version
  en ligne est bien celle du commit.

> Le workflow n'efface rien par défaut : `dangerous-clean-slate` n'est pas
> activé. Les fichiers WordPress résiduels ne disparaîtront donc pas tout
> seuls — d'où l'étape 2, à faire avant.

### Le premier déploiement

Lancez-le à la main : **Actions** → *Déploiement o2switch* → **Run workflow**.
Vous voyez alors chaque étape passer.

En cas d'échec à l'envoi, l'erreur vient presque toujours du couple
identifiants / `server-dir`. Pour tester vos identifiants FTP sans la CI :

```bash
curl -v --ftp-ssl --user "UTILISATEUR:MOTDEPASSE" \
  ftp://batterie.o2switch.net/ --list-only
```

### Si vous préférez revenir à SSH

La voie reste ouverte si o2switch corrige son interface de jetons d'API, ou si
le support vous en génère un. Il faudrait alors rétablir les étapes
`SshWhitelist/add` et `SshWhitelist/remove` autour du rsync — avec
`if: always()` sur la fermeture, sous peine de saturer les 5 emplacements.

## Mettre à jour le site, ensuite

Modifier `index.html` (par exemple une annonce dans « Infos du moment »),
commiter, pousser sur `main`. Le reste est automatique.

Sans le pipeline, on peut toujours renvoyer `index.html` seul dans
`public_html` via le gestionnaire de fichiers. Dans ce cas, si vous avez
touché au CSS ou au JS, pensez à incrémenter le `?v=` à la main (voir README,
section 2) — c'est précisément ce que la CI automatise.

---

## Sources

- [Documentation o2switch](https://faq.o2switch.fr/)
- [Softaculous, l'installateur d'applications](https://faq.o2switch.fr/cpanel/outils/installateur-softaculous/)
- [Gestionnaire de fichiers](https://faq.o2switch.fr/hebergement-mutualise/tutoriels-cpanel/gestionnaire-fichier)
- [Différence entre public_html et www](https://faq.o2switch.fr/hebergement-mutualise/tutoriels-cpanel/difference-publichtml-www)
- [Création d'un jeton d'API et son utilisation](https://faq.o2switch.fr/cpanel/securite/token-api-cpanel/)
- [Autorisation SSH — liste blanche pare-feu](https://faq.o2switch.fr/cpanel/outils/exception-parefeu/)
- [Se connecter en SSH à un hébergement o2switch](https://faq.o2switch.fr/guides/webmastering/connexion-ssh/)
- [Git Version Control](https://faq.o2switch.fr/cpanel/fichiers/gitweb/)
- [Hébergement Node.js multi-version](https://faq.o2switch.fr/cpanel/logiciels/hebergement-nodejs-multi-version/)
- [Restaurer une sauvegarde avec JetBackup](https://faq.o2switch.fr/cpanel/fichiers/sauvegarde-jetbackup/)
- [Let's Encrypt, certificat SSL gratuit](https://faq.o2switch.fr/cpanel/securite/lets-encrypt-ssl-gratuit/)
