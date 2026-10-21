// Lijn-iconen in Estacia-stijl (stroke = currentColor)
const s = (d) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONS = {
  heart: s('<path d="M24 39s-13-7.6-13-17.2C11 17 14.4 14 18.3 14c2.6 0 4.6 1.4 5.7 3.3C25.1 15.4 27.1 14 29.7 14 33.6 14 37 17 37 21.8 37 31.4 24 39 24 39z"/><circle cx="24" cy="24" r="21" opacity=".35"/>'),
  target: s('<circle cx="24" cy="24" r="19"/><circle cx="24" cy="24" r="12"/><circle cx="24" cy="24" r="5"/><path d="M24 2v6M24 40v6M2 24h6M40 24h6" opacity=".5"/>'),
  spiral: s('<path d="M24 24c0-2 2-3 3.5-2s1.5 4-1 5.5-6 .5-7-3 1.5-8 6-8.5 9.5 2.5 9.5 7.5-4 11-10.5 11S12 30 12.5 23 19 10.5 26 11s14 6.5 13 15"/>'),
  lotus: s('<path d="M24 38c-4-4-6-9-6-14s2-9 6-12c4 3 6 7 6 12s-2 10-6 14z"/><path d="M24 38c-6 0-12-3-15-9 4-1 8 0 11 2"/><path d="M24 38c6 0 12-3 15-9-4-1-8 0-11 2"/><path d="M8 38h32" opacity=".5"/>'),
  hands: s('<path d="M22 40V24l-6-10c-1-2 1-4 3-3l5 7"/><path d="M26 40V24l6-10c1-2-1-4-3-3l-5 7"/><path d="M24 4v4M14 7l2 3M34 7l-2 3" opacity=".6"/>'),
  moon: s('<path d="M30 8a16 16 0 1 0 10 26A14 14 0 0 1 30 8z"/><path d="M36 10l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" opacity=".7"/>'),
  star: s('<path d="M24 6l4 13h13l-10.5 8 4 13L24 32l-10.5 8 4-13L7 19h13z"/>'),
  leaf: s('<path d="M10 38C10 20 22 10 40 8c-2 18-12 30-30 30z"/><path d="M10 38L28 20" opacity=".6"/>'),
  crystal: s('<path d="M24 4l10 12-10 28-10-28z"/><path d="M14 16h20M24 4v40" opacity=".5"/>'),
  sun: s('<circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/>'),
};

export const icon = (name) => ICONS[name] || ICONS.lotus;

export const UI = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm8.4-18.2A11.8 11.8 0 0 0 1.7 17.8L0 24l6.3-1.7a11.8 11.8 0 0 0 5.7 1.4A11.8 11.8 0 0 0 20.4 3.6z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

export const LOTUS_MARK = '<svg class="lotus-mark" viewBox="0 0 64 40" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M32 36c-5-5-7-11-7-17s2-11 7-15c5 4 7 9 7 15s-2 12-7 17z"/><path d="M32 36c-6-1-12-6-14-13 5-1 9 1 12 4"/><path d="M32 36c6-1 12-6 14-13-5-1-9 1-12 4"/><path d="M32 36c-9 1-18-2-24-8 5-2 11-1 15 2"/><path d="M32 36c9 1 18-2 24-8-5-2-11-1-15 2"/><circle cx="32" cy="22" r="1.4" fill="currentColor"/></svg>';
