import { AppRoutes, ExternalLinks } from '@/types/links'

// Re-export enums for convenience
export { AppRoutes, ExternalLinks }

// Navigation items for navbar
export const navItems = [
  { href: AppRoutes.HOME, label: 'Home' },
  { href: AppRoutes.AYHBAR, label: 'ayHBAR' },
  { href: AppRoutes.DASHBOARD, label: 'Dashboard' },
  // { href: AppRoutes.ANALYTICS, label: 'Analytics' }, // Disabled
]

// Footer links
export const footerLinks = [
  { href: ExternalLinks.TERMS, label: 'Terms' },
  { href: ExternalLinks.PRIVACY, label: 'Privacy' },
  //{ href: ExternalLinks.GEOBLOCKING, label: 'Geoblocking policy' },
]

// Social links
export const socialLinks = [
  {
    href: ExternalLinks.TWITTER,
    label: 'Twitter',
    icon: 'twitter'
  },
  {
    href: ExternalLinks.DISCORD,
    label: 'Discord',
    icon: 'discord'
  },
]

// Dropdown menu items
export const dropdownMenuItems = [
  { href: AppRoutes.HOME, label: 'Home', external: false },
  { href: AppRoutes.DASHBOARD, label: 'Dashboard', external: false },
  { href: AppRoutes.AYHBAR, label: 'ayHBAR', external: false },
  { href: ExternalLinks.TERMS, label: 'Terms', external: true },
  { href: ExternalLinks.PRIVACY, label: 'Privacy', external: true },
  { href: ExternalLinks.GEOBLOCKING, label: 'Geoblocking', external: true },
  { href: ExternalLinks.DOCS, label: 'Docs', external: true },
]
