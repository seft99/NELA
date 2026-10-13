"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { mainNavigation } from "@/config/navigation";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-nav">
      <button
        className="icon-button"
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open ? (
        <div className="mobile-nav-panel" id="mobile-navigation">
          <nav aria-label="Navegación móvil">
            {mainNavigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
