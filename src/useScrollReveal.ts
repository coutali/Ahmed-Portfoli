import { useLayoutEffect } from 'react';

/** Reveal each element once, including fresh cards after a project filter changes. */
export default function useScrollReveal(filter: string) {
  useLayoutEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])'));
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reveal = (element: HTMLElement) => {
      element.dataset.revealed = '';
      delete element.dataset.revealPending;
    };

    if (preference.matches || !('IntersectionObserver' in window)) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    elements.forEach(element => {
      element.dataset.revealPending = '';
      observer.observe(element);
    });

    // Keyboard navigation must never leave focused content hidden.
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>('[data-reveal]');
      if (element) {
        reveal(element);
        observer.unobserve(element);
      }
    };
    const onPreference = () => {
      if (preference.matches) {
        elements.forEach(reveal);
        observer.disconnect();
      }
    };
    document.addEventListener('focusin', onFocus);
    preference.addEventListener('change', onPreference);

    return () => {
      observer.disconnect();
      elements.forEach(element => delete element.dataset.revealPending);
      document.removeEventListener('focusin', onFocus);
      preference.removeEventListener('change', onPreference);
    };
  }, [filter]);
}
