import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { mainNavigation } from "@/config/navigation";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <MobileMenu />
        <Link href="/" className="brand-lockup" aria-label="NELA Joyería, inicio">
          <Image
            src="/images/branding/nela-logo.png"
            alt="NELA Joyería"
            width={78}
            height={78}
            priority
          />
        </Link>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {mainNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/skincare#catalogo" className="icon-button header-search" aria-label="Buscar productos">
          <Search size={19} />
        </Link>
      </div>
    </header>
  );
}
