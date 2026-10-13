import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "product",
  title: "Producto",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Nombre", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", title: "URL del producto", type: "slug", options: { source: "name", maxLength: 96 }, validation: (rule) => rule.required() }),
    defineField({
      name: "category",
      title: "Categoría",
      type: "string",
      options: {
        list: [
          { title: "Skincare", value: "skincare" },
          { title: "Accesorios de Plata", value: "accesorios-plata" },
          { title: "Manillas de Oro", value: "manillas-oro" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "shortDescription", title: "Descripción corta", type: "text", rows: 2, validation: (rule) => rule.required().max(180) }),
    defineField({ name: "description", title: "Descripción completa", type: "text", rows: 5, validation: (rule) => rule.required() }),
    defineField({ name: "price", title: "Precio en COP", type: "number", validation: (rule) => rule.required().integer().positive() }),
    defineField({
      name: "images",
      title: "Fotografías",
      type: "array",
      of: [defineArrayMember({ type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Texto alternativo", type: "string", validation: (rule) => rule.required() })] })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: "featured", title: "Producto destacado", type: "boolean", initialValue: false }),
    defineField({ name: "available", title: "Disponible", type: "boolean", initialValue: true }),
    defineField({ name: "visible", title: "Visible en el sitio", type: "boolean", initialValue: true }),
    defineField({ name: "displayOrder", title: "Orden de aparición", type: "number", initialValue: 100, validation: (rule) => rule.integer().min(0) }),
  ],
  preview: {
    select: { title: "name", subtitle: "category", media: "images.0" },
  },
});
