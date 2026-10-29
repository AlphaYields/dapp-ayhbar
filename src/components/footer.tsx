import Link from 'next/link';
import Image from 'next/image';
import { footerLinks, socialLinks } from '@/lib/routes';
import { ExternalLinks } from '@/types/links';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-in flex">
        <div className="footer-logo flex-1">
          <Image src="/img_line_919_7.png" alt="AlphaYields" width={120} height={28} className="h-[28px] w-auto" />
          <span>AlphaYields</span>
        </div>

        <ul className="footer-links flex flex-1 justify-center">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href={ExternalLinks.DOCS} target="_blank" rel="noopener noreferrer">
              Docs
            </Link>
          </li>
          {socialLinks.map((social) => (
            <li key={social.href}>
              <a href={social.href} target="_blank" rel="noopener noreferrer">
                {social.label}
              </a>
            </li>
          ))}
        </ul>

        <p className="footer-copy flex-1 text-right">© 2026 AlphaYields. All rights reserved.</p>
      </div>
    </footer>
  );
}
