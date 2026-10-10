/* Progressive enhancement: stories stay visible until a brief entry animation. */
(() => {
  'use strict';
  if (document.body.dataset.mode !== 'story' ||
      typeof window.IntersectionObserver !== 'function' ||
      typeof window.matchMedia !== 'function') return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;

  const waiting = new Set();
  const entering = new Set();
  let observer;

  function finish(story) {
    story.classList.remove('is-story-entering');
    entering.delete(story);
  }

  function showNow(story) {
    if (!story) return;
    waiting.delete(story);
    if (observer) observer.unobserve(story);
    finish(story);
  }

  function stop() {
    if (observer) observer.disconnect();
    waiting.clear();
    entering.forEach(finish);
  }

  function revealAnchor() {
    try {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id && document.getElementById(id);
      if (target) showNow(target.closest('.story-question'));
    } catch (_) {
      // A malformed fragment must not affect the visible page.
    }
  }

  try {
    observer = new window.IntersectionObserver(entries => {
      for (const entry of entries) {
        const story = entry.target;
        if (!entry.isIntersecting || !waiting.has(story)) continue;
        waiting.delete(story);
        observer.unobserve(story);
        // Threshold zero works even for stories taller than the viewport.
        if (!motion.matches && entry.boundingClientRect.bottom > 0 &&
            !story.contains(document.activeElement)) {
          entering.add(story);
          story.classList.add('is-story-entering');
        }
      }
      if (!waiting.size) observer.disconnect();
    }, { threshold: 0, rootMargin: '0px 0px 24px 0px' });

    for (const story of document.querySelectorAll('.story-question')) {
      // Do not animate initial content or stories above a restored scroll position.
      if (story.getBoundingClientRect().top < window.innerHeight) continue;
      waiting.add(story);
      observer.observe(story);
    }
    revealAnchor();
  } catch (_) {
    stop();
    return;
  }

  document.addEventListener('animationend', event => {
    if (event.animationName === 'story-arrive') finish(event.target);
  });
  document.addEventListener('focusin', event => {
    showNow(event.target.closest('.story-question'));
  });
  window.addEventListener('hashchange', revealAnchor);
  window.addEventListener('beforeprint', stop);
  window.addEventListener('pageshow', event => {
    if (event.persisted) stop();
  });
  const onMotionChange = event => {
    if (event.matches) stop();
  };
  if (motion.addEventListener) motion.addEventListener('change', onMotionChange);
  else if (motion.addListener) motion.addListener(onMotionChange);
})();
