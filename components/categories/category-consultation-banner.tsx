import { WhatsappButton } from "@/components/ui/whatsapp-button";

export function CategoryConsultationBanner() {
  return (
    <section className="category-consultation" aria-labelledby="category-consultation-title">
      <div className="page-shell category-consultation-inner">
        <div className="category-consultation-copy">
          <p className="eyebrow">Asesoría personalizada</p>
          <h2 id="category-consultation-title">¿Quieres conocer más detalles?</h2>
          <p>Conversemos por WhatsApp sobre disponibilidad, variantes y opciones.</p>
        </div>
        <div className="category-consultation-action">
          <WhatsappButton
            label="Escríbenos por WhatsApp"
            className="button button-primary category-consultation-button"
          />
        </div>
      </div>
    </section>
  );
}
