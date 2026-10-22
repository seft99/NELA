import type { Category } from "@/types/product";

export const categories: Category[] = [
  {
    slug: "skincare",
    name: "Skincare",
    eyebrow: "Rituales de cuidado",
    description: "Texturas suaves y detalles pensados para acompañar tus momentos de cuidado personal.",
    image: "/images/editorial/skincare-demo.png",
    imageAlt: "Composición editorial de frascos neutros de skincare",
    tone: "skincare",
  },
  {
    slug: "accesorios-plata",
    name: "Accesorios de Plata Ley 925",
    eyebrow: "Brillo sereno",
    description: "Piezas delicadas y contemporáneas para dar un acento sutil a cada look.",
    image: "/images/editorial/plata-demo.png",
    imageAlt: "Composición de un accesorio de plata ley 925",
    tone: "silver",
  },
  {
    slug: "manillas-oro",
    name: "Manillas de Oro",
    eyebrow: "Calidez luminosa",
    description: "Manillas de líneas refinadas para combinar, regalar y llevar todos los días.",
    image: "/images/editorial/oro-demo.png",
    imageAlt: "Composición editorial de una manilla dorada",
    tone: "gold",
  },
];
