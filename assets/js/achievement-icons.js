/**
 * Achievement Icons - Duotone Custom SVG
 * SMP MBS Al Badar Prambanan
 */

const ACHIEVEMENT_ICONS = {
  akademik: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 6L4 16L24 26L44 16L24 6Z" fill="var(--lux-gold)" fill-opacity="0.25"/><path d="M24 6L4 16L24 26L44 16L24 6Z" stroke="var(--color-primary)" stroke-width="2" stroke-linejoin="round"/><path d="M12 20V32C12 32 16 38 24 38C32 38 36 32 36 32V20" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 16V28" stroke="var(--lux-gold)" stroke-width="2" stroke-linecap="round"/><circle cx="44" cy="30" r="2" fill="var(--lux-gold)"/></svg>`,
  olahraga: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 6L24 22L32 6" stroke="var(--color-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="30" r="12" fill="var(--lux-gold)" fill-opacity="0.25"/><circle cx="24" cy="30" r="12" stroke="var(--lux-gold)" stroke-width="2"/><path d="M24 24L26.5 28.5L31.5 29.2L28 32.7L28.8 37.6L24 35.1L19.2 37.6L20 32.7L16.5 29.2L21.5 28.5L24 24Z" fill="var(--color-primary)"/></svg>`,
  seni: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 6L42 14L24 32L16 34L18 26L34 6Z" fill="var(--lux-gold)" fill-opacity="0.25" stroke="var(--color-primary)" stroke-width="2" stroke-linejoin="round"/><path d="M16 34C16 34 10 36 8 42C14 42 18 38 18 38" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  tahfidz: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 12C24 12 18 8 8 8V36C18 36 24 40 24 40C24 40 30 36 40 36V8C30 8 24 12 24 12Z" fill="var(--color-primary)" fill-opacity="0.15" stroke="var(--color-primary)" stroke-width="2" stroke-linejoin="round"/><path d="M24 12V40" stroke="var(--color-primary)" stroke-width="2"/><path d="M13 16H19M13 22H19M29 16H35M29 22H35" stroke="var(--lux-gold)" stroke-width="2" stroke-linecap="round"/></svg>`,
  kepemimpinan: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 5L40 11V22C40 32 33 40 24 43C15 40 8 32 8 22V11L24 5Z" fill="var(--color-secondary)" fill-opacity="0.15" stroke="var(--color-secondary)" stroke-width="2" stroke-linejoin="round"/><path d="M24 16L26.5 21.5L32.5 22.2L28 26.5L29 32.5L24 29.5L19 32.5L20 26.5L15.5 22.2L21.5 21.5L24 16Z" fill="var(--lux-gold)"/></svg>`,
  umum: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="18" r="12" fill="var(--lux-gold)" fill-opacity="0.2" stroke="var(--lux-gold)" stroke-width="2"/><path d="M18 28L14 42L24 36L34 42L30 28" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="var(--color-primary)" fill-opacity="0.1"/><path d="M24 12L25.5 15.5L29.5 16L26.5 18.7L27.3 22.5L24 20.5L20.7 22.5L21.5 18.7L18.5 16L22.5 15.5L24 12Z" fill="var(--color-primary)"/></svg>`
};

if (typeof window !== 'undefined') {
  window.ACHIEVEMENT_ICONS = ACHIEVEMENT_ICONS;
}
