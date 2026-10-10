(function () {
  'use strict';
  if (document.body.dataset.mode !== 'story') return;
  const $ = id => document.getElementById(id);
  const header = $('story-header'), slot = $('story-header-slot');
  const nav = $('story-navigation'), progress = header.querySelector('.chapter-progress');
  const modes = header.querySelector('.masthead-right');
  const links = Array.from(nav.querySelectorAll('.chapter-links a'));
  const chapters = links.map(link => ({ link, section: $(link.getAttribute('href').slice(1)) }));
  let pending = false, current = '', docked = false;

  function updateReadingPosition() {
    pending = false;
    const position = slot.getBoundingClientRect();
    // One header changes state. Its original slot prevents the page from jumping.
    // On the return journey, keep the compact bar until the page reaches the top.
    const next = docked ? position.top < 0 : position.bottom <= 0;
    const changed = next !== docked;
    docked = next;
    header.classList.toggle('is-docked', docked);
    nav.hidden = !docked;
    progress.hidden = !docked;
    modes.hidden = docked;
    const height = docked ? header.getBoundingClientRect().height : 0;
    if (docked) document.body.style.setProperty('--chapter-nav-height', Math.ceil(height) + 'px');
    else document.body.style.removeProperty('--chapter-nav-height');

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
      if (docked && strip.scrollWidth > strip.clientWidth && strip.scrollTo) {
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
  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate);
  window.addEventListener('load', queueUpdate);
  window.addEventListener('pageshow', queueUpdate);
  queueUpdate();
})();
