export default {
  beforeCreate(event) {
    if (!event.params.data.date) {
      event.params.data.date = new Date().toISOString().split("T")[0];
    }
  },

  async afterCreate(event) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const smtpHost = process.env.SMTP_HOST;
    if (!adminEmail || !smtpHost) return;

    const { result } = event;

    let productTitle = "—";
    try {
      if (result.product?.documentId) {
        const product = await strapi
          .documents("api::product.product")
          .findOne({ documentId: result.product.documentId, fields: ["Title"] });
        if (product?.Title) productTitle = product.Title;
      }
    } catch {
      /* product lookup is best-effort */
    }

    try {
      await strapi.plugin("email").service("email").send({
        to: adminEmail,
        subject: `Новый отзыв на сайте NovTecAs`,
        text: [
          `Новый отзыв на сайте NovTecAs`,
          ``,
          `Автор: ${result.author ?? "—"}`,
          `Дата: ${result.date ?? "—"}`,
          `Товар: ${productTitle}`,
          `Рейтинг: ${result.rating ?? "не указан"}`,
          ``,
          `Текст отзыва:`,
          result.text ?? "",
          ``,
          `Отзыв ожидает модерации (isPublished = false).`,
          `Откройте панель администратора Strapi, чтобы опубликовать или отклонить его.`,
        ].join("\n"),
        html: [
          `<h2>Новый отзыв на сайте NovTecAs</h2>`,
          `<table style="border-collapse:collapse">`,
          `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Автор:</td><td>${result.author ?? "—"}</td></tr>`,
          `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Дата:</td><td>${result.date ?? "—"}</td></tr>`,
          `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Товар:</td><td>${productTitle}</td></tr>`,
          `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Рейтинг:</td><td>${result.rating ? "★".repeat(result.rating) + "☆".repeat(5 - result.rating) : "не указан"}</td></tr>`,
          `</table>`,
          `<h3>Текст отзыва:</h3>`,
          `<blockquote style="margin:8px 0;padding:8px 16px;border-left:3px solid #ccc;background:#f9f9f9">${result.text ?? ""}</blockquote>`,
          `<p style="color:#888;font-size:13px">Отзыв ожидает модерации. Откройте панель администратора Strapi, чтобы опубликовать или отклонить его.</p>`,
        ].join("\n"),
      });
    } catch (err) {
      strapi.log.warn(`Review email notification failed: ${err.message}`);
    }
  },
};
