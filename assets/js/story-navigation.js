(function () {
  'use strict';
  if (document.body.dataset.mode !== 'story') return;
  const $ = id => document.getElementById(id);
  const header = $('story-header'), nav = $('story-navigation');
  const progress = header.querySelector('.chapter-progress');
  const modes = header.querySelector('.masthead-right');
  const links = Array.from(nav.querySelectorAll('.chapter-links a'));
  const chapters = links.map(link => ({ link, section: $(link.getAttribute('href').slice(1)) }));
  let pending = false, current = '', compact = false;

  function available(element, visible) {
    element.toggleAttribute('inert', !visible);
    element.setAttribute('aria-hidden', String(!visible));
  }

  function updateReadingPosition() {
    pending = false;
    const scrolled = Math.max(0, window.scrollY || window.pageYOffset || 0);
    // Separate enter/return thresholds avoid flickering during small scroll reversals.
    const next = compact ? scrolled > 24 : scrolled >= 72;
    const changed = next !== compact;
    if (changed) {
      const outgoing = next ? modes : nav;
      if (document.activeElement && outgoing.contains(document.activeElement)) {
        header.querySelector('.brand-home').focus({ preventScroll: true });
      }
    }
    compact = next;
    header.classList.toggle('is-compact', compact);
    available(nav, compact);
    available(modes, !compact);
    // The real masthead keeps the same height and alignment in both states.
    const height = header.getBoundingClientRect().height;
    document.body.style.setProperty('--chapter-nav-height', Math.ceil(height) + 'px');

    let active = chapters[0];
    chapters.forEach(item => {
      if (item.section.getBoundingClientRect().top <= height + 34) active = item;
    });
    if (active.section.id !== current || changed) {
      current = active.section.id;
      links.forEach(link => {
        if (link === active.link) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      $('reading-chapter').textContent = active.link.textContent.replace(/^\d+\s*/, '');
      const strip = nav.querySelector('.chapter-links');
      if (compact && strip.scrollWidth > strip.clientWidth && strip.scrollTo) {
        strip.scrollTo({ left: Math.max(0, active.link.offsetLeft - strip.offsetLeft -
          (strip.clientWidth - active.link.offsetWidth) / 2), behavior: 'auto' });
      }
    }
    const first = chapters[0].section.getBoundingClientRect().top;
    const last = chapters[chapters.length - 1].section.getBoundingClientRect().bottom;
    const distance = last - first - window.innerHeight + height;
    const fraction = distance > 0 ? Math.min(1, Math.max(0, (height - first) / distance)) : 0;
    $('reading-progress').style.width = (fraction * 100).toFixed(2) + '%';
  }

  function queueUpdate() {
    if (!pending) {
      pending = true;
      window.requestAnimationFrame(updateReadingPosition);
    }
  }
  // Hidden is the no-script fallback; CSS and inert handle the enhanced fades.
  available(nav, false);
  header.classList.add('is-enhanced');
  nav.hidden = false;
  modes.hidden = false;
  progress.hidden = false;
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
  window.addEventListener('load', queueUpdate);
  window.addEventListener('pageshow', queueUpdate);
  updateReadingPosition();
})();
