import type { Metadata } from "next";
import Link from "next/link";
import { adminAuthAvailable, adminSignOutPath, getAdminUser } from "@/app/admin-auth";
import { InventoryDashboard } from "@/components/admin/inventory-dashboard";
import { inventoryAdminConfigured, isInventoryAdmin } from "@/lib/inventory/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gestión de Inventario", robots: { index: false, follow: false } };

export default async function InventoryAdminPage() {
  if (!adminAuthAvailable()) {
    return (
      <section className="admin-access-page page-shell" id="contenido" aria-labelledby="admin-access-title">
        <p className="eyebrow">Acceso restringido</p>
        <h1 id="admin-access-title">El panel no está habilitado en este alojamiento.</h1>
        <p>
          La tienda pública puede funcionar aquí, pero el acceso administrativo necesita un
          proveedor de identidad confiable antes de habilitarse en este alojamiento.
        </p>
        <Link className="button button-outline" href="/">Volver al sitio</Link>
      </section>
    );
  }

  const user = await getAdminUser();
  const configured = inventoryAdminConfigured();
  const authorized = user && configured && isInventoryAdmin(user);

  if (!authorized) {
    return (
      <section className="admin-access-page page-shell" id="contenido" aria-labelledby="admin-access-title">
        <p className="eyebrow">Acceso restringido</p>
        <h1 id="admin-access-title">Esta cuenta no administra el inventario.</h1>
        <p>
          {configured
            ? "Inicia sesión mediante Cloudflare Access con la cuenta autorizada de NELA."
            : "El desarrollador debe configurar primero la cuenta autorizada para este panel."}
        </p>
        <div className="admin-access-actions">
          <Link className="button button-outline" href="/">Volver al sitio</Link>
          <a className="text-link" href={adminSignOutPath("/admin/inventario")} target="_top">Cambiar de cuenta</a>
        </div>
      </section>
    );
  }

  return (
    <InventoryDashboard
      ownerName={user.displayName}
      signOutPath={adminSignOutPath("/")}
    />
  );
}
