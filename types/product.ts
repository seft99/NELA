export type CategorySlug = "skincare" | "accesorios-plata" | "manillas-oro";

export type ProductImage = {
  src: string;
  alt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  shortDescription: string;
  description: string;
  price: number;
  images: ProductImage[];
  featured: boolean;
  available: boolean;
  visible: boolean;
  displayOrder: number;
  isDemo?: boolean;
};

export type Category = {
  slug: CategorySlug;
  name: string;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  tone: "skincare" | "silver" | "gold";
};
