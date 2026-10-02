# Médecins remplaçants

Coordonnées des confrères qui acceptent habituellement de remplacer le
Dr Bauwens. Conservées ici pour n'avoir qu'à les reprendre lors des prochains
congés, plutôt qu'à les rechercher.

Ce fichier n'est **pas** publié : il ne sert qu'à préparer les annonces.

---

## Les coordonnées

| Médecin | Téléphone | Format `tel:` |
|---|---|---|
| Dr Stamatakis Marie | +32 470 70 27 22 | `+32470702722` |
| Dr Houba Aline | +32 491 93 58 04 | `+32491935804` |
| Dr Lismonde Mathilde | +32 483 01 09 21 | `+32483010921` |
| Dr De Ganseman Sophie | +32 64 44 98 88 | `+3264449888` |
| Dr Flabat Olivier | +32 472 35 87 88 | `+32472358788` |
| Dr Dupont David | +32 71 59 87 47 | `+3271598747` |
| Dr Mairesse Timothée | +32 494 68 70 57 | `+32494687057` |
| Dr De Zutter Mathilde | +32 493 20 26 36 | `+32493202636` |
| Dr Papleux Jessica | +32 470 92 39 11 | `+32470923911` |

---

## Réutiliser lors d'une prochaine absence

Dans `index.html`, à l'intérieur de `<section id="infos">`, ajouter un
`<article>` sur le modèle de l'annonce « Inscriptions ouvertes » déjà
présente, puis y coller la liste ci-dessous.

Ne pas mettre `data-alerte="non"` : une absence **doit** remonter dans le
bandeau d'alerte en haut de page.

```html
<article class="reveal card flex flex-col p-7 sm:p-8">
  <span class="inline-flex w-fit items-center gap-2 rounded-full bg-sand px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-ink">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    Absence
  </span>
  <h3 class="mt-5 text-2xl">Du JJ au JJ MOIS</h3>
  <p class="mt-3 text-body">
    Le Dr&nbsp;Bauwens sera absente du <strong class="font-semibold text-ink">JJ</strong> au
    <strong class="font-semibold text-ink">JJ MOIS</strong>. Voici la liste de ses remplaçants&nbsp;:
  </p>
  <ul class="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
    <li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span class="font-medium text-ink">Dr Stamatakis Marie</span>
      <a href="tel:+32470702722" class="tabular-nums text-body transition hover:text-ink">+32 470 70 27 22</a>
    </li>
    <li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span class="font-medium text-ink">Dr Houba Aline</span>
      <a href="tel:+32491935804" class="tabular-nums text-body transition hover:text-ink">+32 491 93 58 04</a>
    </li>
    <li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span class="font-medium text-ink">Dr Lismonde Mathilde</span>
      <a href="tel:+32483010921" class="tabular-nums text-body transition hover:text-ink">+32 483 01 09 21</a>
    </li>
    <li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span class="font-medium text-ink">Dr De Ganseman Sophie</span>
      <a href="tel:+3264449888" class="tabular-nums text-body transition hover:text-ink">+32 64 44 98 88</a>
    </li>
    <li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span class="font-medium text-ink">Dr Flabat Olivier</span>
      <a href="tel:+32472358788" class="tabular-nums text-body transition hover:text-ink">+32 472 35 87 88</a>
    </li>
    <li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span class="font-medium text-ink">Dr Dupont David</span>
      <a href="tel:+3271598747" class="tabular-nums text-body transition hover:text-ink">+32 71 59 87 47</a>
    </li>
    <li class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <span class="font-medium text-ink">Dr Mairesse Timothée</span>
      <a href="tel:+32494687057" class="tabular-nums text-body transition hover:text-ink">+32 494 68 70 57</a>
    </li>
  </ul>
</article>
```

### Pensez à

- Vérifier que chaque confrère est **disponible** sur la période.
- Repasser la grille de `#infos` en plusieurs colonnes si vous ajoutez
  plusieurs annonces :
  `class="mx-auto mt-12 grid max-w-xl gap-6"` → `class="mt-12 grid gap-6 lg:grid-cols-3"`
- Retirer l'annonce une fois l'absence passée.

---

## Autres annonces déjà rédigées

Les annonces supprimées restent consultables dans l'historique Git — utile
pour reprendre une formulation :

```bash
git log --oneline -- index.html
git show <commit>:index.html | sed -n '/id="infos"/,/MANIFESTE/p'
```

Le commit `ec5f998` contient la dernière version avec les trois annonces
(absence, fermeture du laboratoire, inscriptions ouvertes).
