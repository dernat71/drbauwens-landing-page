#!/usr/bin/env bash
# Prépare le dossier à déployer (dist/) et, par défaut, une archive zip.
#
# Ne contient QUE ce qui doit vivre dans public_html : ni node_modules, ni
# sources Tailwind, ni scripts de développement. Le CSS étant déjà compilé,
# le serveur n'a besoin ni de Node ni de npm.
#
#   bash package.sh              → dist/ + docteurbauwens-site.zip
#   bash package.sh --no-zip     → dist/ seulement (utilisé par la CI)
#
# Variable d'environnement :
#   ASSET_VERSION   remplace le ?v=N des liens CSS/JS (la CI y met le SHA du
#                   commit). Évite d'avoir à incrémenter le numéro à la main.
set -euo pipefail

SORTIE="dist"
ARCHIVE="docteurbauwens-site.zip"
FAIRE_ZIP=1
[[ "${1:-}" == "--no-zip" ]] && FAIRE_ZIP=0

rm -rf "$SORTIE" "$ARCHIVE"
mkdir -p "$SORTIE"

cp -R index.html 404.html favicon.ico robots.txt sitemap.xml \
      site.webmanifest .htaccess assets "$SORTIE/"

if [[ -n "${ASSET_VERSION:-}" ]]; then
  for f in "$SORTIE"/index.html "$SORTIE"/404.html; do
    # -E (ERE) : seule syntaxe d'alternance commune à BSD et GNU sed.
    sed -E "s/(site\.(css|js))\?v=[A-Za-z0-9._-]*/\1?v=${ASSET_VERSION}/g" "$f" > "$f.tmp"
    mv "$f.tmp" "$f"
  done
  echo "  Version des assets : ?v=${ASSET_VERSION}"
fi

if (( FAIRE_ZIP )); then
  # Les fichiers doivent être À LA RACINE de l'archive : le gestionnaire de
  # fichiers cPanel décompresse en place.
  ( cd "$SORTIE" && zip -rq "../$ARCHIVE" . -x '.DS_Store' )
  echo "  Archive : $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"
fi

echo "  dist/ : $(find "$SORTIE" -type f | wc -l | tr -d ' ') fichiers, $(du -sh "$SORTIE" | cut -f1)"
