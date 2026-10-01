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
bon endroit. À 1,9 Mo, l'outil de décompression de cPanel convient ; o2switch
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

Le workflow `.github/workflows/deploy.yml` construit le site et l'envoie par
rsync à chaque push sur `main`.

### L'obstacle, et comment il est contourné

o2switch n'accepte les connexions SSH que depuis des **IP explicitement
autorisées**, et le compte est limité à **5 exceptions**. Or les runners
GitHub changent d'IP à chaque exécution : un rsync naïf serait bloqué.

Le workflow utilise donc l'API cPanel, que la documentation o2switch prévoit
justement pour ce cas :

1. il relève l'IP publique du runner ;
2. il l'ajoute au pare-feu via `SshWhitelist/add` ;
3. il envoie les fichiers par rsync ;
4. il retire l'exception via `SshWhitelist/remove`.

L'étape 4 porte `if: always()` : elle s'exécute même si le rsync échoue. Sans
cela, les 5 emplacements se rempliraient en quelques déploiements ratés et
plus aucune connexion SSH ne serait possible.

### Les cinq secrets à créer

Dépôt GitHub → **Settings** → **Secrets and variables** → **Actions**.

| Secret | Valeur | Où la trouver |
|---|---|---|
| `O2SWITCH_SERVER` | `xxxxx.o2switch.net` | cPanel, encart *Informations générales* |
| `O2SWITCH_USER` | votre identifiant cPanel | idem |
| `O2SWITCH_API_TOKEN` | le jeton d'API | cPanel → *Sécurité* → **Gérer les jetons d'API** |
| `O2SWITCH_SSH_KEY` | la **clé privée** (contenu complet, avec les lignes `BEGIN`/`END`) | générée ci-dessous |
| `O2SWITCH_DEPLOY_PATH` | `/home/VOTRE_USER/public_html` | cPanel, chemin du répertoire personnel |

Le jeton d'API ne s'affiche **qu'une seule fois** à la création.

### Générer la paire de clés SSH

Sur votre machine :

```bash
ssh-keygen -t ed25519 -C "github-actions-docteurbauwens" -f ~/.ssh/o2switch_deploy -N ""
cat ~/.ssh/o2switch_deploy.pub     # la clé PUBLIQUE
cat ~/.ssh/o2switch_deploy         # la clé PRIVÉE → secret GitHub
```

La **publique** se dépose dans cPanel → **Sécurité** → **Accès SSH** →
*Gérer les clés SSH* → *Importer une clé*, puis il faut l'**autoriser**
(bouton *Manage* → *Authorize*). La **privée** va dans le secret
`O2SWITCH_SSH_KEY` et ne quitte jamais GitHub.

Utilisez une clé dédiée au déploiement, pas votre clé personnelle : elle se
révoque sans conséquence si besoin.

### Les garde-fous du workflow

- **Vérification de la construction** — le job s'arrête si `dist/index.html`,
  `dist/.htaccess` ou le CSS manquent. Sans ce contrôle, un `dist/` vide
  combiné au `--delete` du rsync effacerait le site en production.
- **Exclusions rsync** — `.well-known` (renouvellement des certificats),
  `cgi-bin` et `.htpasswd` sont préservés côté serveur.
- **`concurrency`** — deux déploiements ne peuvent pas se chevaucher.
- **Version des assets automatique** — le `?v=` des liens CSS/JS est remplacé
  par le SHA court du commit. Plus besoin de l'incrémenter à la main, et les
  visiteurs reçoivent toujours la bonne version.
- **Contrôle final** — le job vérifie que le site répond en 200 et que la
  version déployée est bien celle du commit.

### Le premier déploiement

Testez d'abord à la main via **Actions** → *Déploiement o2switch* → **Run
workflow**. Si l'étape « Autoriser cette IP » échoue, c'est en général le
jeton d'API ou le nom du serveur ; si c'est le rsync, la clé publique n'a
probablement pas été *autorisée* dans cPanel (l'importer ne suffit pas).

Pour lister ou vider les exceptions restées ouvertes :

```bash
curl -H "Authorization: cpanel USER:TOKEN" \
  "https://SERVEUR.o2switch.net:2083/execute/SshWhitelist/list"

curl -H "Authorization: cpanel USER:TOKEN" \
  "https://SERVEUR.o2switch.net:2083/execute/SshWhitelist/remove_all"
```

---

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
