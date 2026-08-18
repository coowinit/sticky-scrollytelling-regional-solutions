(() => {
  const scrolly = document.querySelector('[data-scrolly]');
  if (!scrolly) return;

  const items = [...scrolly.querySelectorAll('[data-story-item]')];
  const stage = scrolly.querySelector('[data-visual-stage]');
  const nav = scrolly.querySelector('[data-story-nav]');
  const pin = scrolly.querySelector('[data-story-pin]');

  if (!items.length || !stage || !nav || !pin) return;

  const visuals = [];
  const navButtons = [];
  let activeIndex = 0;
  let desktopMetrics = {
    pinTop: 70,
    asideOffset: 0
  };

  // Keep editable copy, links and media in HTML. JS only mirrors each media
  // block into the desktop visual stage and builds the navigation by count.
  items.forEach((item, index) => {
    const media = item.querySelector('[data-story-media]');
    const indexLabel = item.querySelector('[data-story-index]');
    const title = item.querySelector('h2')?.textContent?.trim() || `Section ${index + 1}`;

    if (indexLabel) indexLabel.textContent = String(index + 1).padStart(2, '0');

    if (media) {
      const visual = media.cloneNode(true);
      visual.classList.remove('story-item__mobile-media');
      visual.classList.add('story-visual');
      visual.removeAttribute('data-story-media');
      visual.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
      if (index === 0) visual.classList.add('is-active');
      stage.appendChild(visual);
      visuals.push(visual);
    }

    const button = document.createElement('button');
    button.className = 'story-nav__button';
    button.type = 'button';
    button.setAttribute('aria-label', `Go to ${title}`);
    button.setAttribute('aria-current', index === 0 ? 'true' : 'false');
    if (index === 0) button.classList.add('is-active');
    nav.appendChild(button);
    navButtons.push(button);
  });

  function setActive(index, animate = true) {
    if (index < 0 || index >= items.length || (index === activeIndex && animate)) return;
    activeIndex = index;

    items.forEach((item, i) => item.classList.toggle('is-active', i === index));

    visuals.forEach((visual, i) => {
      const isActive = i === index;
      visual.classList.toggle('is-active', isActive);
      visual.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    navButtons.forEach((button, i) => {
      const isActive = i === index;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  // Desktop alignment rule:
  // 1) the first text step and visual are vertically centered on the same line;
  // 2) when that shared center reaches the viewport center, the visual starts pinning.
  function updateDesktopMetrics() {
    if (window.innerWidth <= 900) return desktopMetrics;

    const firstItemHeight = items[0].getBoundingClientRect().height;
    const pinHeight = pin.getBoundingClientRect().height;
    const asideOffset = Math.max(0, Math.round((firstItemHeight - pinHeight) / 2));
    const pinTop = Math.max(28, Math.round((window.innerHeight - pinHeight) / 2));

    desktopMetrics = { pinTop, asideOffset };
    document.documentElement.style.setProperty('--aside-offset', `${asideOffset}px`);
    document.documentElement.style.setProperty('--pin-top', `${pinTop}px`);

    return desktopMetrics;
  }

  function getItemCenterScroll(index) {
    const target = items[index];
    if (!target) return window.scrollY;

    const rect = target.getBoundingClientRect();
    return window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
  }

  function getStickyScrollRange() {
    if (window.innerWidth <= 900) return null;

    updateDesktopMetrics();

    const aside = scrolly.querySelector('.scrolly__aside');
    if (!aside) return null;

    const asideRect = aside.getBoundingClientRect();
    const pinHeight = pin.getBoundingClientRect().height;
    const asideTop = window.scrollY + asideRect.top;

    const start = asideTop + desktopMetrics.asideOffset - desktopMetrics.pinTop;
    const end = asideTop + asideRect.height - pinHeight - desktopMetrics.pinTop;

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    return { start, end };
  }

  function scrollToItem(index) {
    if (!items[index]) return;

    let top = getItemCenterScroll(index);

    // Keep navigation clicks inside the native sticky range. The image stage
    // therefore stays on the exact same vertical line even for item 01 / 04.
    const stickyRange = getStickyScrollRange();
    if (stickyRange) {
      top = Math.min(Math.max(top, stickyRange.start + 2), stickyRange.end - 2);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: Math.max(0, Math.round(top)),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  navButtons.forEach((button, index) => {
    button.addEventListener('click', () => scrollToItem(index));
  });

  function initNativeFallback() {
    document.documentElement.classList.add('no-gsap');

    const update = () => updateDesktopMetrics();
    update();
    window.addEventListener('resize', update, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => (
          Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight / 2)
          - Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight / 2)
        ));

      if (visible[0]) {
        const index = items.indexOf(visible[0].target);
        if (index !== -1) setActive(index);
      }
    }, {
      rootMargin: '-36% 0px -36% 0px',
      threshold: 0
    });

    items.forEach((item) => observer.observe(item));
  }

  function initGsap() {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    mm.add('(min-width: 901px)', () => {
      document.documentElement.classList.remove('no-gsap');

      const refreshMetrics = () => updateDesktopMetrics();
      refreshMetrics();
      ScrollTrigger.addEventListener('refreshInit', refreshMetrics);

      // The visual itself uses native CSS position: sticky. This gives us
      // a hard containment boundary at the bottom of .scrolly__aside, so the
      // final image can never drift into the following section. ScrollTrigger
      // remains responsible only for state changes and restrained text motion.

      const itemTriggers = items.map((item, index) => ScrollTrigger.create({
        trigger: item,
        start: 'top 56%',
        end: 'bottom 44%',
        onEnter: () => setActive(index),
        onEnterBack: () => setActive(index)
      }));

      // Keep the original restrained scroll-linked text treatment.
      const textTweens = items.map((item) => {
        const body = item.querySelector('.story-item__body');
        if (!body) return null;

        return gsap.timeline({
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
            end: 'bottom 12%',
            scrub: .4
          }
        })
          .fromTo(body,
            { opacity: .2, y: 22 },
            { opacity: 1, y: 0, duration: .36, ease: 'none' }
          )
          .to(body,
            { opacity: 1, y: 0, duration: .3, ease: 'none' }
          )
          .to(body,
            { opacity: .2, y: -18, duration: .34, ease: 'none' }
          );
      }).filter(Boolean);

      setActive(0, false);
      ScrollTrigger.refresh();

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', refreshMetrics);
        itemTriggers.forEach((trigger) => trigger.kill());
        textTweens.forEach((tween) => tween.kill());
      };
    });

    mm.add('(max-width: 900px)', () => {
      document.documentElement.style.removeProperty('--aside-offset');
      setActive(0, false);
    });
  }

  // Deferred scripts preserve order. If the CDN is unavailable, the native
  // sticky + IntersectionObserver fallback keeps the component functional.
  if (window.gsap && window.ScrollTrigger) {
    initGsap();
  } else {
    initNativeFallback();
  }
})();
