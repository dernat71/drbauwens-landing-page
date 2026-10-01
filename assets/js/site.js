/* Site du Dr Marie-Sarah Bauwens — interactions.
   Vanilla JS, aucune dépendance. Le site reste entièrement
   lisible et navigable si ce fichier ne se charge pas. */
(() => {
  'use strict';

  /* ---------- Menu mobile ---------- */
  const btn   = document.getElementById('menu-btn');
  const menu  = document.getElementById('menu-mobile');
  const open  = document.getElementById('icon-open');
  const close = document.getElementById('icon-close');

  const setMenu = (isOpen) => {
    menu.classList.toggle('hidden', !isOpen);
    open.classList.toggle('hidden', isOpen);
    close.classList.toggle('hidden', !isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.querySelector('.sr-only').textContent = isOpen ? 'Fermer le menu' : 'Ouvrir le menu';
  };

  if (btn && menu) {
    btn.addEventListener('click', () => setMenu(menu.classList.contains('hidden')));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) { setMenu(false); btn.focus(); }
    });
    // Le menu mobile n'a plus lieu d'être une fois passé en affichage bureau.
    matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---------- Barre d'en-tête : fond au scroll ---------- */
  const bar = document.getElementById('header-bar');
  const SOLID = ['bg-white/85', 'backdrop-blur-xl', 'shadow-[0_10px_40px_-24px_rgba(25,13,57,.55)]'];

  const syncHeader = () => {
    if (!bar) return;
    bar.classList.toggle('mt-2', window.scrollY <= 12);
    SOLID.forEach((c) => bar.classList.toggle(c, window.scrollY > 12));
  };
  syncHeader();
  addEventListener('scroll', syncHeader, { passive: true });

  /* ---------- Apparition au scroll ---------- */
  const targets = document.querySelectorAll('.reveal');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
  }

  /* ---------- Lien de navigation actif ---------- */
  const sections = [...document.querySelectorAll('main section[id]')];
  const links = new Map(
    [...document.querySelectorAll('header nav a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a])
  );

  if (sections.length && links.size && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = links.get(entry.target.id);
        if (!link) return;
        link.classList.toggle('bg-ink/5', entry.isIntersecting);
        link.classList.toggle('text-ink', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Bandeau d'alerte en haut de page ----------
     Les annonces de « Infos du moment » sont loin sous la ligne de flottaison :
     on en construit un résumé cliquable dès le premier écran. La source reste
     unique — les <article> de #infos — donc rien à maintenir en double.
     Chaque pastille reprend la couleur de la catégorie de sa carte.
     Pour qu'une annonce ne remonte pas ici, lui ajouter data-alerte="non". */
  const zone = document.getElementById('alerte');
  const annonces = [...document.querySelectorAll('#infos article')]
    .filter((a) => a.dataset.alerte !== 'non');

  if (zone && annonces.length) {
    const TEINTES = ['bg-sand', 'bg-lilac', 'bg-sky'];

    const lien = document.createElement('a');
    lien.href = '#infos';
    lien.className =
      'group mb-9 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[1.375rem] ' +
      'border border-ink/10 bg-white/85 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4 ' +
      'shadow-[0_18px_44px_-30px_rgba(25,13,57,.55)] transition ' +
      'hover:-translate-y-0.5 hover:border-ink/20 hover:bg-white ' +
      'hover:shadow-[0_22px_50px_-28px_rgba(25,13,57,.6)]';

    // En-tête : pictogramme, intitulé, flèche
    const tete = document.createElement('div');
    tete.className = 'flex flex-1 items-center gap-2.5 lg:flex-none';
    tete.innerHTML =
      '<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand text-ink" aria-hidden="true">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
        'stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/>' +
        '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>' +
      '</span>' +
      '<p class="eyebrow !text-[.7rem]">Infos du moment</p>' +
      '<span class="ml-auto flex shrink-0 items-center gap-2 lg:hidden">' +
        '<span class="hidden text-xs font-medium text-muted transition group-hover:text-ink sm:inline">' +
          'En savoir plus</span>' +
        '<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/[.06] text-ink ' +
          'transition group-hover:bg-ink group-hover:text-white" aria-hidden="true">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
          'stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>' +
        '</span>' +
      '</span>';
    lien.append(tete);

    // Une pastille par annonce, dans la couleur de sa catégorie
    const liste = document.createElement('div');
    liste.className = 'flex w-full flex-wrap gap-2 lg:w-auto lg:flex-1';

    annonces.forEach((a, i) => {
      const badge = a.querySelector('span');
      const teinte = TEINTES.find((c) => badge?.classList.contains(c)) ?? TEINTES[i % TEINTES.length];
      const categorie = badge?.textContent.trim() ?? '';
      const titre = a.querySelector('h3')?.textContent.trim() ?? '';

      const pastille = document.createElement('span');
      pastille.className =
        `inline-flex items-baseline gap-1.5 rounded-full ${teinte} px-3.5 py-1.5 text-[.8125rem] leading-snug text-ink`;

      if (categorie) {
        const fort = document.createElement('strong');
        fort.className = 'font-bold';
        fort.textContent = categorie;
        pastille.append(fort);
      }
      const texte = document.createElement('span');
      texte.className = 'font-medium';
      texte.textContent = titre;
      pastille.append(texte);

      liste.append(pastille);
    });

    lien.append(liste);

    const fin = document.createElement('span');
    fin.className = 'ml-auto hidden shrink-0 items-center gap-2.5 lg:flex';
    fin.innerHTML =
      '<span class="text-xs font-medium text-muted transition group-hover:text-ink">' +
        'Cliquez pour en savoir plus</span>' +
      '<span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/[.06] text-ink ' +
        'transition group-hover:bg-ink group-hover:text-white" aria-hidden="true">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>' +
      '</span>';
    lien.append(fin);

    // Énoncé complet pour les lecteurs d'écran
    lien.setAttribute('aria-label',
      'Infos du moment : ' +
      annonces.map((a) => {
        const c = a.querySelector('span')?.textContent.trim() ?? '';
        const t = a.querySelector('h3')?.textContent.trim() ?? '';
        return c ? `${c}, ${t}` : t;
      }).join(' ; ') + '. Voir le détail.');

    zone.append(lien);
  }

  /* ---------- Année courante ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
