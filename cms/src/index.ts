import fs from "fs";
import path from "path";

const SEED_IMAGES_DIR = path.join(process.cwd(), "seeds", "images");
const SEED_DOCUMENTS_DIR = path.join(process.cwd(), "seeds", "documents");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function textToRichText(value?: string): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return "";
  const escaped = trimmed
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<p>${escaped.replaceAll("\n", "<br/>")}</p>`;
}

/** Загружает один файл из src/seeds/images/ в Strapi Media Library.
 *  Если файл не найден — возвращает null (поле остаётся пустым). */
async function uploadSeedFile(
  strapi: any,
  fileName: string,
  altText: string
): Promise<number | null> {
  const result = await uploadSeedFileWithMeta(strapi, fileName, altText);
  return result?.id ?? null;
}

async function uploadSeedFileWithMeta(
  strapi: any,
  fileName: string,
  altText: string
): Promise<{ id: number; url: string } | null> {
  const filePath = path.join(SEED_IMAGES_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;

  try {
    const stat = fs.statSync(filePath);
    const mimeType = MIME_TYPES[path.extname(fileName).toLowerCase()] ?? "image/jpeg";
    const uploadService = strapi.plugin("upload").service("upload");
    const [file] = await uploadService.upload({
      data: { fileInfo: { name: fileName, alternativeText: altText, caption: altText } },
      files: { filepath: filePath, originalFilename: fileName, mimetype: mimeType, size: stat.size },
    });
    return file ? { id: file.id, url: file.url } : null;
  } catch (err) {
    strapi.log.warn(`Seed: ошибка загрузки "${fileName}": ${err.message}`);
    return null;
  }
}

async function uploadSeedDocument(
  strapi: any,
  fileName: string,
  altText: string
): Promise<{ id: number; url: string } | null> {
  const filePath = path.join(SEED_DOCUMENTS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;

  try {
    const stat = fs.statSync(filePath);
    const mimeType = MIME_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
    const uploadService = strapi.plugin("upload").service("upload");
    const [file] = await uploadService.upload({
      data: { fileInfo: { name: fileName, alternativeText: altText, caption: altText } },
      files: { filepath: filePath, originalFilename: fileName, mimetype: mimeType, size: stat.size },
    });
    return file ? { id: file.id, url: file.url } : null;
  } catch (err) {
    strapi.log.warn(`Seed: ошибка загрузки документа "${fileName}": ${err.message}`);
    return null;
  }
}

/** Загружает несколько файлов галереи и возвращает массив их ID. */
async function uploadSeedGallery(
  strapi: any,
  fileNames: string[],
  altText: string
): Promise<number[]> {
  const ids: number[] = [];
  for (const fileName of fileNames) {
    const id = await uploadSeedFile(strapi, fileName, altText);
    if (id !== null) ids.push(id);
  }
  return ids;
}

async function ensurePublicPermissions(strapi) {
  const publicRole = await strapi.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "public" } });

  if (!publicRole) {
    strapi.log.warn("Public role not found, skipping permissions setup.");
    return;
  }

  const readActions = [
    "api::product.product.find",
    "api::product.product.findOne",
    "api::product-category.product-category.find",
    "api::product-category.product-category.findOne",
    "api::dealer.dealer.find",
    "api::dealer.dealer.findOne",
    "api::portfolio-item.portfolio-item.find",
    "api::portfolio-item.portfolio-item.findOne",
    "api::media-item.media-item.find",
    "api::media-item.media-item.findOne",
    "api::document.document.find",
    "api::document.document.findOne",
    "api::page.page.find",
    "api::page.page.findOne",
    "api::partner.partner.find",
    "api::partner.partner.findOne",
    "api::review.review.find",
    "api::review.review.findOne",
    "api::site-setting.site-setting.find",
    "api::home-page.home-page.find",
    "api::page-about.page-about.find",
    "api::page-production.page-production.find",
    "api::page-technology.page-technology.find",
    "api::page-hydrophobic.page-hydrophobic.find",
    "api::page-blacklist.page-blacklist.find",
    "api::page-contacts.page-contacts.find",
    "api::page-dealers.page-dealers.find",
    "api::city.city.find",
    "api::city.city.findOne",
    "api::lead.lead.create",
  ];

  for (const action of readActions) {
    const existing = await strapi.db
      .query("plugin::users-permissions.permission")
      .findOne({ where: { action, role: publicRole.id } });

    if (!existing) {
      await strapi.db
        .query("plugin::users-permissions.permission")
        .create({ data: { action, role: publicRole.id, enabled: true } });
    }
  }

  strapi.log.info("Public API permissions configured");
}

async function ensureAdminUser(strapi) {
  const adminService = strapi.service("admin::user");
  const hasAdmin = await adminService.exists();

  if (hasAdmin) {
    strapi.log.info("Admin user already exists, skipping creation.");
    return;
  }

  const email = process.env.STRAPI_ADMIN_EMAIL;
  const password = process.env.STRAPI_ADMIN_PASSWORD;

  if (!email || !password) {
    strapi.log.warn(
      "STRAPI_ADMIN_EMAIL / STRAPI_ADMIN_PASSWORD not set — skipping admin seed."
    );
    return;
  }

  const superAdminRole = await strapi.service("admin::role").getSuperAdmin();

  await adminService.create({
    firstname: process.env.STRAPI_ADMIN_FIRSTNAME || "Admin",
    lastname: process.env.STRAPI_ADMIN_LASTNAME || "",
    email,
    password,
    registrationToken: null,
    isActive: true,
    roles: superAdminRole ? [superAdminRole.id] : [],
  });

  strapi.log.info(`Admin user created: ${email}`);
}

function buildDefaultMetadatas(strapi: any, uid: string): Record<string, any> {
  const contentType = strapi.contentType(uid);
  const attributes = contentType?.attributes || {};
  const metadatas: Record<string, any> = {};

  const NON_SORTABLE = new Set(["richtext", "text", "json", "media", "component", "dynamiczone", "relation"]);
  const NON_SEARCHABLE = new Set(["json", "media", "component", "dynamiczone"]);

  const systemFields: Record<string, any> = {
    id: { edit: {}, list: { label: "id", searchable: true, sortable: true } },
    documentId: { edit: {}, list: { label: "documentId", searchable: false, sortable: false } },
    createdAt: { edit: { label: "createdAt", description: "", placeholder: "", visible: false, editable: true }, list: { label: "createdAt", searchable: true, sortable: true } },
    updatedAt: { edit: { label: "updatedAt", description: "", placeholder: "", visible: false, editable: true }, list: { label: "updatedAt", searchable: true, sortable: true } },
    publishedAt: { edit: { label: "publishedAt", description: "", placeholder: "", visible: false, editable: true }, list: { label: "publishedAt", searchable: true, sortable: true } },
    createdBy: { edit: { label: "createdBy", description: "", placeholder: "", visible: false, editable: true, mainField: "firstname" }, list: { label: "createdBy", searchable: true, sortable: true } },
    updatedBy: { edit: { label: "updatedBy", description: "", placeholder: "", visible: false, editable: true, mainField: "firstname" }, list: { label: "updatedBy", searchable: true, sortable: true } },
  };
  Object.assign(metadatas, systemFields);

  for (const [name, schema] of Object.entries<any>(attributes)) {
    const type: string = schema.type || "";
    let mainField: string | undefined;
    if (type === "relation" && schema.target) {
      try {
        const targetCT = strapi.contentType(schema.target);
        const first = Object.entries<any>(targetCT.attributes).find(([, s]) => s.type === "string");
        mainField = first ? first[0] : "id";
      } catch { mainField = "id"; }
    }
    metadatas[name] = {
      edit: { label: name, description: "", placeholder: "", visible: true, editable: true, ...(mainField ? { mainField } : {}) },
      list: { label: name, searchable: !NON_SEARCHABLE.has(type), sortable: !NON_SORTABLE.has(type) },
    };
  }
  return metadatas;
}

async function configureContentType(
  strapi: any,
  uid: string,
  config: {
    settings?: Record<string, any>;
    metadatas?: Record<string, { edit?: Record<string, any>; list?: Record<string, any> }>;
    layouts?: { list?: string[]; edit?: { name: string; size: number }[][] };
  }
) {
  const store = strapi.store({ type: "plugin", name: "content_manager" });
  const key = `configuration_content_types::${uid}`;
  let value = await store.get({ key });

  if (!value) {
    const contentType = strapi.contentType(uid);
    const attrNames = Object.keys(contentType?.attributes || {});
    value = {
      settings: {
        bulkable: true, filterable: true, searchable: true, pageSize: 10,
        mainField: attrNames[0] || "id",
        defaultSortBy: attrNames[0] || "id",
        defaultSortOrder: "ASC",
      },
      metadatas: buildDefaultMetadatas(strapi, uid),
      layouts: {
        list: attrNames.slice(0, 4),
        edit: attrNames.map((name) => [{ name, size: 6 }]),
      },
    };
  }

  if (config.settings) value.settings = { ...value.settings, ...config.settings };
  if (config.metadatas) {
    for (const [field, meta] of Object.entries(config.metadatas)) {
      if (!value.metadatas[field]) value.metadatas[field] = {};
      if (meta.edit) value.metadatas[field].edit = { ...value.metadatas[field]?.edit, ...meta.edit };
      if (meta.list) value.metadatas[field].list = { ...value.metadatas[field]?.list, ...meta.list };
    }
  }
  if (config.layouts) {
    if (config.layouts.list) value.layouts.list = config.layouts.list;
    if (config.layouts.edit) value.layouts.edit = config.layouts.edit;
  }

  await store.set({ key, value });
}

async function configureAdminLayouts(strapi: any) {
  const l = (label: string) => ({ edit: { label }, list: { label } });

  await configureContentType(strapi, "api::product.product", {
    settings: { mainField: "Title", defaultSortBy: "sortOrder", defaultSortOrder: "ASC", pageSize: 25 },
    metadatas: {
      Title: l("Название"), H1: l("Заголовок H1"), Slug: l("URL"),
      Short_Description_Preview: l("Краткое описание (превью)"),
      Short_Description: l("Краткое описание"),
      Price_Rub: l("Цена (₽)"), Unit_of_Measure: l("Ед. измерения"), Weight: l("Вес"),
      Image: l("Изображение"), Gallery: l("Галерея"),
      Full_Description: l("Полное описание"), Specs: l("Характеристики"),
      isFeatured: l("Популярный"), isCustomOrder: l("Под заказ"),
      priceTiers: l("Ценовые уровни"), category: l("Категория"),
      Related_Products: l("Связанные товары"), reviews: l("Отзывы"), seo: l("SEO"),
      Show_Price_Note: l("Показать примечание"), Price_Note: l("Примечание к цене"),
      sortOrder: l("Сортировка"),
    },
    layouts: {
      list: ["Title", "Price_Rub", "Weight", "category", "isFeatured", "sortOrder"],
      edit: [
        [{ name: "Title", size: 8 }, { name: "Slug", size: 4 }],
        [{ name: "H1", size: 12 }],
        [{ name: "Price_Rub", size: 3 }, { name: "Unit_of_Measure", size: 3 }, { name: "Weight", size: 3 }, { name: "sortOrder", size: 3 }],
        [{ name: "category", size: 6 }, { name: "Related_Products", size: 6 }],
        [{ name: "isFeatured", size: 3 }, { name: "isCustomOrder", size: 3 }, { name: "Show_Price_Note", size: 3 }],
        [{ name: "Price_Note", size: 12 }],
        [{ name: "Short_Description_Preview", size: 12 }],
        [{ name: "Image", size: 12 }],
        [{ name: "Gallery", size: 12 }],
        [{ name: "Short_Description", size: 12 }],
        [{ name: "Full_Description", size: 12 }],
        [{ name: "Specs", size: 12 }],
        [{ name: "priceTiers", size: 12 }],
        [{ name: "seo", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::product-category.product-category", {
    settings: { mainField: "name" },
    metadatas: {
      name: l("Название"), slug: l("URL"), description: l("Описание"), products: l("Товары"),
    },
    layouts: {
      list: ["name", "slug"],
      edit: [
        [{ name: "name", size: 6 }, { name: "slug", size: 6 }],
        [{ name: "description", size: 12 }],
        [{ name: "products", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::dealer.dealer", {
    settings: { mainField: "Title", defaultSortBy: "City", defaultSortOrder: "ASC", pageSize: 25 },
    metadatas: {
      Title: l("Название"), City: l("Город"), Address: l("Адрес"),
      Phone: l("Телефон"), Email: l("Email"), Coordinates: l("Координаты"),
      Contact_Info: l("Контактная информация"), isActive: l("Активен"),
    },
    layouts: {
      list: ["Title", "City", "Phone", "Email", "isActive"],
      edit: [
        [{ name: "Title", size: 8 }, { name: "isActive", size: 4 }],
        [{ name: "City", size: 6 }, { name: "Address", size: 6 }],
        [{ name: "Phone", size: 6 }, { name: "Email", size: 6 }],
        [{ name: "Coordinates", size: 12 }],
        [{ name: "Contact_Info", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::review.review", {
    settings: { mainField: "author", defaultSortBy: "date", defaultSortOrder: "DESC", pageSize: 25 },
    metadatas: {
      author: l("Автор"), text: l("Текст отзыва"), rating: l("Оценка"),
      product: l("Товар"), isPublished: l("Опубликован"), date: l("Дата"),
    },
    layouts: {
      list: ["author", "product", "date", "isPublished"],
      edit: [
        [{ name: "author", size: 6 }, { name: "date", size: 6 }],
        [{ name: "product", size: 6 }, { name: "rating", size: 3 }, { name: "isPublished", size: 3 }],
        [{ name: "text", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::lead.lead", {
    settings: { mainField: "name", defaultSortBy: "createdAt", defaultSortOrder: "DESC", pageSize: 25 },
    metadatas: {
      type: l("Тип заявки"), name: l("Имя"), phone: l("Телефон"),
      email: l("Email"), company: l("Компания"), message: l("Сообщение"),
      product: l("Товар"), attachment: l("Вложение"),
    },
    layouts: {
      list: ["name", "type", "phone", "email", "createdAt"],
      edit: [
        [{ name: "type", size: 4 }, { name: "name", size: 4 }, { name: "company", size: 4 }],
        [{ name: "phone", size: 6 }, { name: "email", size: 6 }],
        [{ name: "product", size: 12 }],
        [{ name: "message", size: 12 }],
        [{ name: "attachment", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::city.city", {
    settings: { mainField: "name", defaultSortBy: "sortOrder", defaultSortOrder: "ASC", pageSize: 50 },
    metadatas: {
      name: l("Город"), slug: l("URL"), domain: l("Домен"),
      namePrepositional: l("Предложный падеж"), nameDative: l("Дательный падеж"),
      phones: l("Телефоны"), postalCode: l("Индекс"),
      address: l("Адрес"), warehouseAddress: l("Адрес склада"),
      mapLat: l("Широта"), mapLng: l("Долгота"),
      sortOrder: l("Сортировка"), isDefault: l("По умолчанию"),
    },
    layouts: {
      list: ["name", "domain", "sortOrder", "isDefault"],
      edit: [
        [{ name: "name", size: 4 }, { name: "slug", size: 4 }, { name: "domain", size: 4 }],
        [{ name: "namePrepositional", size: 6 }, { name: "nameDative", size: 6 }],
        [{ name: "postalCode", size: 4 }, { name: "sortOrder", size: 4 }, { name: "isDefault", size: 4 }],
        [{ name: "address", size: 12 }],
        [{ name: "warehouseAddress", size: 12 }],
        [{ name: "phones", size: 12 }],
        [{ name: "mapLat", size: 6 }, { name: "mapLng", size: 6 }],
      ],
    },
  });

  await configureContentType(strapi, "api::document.document", {
    settings: { mainField: "Title", defaultSortBy: "sortOrder", defaultSortOrder: "ASC" },
    metadatas: {
      Title: l("Название"), File: l("Файл"), Category: l("Категория"),
      Preview_Image: l("Превью"), sortOrder: l("Сортировка"),
    },
    layouts: {
      list: ["Title", "Category", "sortOrder"],
      edit: [
        [{ name: "Title", size: 8 }, { name: "Category", size: 4 }],
        [{ name: "sortOrder", size: 4 }],
        [{ name: "Preview_Image", size: 12 }],
        [{ name: "File", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::media-item.media-item", {
    settings: { mainField: "Title", defaultSortBy: "Date", defaultSortOrder: "DESC" },
    metadatas: {
      Title: l("Заголовок"), Slug: l("URL"), Date: l("Дата"), Type: l("Тип"),
      Short_Text: l("Краткий текст"), Full_Text: l("Полный текст"),
      Image_Preview: l("Превью"), Gallery: l("Галерея"),
    },
    layouts: {
      list: ["Title", "Type", "Date"],
      edit: [
        [{ name: "Title", size: 8 }, { name: "Slug", size: 4 }],
        [{ name: "Type", size: 6 }, { name: "Date", size: 6 }],
        [{ name: "Short_Text", size: 12 }],
        [{ name: "Image_Preview", size: 12 }],
        [{ name: "Full_Text", size: 12 }],
        [{ name: "Gallery", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::portfolio-item.portfolio-item", {
    settings: { mainField: "Title", defaultSortBy: "Date", defaultSortOrder: "DESC" },
    metadatas: {
      Title: l("Название проекта"), Slug: l("URL"), Date: l("Дата"),
      Short_Text: l("Краткое описание"), Full_Text: l("Полное описание"),
      Image_Preview: l("Превью"), Gallery: l("Галерея"), Videos: l("Видео"),
    },
    layouts: {
      list: ["Title", "Date"],
      edit: [
        [{ name: "Title", size: 8 }, { name: "Slug", size: 4 }],
        [{ name: "Date", size: 6 }],
        [{ name: "Short_Text", size: 12 }],
        [{ name: "Image_Preview", size: 12 }],
        [{ name: "Full_Text", size: 12 }],
        [{ name: "Gallery", size: 12 }],
        [{ name: "Videos", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::partner.partner", {
    settings: { mainField: "name", defaultSortBy: "sortOrder", defaultSortOrder: "ASC" },
    metadatas: {
      name: l("Название"), logo: l("Логотип"), url: l("Сайт"),
      sortOrder: l("Сортировка"), isActive: l("Активен"),
    },
    layouts: {
      list: ["name", "url", "sortOrder", "isActive"],
      edit: [
        [{ name: "name", size: 6 }, { name: "url", size: 6 }],
        [{ name: "sortOrder", size: 6 }, { name: "isActive", size: 6 }],
        [{ name: "logo", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::page.page", {
    settings: { mainField: "title" },
    metadatas: {
      title: l("Заголовок"), slug: l("URL"), content: l("Содержимое"), seo: l("SEO"),
    },
    layouts: {
      list: ["title", "slug"],
      edit: [
        [{ name: "title", size: 8 }, { name: "slug", size: 4 }],
        [{ name: "content", size: 12 }],
        [{ name: "seo", size: 12 }],
      ],
    },
  });

  await configureContentType(strapi, "api::home-page.home-page", {
    metadatas: {
      heroTitle: l("Заголовок баннера"), heroSubtitle: l("Подзаголовок баннера"),
      heroVideo: l("Видео баннера"), heroPoster: l("Постер видео"),
      aboutTitle: l("Блок «О компании» — заголовок"), aboutText: l("Блок «О компании» — текст"),
      aboutCtaLabel: l("Кнопка «О компании» — текст"), aboutCtaHref: l("Кнопка «О компании» — ссылка"),
      advantagesTitle: l("Блок «Преимущества» — заголовок"), advantages: l("Преимущества"),
      applicationAreasTitle: l("Блок «Области применения» — заголовок"), applicationAreas: l("Области применения"),
      productsTitle: l("Блок «Продукция» — заголовок"), productsSubtitle: l("Блок «Продукция» — подзаголовок"),
      productsCtaLabel: l("Кнопка «Продукция» — текст"), productsCtaHref: l("Кнопка «Продукция» — ссылка"),
      dealersTitle: l("Блок «Дилеры» — заголовок"), dealersText: l("Блок «Дилеры» — текст"),
      dealersPhone: l("Телефон дилеров"), dealersCtaLabel: l("Кнопка «Дилеры» — текст"),
    },
    layouts: {
      edit: [
        [{ name: "heroTitle", size: 12 }],
        [{ name: "heroSubtitle", size: 12 }],
        [{ name: "heroVideo", size: 12 }],
        [{ name: "heroPoster", size: 12 }],
        [{ name: "aboutTitle", size: 12 }],
        [{ name: "aboutText", size: 12 }],
        [{ name: "aboutCtaLabel", size: 6 }, { name: "aboutCtaHref", size: 6 }],
        [{ name: "advantagesTitle", size: 12 }],
        [{ name: "advantages", size: 12 }],
        [{ name: "applicationAreasTitle", size: 12 }],
        [{ name: "applicationAreas", size: 12 }],
        [{ name: "productsTitle", size: 12 }],
        [{ name: "productsSubtitle", size: 12 }],
        [{ name: "productsCtaLabel", size: 6 }, { name: "productsCtaHref", size: 6 }],
        [{ name: "dealersTitle", size: 12 }],
        [{ name: "dealersText", size: 12 }],
        [{ name: "dealersPhone", size: 6 }, { name: "dealersCtaLabel", size: 6 }],
      ],
    },
  });

  await configureContentType(strapi, "api::page-about.page-about", {
    metadatas: {
      Intro_Text: l("Вводный текст"), Full_Text: l("Полный текст"),
      Sidebar_Image: l("Изображение"), Requisites_Table: l("Реквизиты"),
    },
  });

  await configureContentType(strapi, "api::page-production.page-production", {
    metadatas: {
      Intro_Text: l("Вводный текст"), Full_Text: l("Полный текст"), Gallery: l("Галерея"),
    },
  });

  await configureContentType(strapi, "api::page-technology.page-technology", {
    metadatas: { Full_Text: l("Содержимое") },
  });

  await configureContentType(strapi, "api::page-hydrophobic.page-hydrophobic", {
    metadatas: { Full_Text: l("Содержимое") },
  });

  await configureContentType(strapi, "api::page-blacklist.page-blacklist", {
    metadatas: { Text_Content: l("Содержимое") },
  });

  await configureContentType(strapi, "api::page-contacts.page-contacts", {
    metadatas: { Contact_Info: l("Контактная информация"), departments: l("Отделы") },
  });

  await configureContentType(strapi, "api::page-dealers.page-dealers", {
    metadatas: { Intro_Text: l("Вводный текст") },
  });

  await configureContentType(strapi, "api::site-setting.site-setting", {
    metadatas: { logo: l("Логотип"), contacts: l("Контакты"), copyright: l("Копирайт") },
  });

  strapi.log.info("Admin panel layouts configured");
}

export default {
  async bootstrap({ strapi }) {
    await ensureAdminUser(strapi);
    await ensurePublicPermissions(strapi);
    await configureAdminLayouts(strapi);

    const productCount = await strapi.documents("api::product.product").count();
    if (productCount > 0) {
      strapi.log.info("Seed: data already exists, skipping.");
      return;
    }

    strapi.log.info("Seed: populating initial content...");

    // --- Product Categories ---
    const catCold = await strapi.documents("api::product-category.product-category").create({
      data: { name: "Холодный асфальт", slug: "cold-asphalt", description: "Всепогодная асфальтобетонная смесь, модифицированная концентратом Perma-Patch — новый вид материала для быстрого, надежного и безопасного круглогодичного ремонта дорожных покрытий." },
      status: "published",
    });
    const catBags = await strapi.documents("api::product-category.product-category").create({
      data: { name: "Мешки для пакетирования", slug: "packaging-bags", description: "Мешки полиэтиленовые с заваренным дном, без боковых складок, для пакетирования холодного асфальта." },
      status: "published",
    });

    // --- Products ---
    // imageFile:    обложка товара     → cms/src/seeds/images/<fileName>
    // galleryFiles: галерея (массив)   → cms/src/seeds/images/<fileName>
    // Отсутствующие файлы пропускаются без ошибок.
    const commonShortDescription = textToRichText(
      "Применяются гибкие скидки в зависимости от объемов закупки.\n" +
        "Отправьте нам свою заявку указав продукт, объем закупки, фасовку, адрес доставки и с вашими реквизитами.\n" +
        "Мы обязательно с вами свяжемся и предоставим вам предложение в течении суток"
    );

    const productsData = [
      {
        Title: "Холодный асфальт 35 кг (до 1000 кг)", Slug: "cold-asphalt-35kg-under-1000",
        Short_Description_Preview: "Цена при оплате менее 1000 кг. Стандартная фасовка в полиэтиленовых мешках.",
        Price_Rub: 680, Unit_of_Measure: "мешок", Weight: "35 кг", isFeatured: true, isCustomOrder: false, Show_Price_Note: false, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 100, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText(
          "Асфальтобетонная смесь\n" +
            "Perma Patch\n" +
            "— это холодный асфальт, который модифицирован инновационным концентратом Perma-Patch. Данный материал предназначен для безопасного, надежного и быстрого ремонта дорожного полотна как летом, так и в осенне-зимний период.\n" +
            "Использование холодного асфальта Perma Patch станет наилучшим решением при ремонте мостовых переходов, высокоскоростных автомагистралей, пешеходных дорожек и мн. др. Эту асфальтобетонную смесь можно смело назвать универсальной, так как она пригодна для проведения ремонтных работ при температуре от –30 °С до 49 °С. Ремонт может осуществляться в любое время года и при любых, даже самых неблагоприятных, погодных условиях.\n" +
            "Приобрести асфальтобетонную смесь Perma Patch по оптимальным расценкам можно, обратившись в ООО «Новые Технологии Асфальта — NovTecAs». Для удобства наших заказчиков мы предлагаем продукцию в различных вариантах фасовки. Оформить заказ можно непосредственно на сайте компании."
        ),
        priceTiers: [{ minQtyKg: 0, price: 680, label: "до 1000 кг" }, { minQtyKg: 1000, price: 640, label: "от 1000 кг" }, { minQtyKg: 5000, price: 610, label: "от 5000 кг" }],
        imageFile: "35kg.jpg",
        galleryFiles: ["35kg.jpg"],
      },
      {
        Title: "Холодный асфальт 35 кг (от 1000 кг)", Slug: "cold-asphalt-35kg-from-1000",
        Short_Description_Preview: "Цена при оплате более 1000 кг. Стандартная фасовка в полиэтиленовых мешках.",
        Price_Rub: 640, Unit_of_Measure: "мешок", Weight: "35 кг", isFeatured: true, isCustomOrder: false, Show_Price_Note: false, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 200, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText(
          "Асфальтобетонная смесь\n" +
            "Perma Patch\n" +
            "— это холодный асфальт, который модифицирован инновационным концентратом Perma-Patch. Данный материал предназначен для безопасного, надежного и быстрого ремонта дорожного полотна как летом, так и в осенне-зимний период.\n" +
            "Применение холодного асфальта Perma Patch станет наилучшим решением при ремонте мостовых переходов, высокоскоростных автомагистралей, укладке пешеходных дорожек и мн. др. Эту асфальтобетонную смесь можно смело назвать универсальной, так как она пригодна для проведения ремонтных работ при температуре от –30 °С до 49 °С. Ремонт дорожного покрытия может осуществляться в любое время года и при любых, даже самых неблагоприятных, погодных условиях.\n" +
            "Благодаря использованию в качестве добавки концентрата Perma Patch холодная смесь приобретает большую прочность, значительно увеличиваются сроки хранения продукта без потери его качества.\n" +
            "Холодный асфальт - купить от производителя\n" +
            "Приобрести асфальтобетонную смесь Perma Patch по оптимальным расценкам можно, обратившись в ООО «Новые Технологии Асфальта — NovTecAs». Для удобства наших заказчиков мы предлагаем продукцию в различных вариантах фасовки. Оформить заказ можно непосредственно на сайте компании."
        ),
        imageFile: "35kg.jpg",
        galleryFiles: ["35kg.jpg"],
      },
      {
        Title: "Холодный асфальт 35 кг (от 5000 кг)", Slug: "cold-asphalt-35kg-from-5000",
        Short_Description_Preview: "Оптовая партия от 5000 кг. Максимально выгодная цена.",
        Price_Rub: 610, Unit_of_Measure: "мешок", Weight: "35 кг", isFeatured: true, isCustomOrder: false, Show_Price_Note: false, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 300, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText(
          "Асфальтобетонная смесь\n" +
            "Perma Patch\n" +
            "— это холодный асфальт, который модифицирован инновационным концентратом Perma-Patch. Данный материал предназначен для безопасного, надежного и быстрого ремонта дорожного полотна как летом, так и в осенне-зимний период.\n" +
            "Использование холодного асфальта Perma Patch станет наилучшим решением при ремонте мостовых переходов, высокоскоростных автомагистралей, пешеходных дорожек и мн. др. Эту асфальтобетонную смесь можно смело назвать универсальной, так как она пригодна для проведения ремонтных работ при температуре от –30 °С до 49 °С. Ремонт может осуществляться в любое время года и при любых, даже самых неблагоприятных, погодных условиях.\n" +
            "Приобрести асфальтобетонную смесь Perma Patch по оптимальным расценкам можно, обратившись в ООО «Новые Технологии Асфальта — NovTecAs». Для удобства наших заказчиков мы предлагаем продукцию в различных вариантах фасовки. Оформить заказ можно непосредственно на сайте компании."
        ),
        imageFile: "35kg.jpg",
        galleryFiles: ["35kg.jpg"],
      },
      {
        Title: "Холодный асфальт 50 кг (полипропилен)", Slug: "cold-asphalt-50kg",
        Short_Description_Preview: "Под спецзаказ при определённой партии. Полипропиленовые мешки.",
        Price_Rub: 760, Unit_of_Measure: "мешок", Weight: "50 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 400, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText(
          "Асфальтобетонная смесь\n" +
            "Perma Patch\n" +
            "— это холодный асфальт, который модифицирован инновационным концентратом Perma-Patch. Данный материал предназначен для безопасного, надежного и быстрого ремонта дорожного полотна как летом, так и в осенне-зимний период.\n" +
            "Использование холодного асфальта Perma Patch станет наилучшим решением при ремонте мостовых переходов, высокоскоростных автомагистралей, пешеходных дорожек и мн. др. Эту асфальтобетонную смесь можно смело назвать универсальной, так как она пригодна для проведения ремонтных работ при температуре от –30 °С до 49 °С. Ремонт может осуществляться в любое время года и при любых, даже самых неблагоприятных, погодных условиях.\n" +
            "Приобрести асфальтобетонную смесь Perma Patch по оптимальным расценкам можно, обратившись в ООО «Новые Технологии Асфальта — NovTecAs». Для удобства наших заказчиков мы предлагаем продукцию в различных вариантах фасовки. Оформить заказ можно непосредственно на сайте компании."
        ),
        imageFile: "30-50kg.jpg",
        galleryFiles: ["30-50kg.jpg"],
      },
      {
        Title: "Холодный асфальт 30 кг (полипропилен)", Slug: "cold-asphalt-30kg",
        Short_Description_Preview: "Под спецзаказ при определённой партии. Полипропиленовые мешки.",
        Price_Rub: 470, Unit_of_Measure: "мешок", Weight: "30 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 500, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText(
          "Асфальтобетонная смесь\n" +
            "Perma Patch\n" +
            "— это холодный асфальт, который модифицирован инновационным концентратом Perma-Patch. Данный материал предназначен для безопасного, надежного и быстрого ремонта дорожного полотна как летом, так и в осенне-зимний период.\n" +
            "Использование холодного асфальта Perma Patch станет наилучшим решением при ремонте мостовых переходов, высокоскоростных автомагистралей, пешеходных дорожек и мн. др. Эту асфальтобетонную смесь можно смело назвать универсальной, так как она пригодна для проведения ремонтных работ при температуре от –30 °С до 49 °С. Ремонт может осуществляться в любое время года и при любых, даже самых неблагоприятных, погодных условиях.\n" +
            "Приобрести асфальтобетонную смесь Perma Patch по оптимальным расценкам можно, обратившись в ООО «Новые Технологии Асфальта — NovTecAs». Для удобства наших заказчиков мы предлагаем продукцию в различных вариантах фасовки. Оформить заказ можно непосредственно на сайте компании."
        ),
        imageFile: "30-50kg.jpg",
        galleryFiles: ["30-50kg.jpg"],
      },
      {
        Title: "Холодный асфальт 1000 кг (биг-бег)", Slug: "cold-asphalt-1000kg",
        Short_Description_Preview: "Холодный асфальт Perma Patch в биг-бегах по 1000 кг.",
        Price_Rub: 17910, Unit_of_Measure: "тонна", Weight: "1000 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 600, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText(
          "Perma Patch — это одна из самых современных марок холодного асфальта. Продукт представляет собой асфальтобетонную смесь с добавкой инновационного концентрата Perma-Patch, который позволяет осуществлять ремонт дорожного полотна максимально качественно и безопасно. Кроме того, McAsphalt Perma Patch позволяет свести к минимуму время проведения ремонтных работ.\n" +
            "Холодный асфальт этой торговой марки — идеальное решение для любых типов ремонтных работ в области дорожного строительства. С помощью Perma Patch можно осуществлять ремонт высокоскоростных магистралей, тротуаров, пешеходных дорожек, мостовых переправ и многого другого.\n" +
            "Благодаря новому материалу Perma-Patch можно вести ремонтные мероприятия в любое время года, даже при неблагоприятных погодных условиях. Продукт пригоден для работы в условиях низких и высоких температур (–30 — 49 °С). Заказать холодный асфальт Perma Patch в биг-бэгах по 1 т или в упаковке меньшего объема вы можете, обратившись в нашу компанию."
        ),
        imageFile: "1000kg.jpg",
        galleryFiles: ["1000kg.jpg"],
      },
      {
        Title: "Красный холодный асфальт Perma Patch Color, фасовка 1000 кг", Slug: "red-cold-asphalt-bags",
        Short_Description_Preview: "Цветной холодный асфальт для выделения дорожных зон и покрытий.",
        Price_Rub: 1565, Unit_of_Measure: "мешок", Weight: "1000 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 700, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText("Образцы холодного асфальта Perma Patch -COLOR:"),
        imageFile: "1000kg.jpg",
        galleryFiles: ["1000kg.jpg","red1.jpg","red2.jpg"],
      },
      {
        Title: "Красный Холодный асфальт в мешках Perma Patch - COLOR, 30 кг", Slug: "red-cold-asphalt-30kg",
        Short_Description_Preview: "Цветной холодный асфальт для выделения дорожных зон и покрытий.",
        Price_Rub: 1565, Unit_of_Measure: "мешок", Weight: "30 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 800, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText("Образцы холодного асфальта Perma Patch -COLOR:"),
        imageFile: "30-50kg.jpg",
        galleryFiles: ["30-50kg.jpg","red1.jpg","red2.jpg"],
      },
      {
        Title: "Вяжущее для холодного асфальта 205 л (185 кг)", Slug: "binder-perma-patch-205l",
        Short_Description_Preview: "Вяжущее для производства холодного асфальта Perma Patch.",
        Price_Rub: 34385, Unit_of_Measure: "бочка", Weight: "185 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 900, category: catCold.documentId,
        Short_Description: commonShortDescription,
        Full_Description: textToRichText(
          "В состав вяжущего (соотношение 50 кг вяжущего, 950 кг щебня на 1000 кг готового холодного асфальта Perma Patch), входят:\n" +
            "-\n" +
            "Битум\n" +
            "-\n" +
            "Дизельное топливо\n" +
            "-\n" +
            "Концентрат Perma-Patch"
        ),
        imageFile: "vyazhuschee.jpg",
        galleryFiles: ["vyazhuschee.jpg"],
      },
      {
        Title: "Мешки полиэтиленовые для холодного асфальта", Slug: "pe-bags-cold-asphalt",
        Short_Description_Preview: "Мешки полиэтиленовые с заваренным дном, для пакетирования холодного асфальта по 25 или 30 кг.",
        Price_Rub: 95, Unit_of_Measure: "шт.", Weight: "—", isFeatured: false, isCustomOrder: false, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", sortOrder: 1000, category: catBags.documentId,
        Full_Description: "<p>Мешки полиэтиленовые с заваренным дном, без боковых складок, для пакетирования холодного асфальта по 25 или 30 кг.</p>",
        imageFile: "meshki.jpg",
        galleryFiles: ["meshki.jpg"],
      },
    ];

    const createdProducts: Record<string, { documentId: string }> = {};
    for (const p of productsData) {
      const { imageFile, galleryFiles, ...productData } = p;

      const [imageId, galleryIds] = await Promise.all([
        uploadSeedFile(strapi, imageFile, productData.Title),
        uploadSeedGallery(strapi, galleryFiles, productData.Title),
      ]);

      const created = await strapi.documents("api::product.product").create({
        data: {
          ...productData,
          ...(imageId ? { Image: imageId } : {}),
          ...(galleryIds.length ? { Gallery: galleryIds } : {}),
        },
        status: "published",
      });
      createdProducts[productData.Slug] = created;
    }

    // --- Reviews ---
    const reviewsData = [
      {
        productSlug: "cold-asphalt-50kg",
        reviews: [
          {
            author: "Анатолий",
            date: "2025-10-22",
            text: "Холодный асфальт довольно бюджетное покрытие. По прочности, конечно, немного уступает бетону, но зато значительно дешевле. Я покупал 4 мешка для укладки большой площадки возле частного дома. Сделал широкий заезд в 20 метров. Думаю, еще и с другой стороны дома использовать это покрытие.",
          },
          {
            author: "Ян Д.",
            date: "2025-10-19",
            text: "Покупал на этом сайте покрытие Холодный асфальт. Я не стал искать специалистов для укладки, делал всем сам. Думаю, получилось неплохо. По крайней мере, соседям стало интересно, чем это я заасфальтировал.",
          },
          {
            author: "Борис",
            date: "2025-10-16",
            text: "Выбрали покрытие холодного асфальта для благоустройства парковой площадки возле административного корпуса. Шеф выделил средства на 3 мешка, которых нам вполне хватило. Заодно и ямы залатали возле въезда.",
          },
        ],
      },
      {
        productSlug: "cold-asphalt-30kg",
        reviews: [
          {
            author: "Юрий Д.",
            date: "2025-12-07",
            text: "Оставлял заявку на сайте. Цена вышла ниже, чем на сайте. Менеджер мне оформил персональную скидку, чем я был приятно удивлен. Вышло очень экономно. Доставка также не подвела. Все привезли быстро. Упаковали хорошо. Все мешки целые и без повреждений.",
          },
          {
            author: "Сергей Снижко",
            date: "2025-11-28",
            text: "Оформлял доставку в Краснодар. Товар пришел довольно быстро и мы своевременно провели отгрузку. Я рассчитывал, что начнем ремонт до холодов, и не просчитался. Рекомендую! Оперативно и честно!",
          },
          {
            author: "Николай П.",
            date: "2025-11-07",
            text: "Меня приятно порадовали скидки, так как я заказывал большой объем. Оставлял заявку на сайте. Менеджер мне быстро оформил заказ. Перезвонили в течение дня.",
          },
          {
            author: "Игорь С.",
            date: "2025-10-12",
            text: "Не так давно узнал о покрытии холодный асфальт. Приезжал к другу на дачу и увидел заметные улучшения на дороге в его стороне. Оказалось, он сам заасфальтировал таким инновационным покрытием. Я тоже решил попробовать. Взял 2 мешка по 35 кг, поеду к родителям на выходных.",
          },
          {
            author: "Юрий",
            date: "2025-09-19",
            text: "Решил преобразить площадку возле ворот. Там постоянно остается грязь после дождя, поэтому я выбрал по совету соседа покрытие Холодный асфальт. Заказал сразу 3 мешка, чтобы хватило. Мне хватило на мою площадь 15 м2, еще и осталось полмешка. Посмотрим, как покрытие поведет себя после зимы.",
          },
          {
            author: "Alex",
            date: "2025-08-16",
            text: "Живу в Курске. Заказывал в этом магазине неделю назад. Заявку оформил в четверг. В пятницу мне отправили два мешка по 35 кг. А на выходных посылка как раз пришла, как я рассчитывал. Сразу же занялся ремонтом. Спасибо за оперативность!",
          },
        ],
      },
      {
        productSlug: "cold-asphalt-35kg-under-1000",
        reviews: [
          {
            author: "Леонид С. А.",
            date: "2025-12-13",
            text: "Остался очень доволен качеством материала. Смесь готова к использованию. Мы делали укладку на парковочных местах возле подъезда. Все прошло быстро, несмотря на то, что погода была мрачной (+7 градусов).",
          },
          {
            author: "Виталий",
            date: "2025-12-08",
            text: "Хочу отметить вежливое обслуживание и быструю доставку в этой компании. Очень внимательный персонал. Буквально за 5 минут я узнал всю необходимую информацию о товаре и оформил заказ.",
          },
          {
            author: "Олег",
            date: "2025-11-21",
            text: "Покупал этот материал по просьбе друга и остался вполне довольным. Делали ремонт на участке и холодный асфальт нас очень выручил. Быстро сделали укладку садовой дорожки.",
          },
          {
            author: "Инга",
            date: "2025-10-05",
            text: "Я оформляла заявку на этом сайте на дорожное покрытие Холодный асфальт для своего отца. Он затеял ремонт на даче и решил заасфальтировать дорожку. Менеджер быстро оформил заявку, отправку провели на следующий день. В Красноярск посылка пришла через 2 дня.",
          },
          {
            author: "Петр Павлович",
            date: "2025-09-19",
            text: "Покупал холодный асфальт Perma Patch для своего частного дома. У меня лежала несколько лет резина, но она уже совсем износилась и я решил сделать новое покрытие. Плитку не стал выбирать потому, что дорого. Решил остановить выбор на этом продукте. Я не жалею о своем выборе.",
          },
          {
            author: "Николай",
            date: "2025-09-02",
            text: "Заказывали на этом сайте. Быстро привозят. Вежливые менеджеры. Выбрал фасовку 35 кг для пробы. Давно слышал о таком покрытии и решил сам приобрести. Я остался доволен.",
          },
        ],
      },
      {
        productSlug: "cold-asphalt-35kg-from-1000",
        reviews: [
          {
            author: "Валентин Павлович",
            date: "2025-12-05",
            text: "Заказывал на этом сайте не первый раз и решил оставить отзыв. Заказывал 5 мешков по 35 кг. Хорошо упаковали и быстро доставили. Ставлю 5 баллов!",
          },
          {
            author: "Ольга",
            date: "2025-11-25",
            text: "Заказывала по просьбе мужа. Менеджер быстро оформил заказ и через три дня посылка с тремя мешками смеси была в нашем отделении почты. О характеристиках товара не могу ничего сказать, так как еще не пользовались.",
          },
          {
            author: "Денис",
            date: "2025-11-21",
            text: "Удобно, что смесь продается сразу готовой к эксплуатации. Оформил заказ после 15 часов дня, отправку провели быстро на следующий день. Качеством товара остался довольный.",
          },
          {
            author: "Андрей Игоревич",
            date: "2025-10-03",
            text: "Заявку обработали быстро в течении часа. Менеджер мне перезвонил и помог мне рассчитать, сколько нужно мешков на площадь 20 м2, хотя онлайн калькулятор расчета есть на сайте. Странно, что я его сразу не заметил.",
          },
          {
            author: "Родион П.",
            date: "2025-09-14",
            text: "Специалисты магазина вежливые и всегда на связи. Помогли мне подобрать покрытие холодного асфальта для благоустройства частной территории. Заказал доставку на почту по предоплате. Все честно доставили в срок.",
          },
          {
            author: "Дмитрий",
            date: "2025-08-28",
            text: "В отличие от обычного асфальта, холодный асфальт имеет мелкую зернистость. Я проверил на своем опыте, что он выдерживает значительную нагрузку. Кладку мы проводили при температуре +10 градусов. Заказывал 2 мешка по 35 кг и обошлось недорого – 1100 рублей.",
          },
        ],
      },
      {
        productSlug: "cold-asphalt-1000kg",
        reviews: [
          {
            author: "Антон",
            date: "2025-12-14",
            text: "Заказывал в этой компании несколько месяцев назад и остался вполне доволен. Звонил вечером после работы, так как днем очень занят. Менеджер быстро объяснил, что мне лучше взять. Я ценю быстрое обслуживание без долгих бесед.",
          },
          {
            author: "Анатолий",
            date: "2025-12-02",
            text: "Не могу не отметить приятное обслуживание. Специалисты этой компании знают толк в продукции. Все четко объяснили и помогли подобрать подходящий объем. Благодаря грамотной консультации я значительно сэкономил на перевозке и покупке материала.",
          },
          {
            author: "Евгений Жук",
            date: "2025-11-02",
            text: "Компания проверенная. Это не мошенники. Я сначала сомневался, так как не люблю заказывать в интернете, но низкая цена искусила меня. Остался всем доволен, поэтому рекомендую здесь покупать.",
          },
        ],
      },
    ];

    let reviewCount = 0;
    for (const group of reviewsData) {
      const product = createdProducts[group.productSlug];
      if (!product) continue;
      for (const r of group.reviews) {
        await strapi.documents("api::review.review").create({
          data: {
            author: r.author,
            date: r.date,
            text: r.text,
            isPublished: true,
            product: product.documentId,
          },
        });
        reviewCount++;
      }
    }

    // --- Page About ---
    const aboutBanner = await uploadSeedFileWithMeta(strapi, "about-banner.jpg", "О компании NovTecAs");
    const aboutBannerHtml = aboutBanner
      ? `<img src="${aboutBanner.url}" alt="О компании NovTecAs" style="width:100%;height:auto;border-radius:12px;" />`
      : "";
    await strapi.documents("api::page-about.page-about").create({
      data: {
        Intro_Text: "«Новые Технологии Асфальта – NovTecAs» специализируется на реализации холодного асфальта для ремонта дорожных покрытий.",
        Full_Text: `${aboutBannerHtml}<p>В основе продукта — концентрат <strong>Perma Patch</strong> от <strong>McAsphalt Industries Limited</strong> (Канада), который зарекомендовал себя как эффективное решение для быстрого и удобного ямочного ремонта.</p>
        <p>Холодный асфальт <strong>NovTecAs</strong> подходит для применения в разных условиях и не требует сложной подготовки при использовании.</p>
        <p>Материал поставляется в удобной фасовке: биг-беги по 1000 кг и пластиковые мешки по 30 кг.</p>
        `,
        Requisites_Table: [
          { label: "Полное наименование", value: 'ООО "Новые Технологии Асфальта"' },
          { label: "ИНН", value: "7706439089" },
          { label: "КПП", value: "770601001" },
          { label: "ОГРН", value: "1167746559452" },
          { label: "ОКПО", value: "03033939" },
          { label: "ОКВЭД", value: "26.82.2" },
          { label: "Юридический адрес", value: "119180, РФ, г. Москва, ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1" },
          { label: "Почтовый адрес", value: "445021, РФ, г. Тольятти, А/Я №3667" },
          { label: "Расчётный счёт", value: "40702810403000019060" },
          { label: "Банк", value: "ПРИВОЛЖСКИЙ филиал ПАО «ПРОМСВЯЗЬБАНК»" },
          { label: "Кор/счёт", value: "30101810700000000803" },
          { label: "БИК", value: "042202803" },
        ],
      },
      status: "published",
    });

    // --- Page Production ---
    await strapi.documents("api::page-production.page-production").create({
      data: {
        Intro_Text: "Собственное производство с минимальными затратами на оборудование. Гибкая система скидок для клиентов и возможность организации производства на территории дилеров и представителей.",
        Full_Text: `<h2>Холодный асфальт — производство</h2>
<p>У нашей компании очень гибкая система скидок для клиентов, но порой логистика может стоить дороже самого холодного асфальта, поэтому мы для наших представителей и дилеров можем предложить производство на их территории холодного асфальта.</p>
<p>Для приготовления асфальтобетона по технологии «PermaPatch» применяется <strong>смесь асфальтобетонная холодная</strong> — <em>рационально подобранная смесь из дробленого минерального заполнителя и органического вяжущего, модифицированного концентратом — полимером «PermaPatch», перемешанных в смесителях асфальтобетонных заводов.</em></p>
<p>Холодный асфальт <strong>Perma-Patch</strong> позволяет осуществлять <strong>ямочный ремонт на влажном покрытии</strong>, а также <strong>в холодную погоду</strong> (при температуре от минус 30\u00a0°С до +49\u00a0°С) с применением <em>холодных асфальтобетонных смесей, полученных по технологии компании «PermaPatch»</em>. Смесь сохраняет свои свойства при хранении в открытых штабелях, под навесом на твердом покрытии в течение двух лет или в полиэтиленовых мешках без ограничения по времени.</p>
<p>Наша компания приветствует тех, кто готов и имеет возможность наладить производство холодного асфальта. С нашей помощью это возможно практически на любом имеющемся асфальтном заводе. Если у вас нет завода — его можно взять на условия процессинга (аренды).</p>
<p>Итак, у вас есть асфальтный завод на тех или иных условиях: вы подбираете по нашим рекомендациям инертный материал (щебень) и отправляете к нам для подбора вяжущего. Когда мы подберём для вас вяжущее — озвучиваем конечную цену на вяжущее, фасованного в 205-литровые металлические бочки. Согласовываем с вами логистику и на условиях подписанного договора отправляем к вам вяжущее. Даём рекомендации на технологический процесс.</p>

<h2>Требования, предъявляемые к минеральным материалам</h2>
<p>При приготовлении смесей следует использовать щебень из изверженных или осадочных горных пород, отвечающий требованиям ГОСТ 8267, или отсев дробления изверженных или осадочных горных пород, отвечающий требованиям ГОСТ 8736. Минеральный заполнитель должен соответствовать требованиям, приведённым в таблице\u00a01.</p>

<h3>Требования к минеральному заполнителю (Таблица\u00a01)</h3>
<table>
<thead><tr><th>Показатель</th><th>Нормативное значение</th></tr></thead>
<tbody>
<tr><td>Содержание пылевидных, илистых и глинистых частиц, %, не более</td><td>2,0</td></tr>
<tr><td>Дробимость, не ниже</td><td>1000</td></tr>
<tr><td>Истираемость</td><td>И2</td></tr>
<tr><td>Морозостойкость</td><td>F50</td></tr>
<tr><td>Содержание зёрен слабых пород, %, не более</td><td>3</td></tr>
<tr><td>Суммарная удельная эффективная активность естественных радионуклидов, Бк/кг, не более</td><td>740</td></tr>
</tbody>
</table>

<h3>Требования к гранулометрическому составу (Таблица\u00a02)</h3>
<table>
<thead><tr><th colspan="8">Количество частиц, % по массе, мельче данного размера, мм</th></tr>
<tr><th>10</th><th>5</th><th>2,5</th><th>1,25</th><th>0,63</th><th>0,315</th><th>0,14</th><th>0,071</th></tr></thead>
<tbody>
<tr><td>100</td><td>20–55</td><td>5–30</td><td>0–10</td><td>0–8</td><td>0–5</td><td>0–3</td><td>0–2</td></tr>
</tbody>
</table>

<p>Для приготовления смесей рекомендуется применять щебень фракции 2–5\u00a0мм или 4–9\u00a0мм, желательно кубовидной формы. Зерновые составы минеральной части смесей и холодных асфальтобетонов должны соответствовать установленным в таблице\u00a02.</p>
<p>Для приготовления асфальтобетона по технологии «PermaPatch» необходим щебень узкой фракции 2–6\u00a0мм из изверженных пород типа гранит или осадочных пород прочностью 1000–1400\u00a0кг/см². Желательно первой группы лещадности.</p>

<p><strong>Обращайтесь к нам, и мы вместе с вами сможем организовать ваше производство.</strong></p>
<p>Звоните по тел. <a href="tel:+79270222849">+7 927 022 28 49</a>, <a href="tel:+79372111107">+7 937 211 11 07</a></p>`,
      },
      status: "published",
    });

    // --- Page Technology ---
    await strapi.documents("api::page-technology.page-technology").create({
      data: {
        Full_Text: `<h2>Технология укладки холодного асфальта</h2>
<h3>Укладка холодных асфальтобетонных смесей</h3>
<p>1. Укладку смеси можно производить в любую погоду.</p>
<p>2. В холодное время года перед укладкой смесь необходимо поместить в теплое помещение на 1–2 сут. Убедившись, что смесь приобрела подвижность (оттаяла), её необходимо тщательно перемешать до однородного состава.</p>
<p>3. Подготовку повреждённого места ведут в нижеописанном порядке.</p>
<p>Выбоины обрубают по контуру, удаляя разрушенные или ослабленные части. Несколько небольших выбоин, близкорасположенных друг к другу, объединяют в одну общую карту. Площадь ремонта должна быть не более 5\u00a0м². Обрубать все края выбоины необходимо строго вертикально, чтобы обеспечить упор пластичной асфальтовой массы и исключить её наплывы до затвердения. В зимний период выбоины очищают от снега и наледи перед ремонтом.</p>
<p>Для разделки выбоин также применяют дорожные фрезы.</p>
<p>Выбоина обязательно должна быть просушенной.</p>
<p>После обрубки краёв выемки её, в отличие от традиционной технологии ямочного ремонта, не требуется обрабатывать вяжущим, так как дополнительная плёнка битума препятствует надёжному сцеплению старого асфальта с холодной смесью, а избыточное количество битума замедляет время затвердевания смеси.</p>
<p>4. Подготовленную выбоину заполняют смесью. Смесь укладывают в выбоину с учётом коэффициента на уплотнение, который принимают 1,5–1,6. Смесь укладывают на 1–2\u00a0см выше поверхности существующего покрытия.</p>
<p>Рекомендуемая толщина слоя смеси от 3 до 5\u00a0см. Материал укладывают только в один слой. При большей глубине выемки смесь укладывают послойно или выемку сначала заполняют щебнем фракции (5–20\u00a0мм) марки не ниже 600 с уплотнением до К\u00a0=\u00a00,95–0,98, добиваясь одинаковой глубины ремонтируемого участка (3–5\u00a0см). После этого приступают к укладке смеси от краёв выбоины к центру.</p>
<p>5. Уплотнение смеси производят вибротрамбовками в том же порядке.</p>
<p>6. После уплотнения заделанную выбоину посыпают гранитной пылью или цементом (можно применять сухой песок) для избежания уноса вяжущего колёсами автотранспорта до его окончательного схватывания.</p>
<p>7. Производится повторное уплотнение смеси от краёв выбоины к центру.</p>
<p>8. Места, где недостаточное количество цемента или гранитной пыли, повторно посыпают. Если заделанная выбоина до окончательного уплотнения (примерно 7–10 дней после укладки) попадает под дождь, необходимо повторить процесс засыпки поверхности гранитной пылью или сухим мелким песком.</p>
<p>Ремонт покрытий с применением холодных асфальтобетонных смесей производят в любое время года.</p>
<p>Движение по отремонтированному участку в сухую погоду открывают сразу же после укладки и предварительного уплотнения смеси, в мокрую погоду — через 2–4\u00a0ч после укладки. Движение транспорта обеспечивает требуемую плотность и ровность ремонтного слоя, а также сопряжение в одном уровне отремонтированного места со старым покрытием, благодаря адгезионным свойствам «заплаты».</p>
<p>Под действием уплотняющей техники и под давлением транспорта <em>активизируются адгезионные процессы между органическим вяжущим и минеральной частью и испарение лёгких фракций из органического вяжущего, в результате чего происходит затвердевание смеси.</em></p>

<h3>Преимущества использования холодной асфальтовой смеси</h3>
<ul>
<li>Высокое качество устранения дефектов (соответствие показателям плотности, прочности, ровности, жёсткости основного покрытия)</li>
<li>Длительный срок службы отремонтированного места</li>
<li>Постоянное наличие и доступность необходимого материала, машин и оборудования</li>
<li>Простота ремонта</li>
<li>Использование данной технологии в любых погодных условиях</li>
<li>Оперативность открытия движения транспорта в местах проведения ремонта — мгновенное, не надо ждать полного застывания</li>
</ul>

<h3>Холодный асфальт для покрытий взлётно-посадочных полос и аэродромов</h3>
<p>Обладает повышенными физико-механическими показателями и устойчивостью к высоким летним температурам. Основное предназначение холодного асфальта — это оперативный и качественный ремонт покрытия аэропортов и аэродромов (заделка выбоин, разрытий или других повреждений) в любое время года.</p>
<p>Наиболее интенсивно асфальтовые покрытия деформируются ранней весной и поздней осенью. Ремонт в это время проводят в аварийном порядке, используя горячие асфальтобетонные смеси, которые укладывают на мокрое основание. Долговечность их крайне низкая.</p>
<p>Разработанная модифицированная асфальтобетонная смесь предназначена для предотвращения этого недостатка. Основными эксплуатационными отличиями этого ремонтного материала является возможность его длительного хранения в работоспособном состоянии, при применении без подогрева и при температуре смеси равной температуре окружающей среды, а также возможность круглогодичного проведения ремонтных работ, включая отрицательные температуры воздуха (до -39\u00a0°С).</p>
<p>Смесь состоит из минеральных материалов и вяжущего — жидкого модифицированного битума, содержащего химические добавки, улучшающие сцепление вяжущего с минеральным материалом и покрытием. Концентрат «Perma-Patch», входящий в состав холодной смеси, создаёт на поверхности битума защитный слой и предотвращает затвердевание битума при хранении готовой смеси, обеспечивая работоспособность материала при укладке в ремонтные карты.</p>
<p>Однако уже в процессе уплотнения смеси, благодаря наличию концентрата «Perma-Patch», происходит быстрое формирование структуры покрытия, что благоприятно сказывается на его дальнейшем эксплуатационном состоянии. При соблюдении всех технологических параметров производства и уплотнения холодной смеси, образцы холодного асфальта не уступают даже требованиям, предъявляемым к горячим асфальтобетонным смесям (прочность выше 2,2\u00a0МПа).</p>
<p>Дополнительных мероприятий по удалению пластификатора и уходу за покрытием не требуется, так как уже в первые часы формирования его структуры происходит значительный набор прочности (до 80\u00a0%), превосходящей на 30–40\u00a0% требования ГОСТ 9128-2009, предъявляемых для холодных асфальтобетонных смесей. Дальнейшее испарение остатков пластификатора приведёт лишь к ещё большему улучшению структуры асфальтобетонного покрытия.</p>
<p>Таким образом, разработанная модифицированная холодная асфальтобетонная смесь является эффективным и экономически выгодным средством для своевременного ремонта покрытий территорий аэропортов и аэродромов.</p>

<h3>Область применения</h3>
<p>Холодный асфальт применяется для быстрого ремонта выбоин и трещин в аэродромном покрытии (асфальте, бетоне) в течение всего календарного года. После укладки образует твёрдую, долговечную поверхность, устойчивую к нагрузкам (усадке, расширению), вызванным транспортными и погодными условиями. Сразу же после укладки поверхность готова к эксплуатации.</p>
<p>Отпускается в пластиковых баулах (BIG-BAG) фасовка 960–1000\u00a0кг.</p>

<h3>Подбор формулы для производства холодного асфальта</h3>
<p>Компанией «NovTecAs — Новые Технологии Асфальта» произведён самостоятельный подбор в лабораторных условиях формулы вяжущего для производства холодного асфальта по канадской технологии на основе концентрата Perma Patch.</p>`,
      },
      status: "published",
    });

    // --- Page Hydrophobic ---
    await strapi.documents("api::page-hydrophobic.page-hydrophobic").create({
      data: {
        Full_Text: `<h2>Гидрофобный слой в нефтеналивных терминалах</h2>
<p>«Новые Технологии Асфальта — NovTecAs» производит и реализует холодный сухой асфальт, который широко применяется для создания гидрофобного слоя для гидроизоляции резервуаров нефтеналивных терминалов. Высокое качество продукции и сжатые сроки производства позволили нам реализовать сложный проект, поставив 3000\u00a0тонн холодного асфальта Perma Patch для работы на объектах в широтах Крайнего Севера. Столь сложный заказ удалось реализовать в период с 7\u00a0ноября по 2\u00a0декабря 2013\u00a0года.</p>
<p><strong>Мы всегда подходим к каждому заказу индивидуально, подбирая по техническому заданию заказчика тот материал, который ему необходим, согласовываем и потом приступаем к изготовлению.</strong></p>

<h3>Преимущества холодного асфальта как гидрофобного слоя нефтеналивных терминалов</h3>
<ul>
<li><strong>Использование при отрицательных температурах.</strong> Некоторые марки активно применяются для укладки при температуре от +49 до -30\u00a0°С</li>
<li><strong>Длительный срок хранения.</strong> Благодаря эффективной формуле вяжущего вещества, при надлежащих условиях хранения сохраняет свои свойства от 24\u00a0месяцев и более</li>
<li><strong>Простота укладки.</strong> Для использования холодного асфальта не потребуются специализированные инструменты и технические средства. Достаточно виброплиты и шанцевого инструмента</li>
<li><strong>Высокая адгезия.</strong> Благодаря современной формуле обеспечивается отличная сцепка со вспомогательными и основными элементами</li>
</ul>`,
      },
      status: "published",
    });

    // --- Page Blacklist ---
    const pretenziya = await uploadSeedDocument(strapi, "pretenziya-1-ot-20-05-2024.pdf", "Претензия 1 от 20.05.2024");
    const pretenziyaLink = pretenziya
      ? `<a href="${pretenziya.url}" download>Скачать претензию</a>`
      : "Скачать претензию";

    await strapi.documents("api::page-blacklist.page-blacklist").create({
      data: {
        Text_Content: `<p>Предлагаем Вашему вниманию список компаний и людей, с которыми наша организация имеет негативный опыт сотрудничества и работа с которыми может быть опасна для Вас и Вашей компании:</p>
<ol>
<li><strong>ООО «Ямалгазпрогресс»</strong> (ИНН 7841407982) — между компаниями ООО «Ямалгазпрогресс» и ООО «Новые технологии асфальта» был заключён договор и соглашение о поставке дизельного топлива на 230 230,00 рублей от поставщика ООО «Ямалгазпрогресс». Прошло уже несколько месяцев, а договорные обязательства не были исполнены поставщиком. В ответ на нашу претензию компания направила ответное письмо, что денежные средства будут возвращены в течение 14 рабочих дней. На данный момент обязательства по договору не были исполнены. Возврата уплаченных средств также не поступило. За неисполнение договорных обязательств по настоящему договору компания ООО “Ямалгазпрогресс” понесет ответственность в соответствии с законодательством РФ.</li>
<li><strong>ООО «ТЕХНОРЭД»</strong> (ИНН 5036173648) — поставка некачественного оборудования. ${pretenziyaLink}</li>
</ol>`,
      },
      status: "published",
    });

    // --- Page Contacts ---
    await strapi.documents("api::page-contacts.page-contacts").create({
      data: {
        Contact_Info: `<p><strong>Адрес:</strong> 119180, Российская Федерация, г. Москва, ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1</p>
<p><strong>Склад:</strong> Московская обл., Домодедово, ул. Заборье, 2д, стр. 10</p>
<p><strong>Телефон:</strong> +7 800 707-04-71, +7 (499) 504-41-63</p>`,
        departments: [
          { name: "Отдел продаж", extension: "100" },
          { name: "Финансовый отдел", extension: "101" },
          { name: "Техническая поддержка", extension: "102" },
        ],
      },
      status: "published",
    });

    // --- Page Dealers ---
    await strapi.documents("api::page-dealers.page-dealers").create({
      data: {
        Intro_Text: "Ищем представителей и дилеров по всей России. Для информации звоните по телефону 8 800 707-04-71, добавочный номер (102).",
      },
      status: "published",
    });

    // --- Dealers ---
    const dealersData = [
      { Title: "УРАЛСТРОЙПАРТНЕР", City: "Челябинск", Phone: "8 (351) 700-74-44", Email: "uralstroypartner@mail.ru", Coordinates: { lat: 55.1644, lng: 61.4368 } },
      { Title: "Склад", City: "Москва", Phone: "+7 (495) 240-83-05", Email: "asfalt@novtecas.ru", Coordinates: { lat: 55.7558, lng: 37.6173 } },
      { Title: 'ООО "Строительная Помощь"', City: "Н. Новгород", Phone: "(831) 415-55-59, +7 951 918-9132", Email: "help-2009@mail.ru", Coordinates: { lat: 56.2965, lng: 43.9361 } },
      { Title: "Новая Хатка", City: "Минск", Phone: "8 (017) 227-05-21, 8 (044) 743-51-22", Email: "tc_2010@list.ru", Coordinates: { lat: 53.9006, lng: 27.559 } },
      { Title: "ТЕРМ СТРОЙ ИНВЕСТ", City: "Минск", Phone: "", Email: "liv-ik@mail.ru", Coordinates: { lat: 53.9006, lng: 27.559 } },
      { Title: "ВМК", City: "Владимир", Phone: "8 (4922) 44-03-03, 44-12-12, 54-59-23", Email: "v_26@rambler.ru", Coordinates: { lat: 56.1291, lng: 40.4069 } },
      { Title: "СТРОЙ РЕМ ГАРАНТ / ИП Лаптев", City: "Киров", Phone: "8 (8332) 74-61-09, 8 (964) 256-61-09", Email: "srg43@mail.ru", Coordinates: { lat: 58.6036, lng: 49.668 } },
      { Title: "ИП Козлова Д.А. (Строймат)", City: "Саратов", Phone: "8 (904) 24-40-700", Email: "elena.bsm2009@mail.ru", Coordinates: { lat: 51.5336, lng: 46.0343 } },
      { Title: 'ООО "ТИТ"', City: "Саратов", Phone: "+7 937 802-50-34", Email: "shyrypov1@mail.ru", Coordinates: { lat: 51.5336, lng: 46.0343 } },
      { Title: 'ООО "Бизон бизнес"', City: "Ульяновск", Phone: "8 (8422) 97-44-00", Email: "bizonbiznes@mail.ru", Coordinates: { lat: 54.3187, lng: 48.3978 } },
      { Title: 'ООО "ТОРУС"', City: "Санкт-Петербург", Phone: "8 (913) 200-88-10, 8 (999) 463-45-13", Email: "112@torus.spb.ru", Coordinates: { lat: 59.9343, lng: 30.3351 } },
      { Title: 'ООО "Мирков"', City: "СЗФО", Phone: "", Email: "mirronova@mail.ru", Coordinates: { lat: 59.9343, lng: 30.3351 } },
      { Title: 'Группа компаний "Проф.Ком"', City: "Мурманск", Phone: "", Email: "reklama@prof-kom.ru", Coordinates: { lat: 68.9585, lng: 33.0827 } },
      { Title: "Иновация Маркет", City: "Татарстан", Phone: "8 (917) 260-29-89", Email: "inn-market@mail.ru", Coordinates: { lat: 55.7887, lng: 49.1221 } },
      { Title: 'ООО "Велес"', City: "Татарстан", Phone: "", Email: "oooveles2010@gmail.com", Coordinates: { lat: 55.7887, lng: 49.1221 } },
      { Title: "ТК БАХМАЧ", City: "Набережные Челны", Phone: "8 (8552) 36-90-91, 36-90-92, 8 (951) 896-47-24, 8 (952) 037-97-47", Email: "bahmach08@mail.ru", Coordinates: { lat: 55.7431, lng: 52.3954 } },
      { Title: 'ООО "ЭкспортНефтеСнаб"', City: "Уфа", Phone: "8 (905) 35-35-006", Email: "natalirmal@mail.ru", Coordinates: { lat: 54.7388, lng: 55.9721 } },
      { Title: 'ООО "Стройторг"', City: "Красноярск", Phone: "+7 391 2-051-051, +7 391 276-81-47, +7 953 585-42-42", Email: "st-124@mail.ru", Coordinates: { lat: 56.0153, lng: 92.8932 } },
      { Title: "ТЕХНО-СТИЛ", City: "Ижевск", Phone: "", Email: "technosteel59@gmail.com", Coordinates: { lat: 56.8527, lng: 53.2114 } },
      { Title: "Агреман", City: "Ярославль", Phone: "+7 (915) 988-80-25, +7 (980) 700-06-38, +7 (4852) 48-11-60 (доб. 803)", Email: "belkova@agreman.ru", Coordinates: { lat: 57.6261, lng: 39.8845 } },
      { Title: "Строймат (ББК-Строй)", City: "Воронеж", Phone: "8 (900) 950-07-14, 8 (900) 950-14-45", Email: "bbk-stroi@yandex.ru", Coordinates: { lat: 51.6755, lng: 39.2089 } },
      { Title: 'ООО "ББК-Строй"', City: "Воронеж", Phone: "8 (920) 450-32-15", Email: "bbk-stroi@yandex.ru", Coordinates: { lat: 51.6755, lng: 39.2089 } },
      { Title: 'ООО "СПЕЦОМ"', City: "Краснодар", Phone: "8 (917) 127-43-00", Email: "specom163@yandex.ru", Coordinates: { lat: 45.0355, lng: 38.975 } },
      { Title: 'ООО "ТОРУС"', City: "Новосибирск", Phone: "", Coordinates: { lat: 55.0084, lng: 82.9357 } },
      { Title: 'ООО "Термотехника"', City: "Тольятти", Phone: "+7 (937) 072-63-22, +7 (927) 209-79-86", Email: "t_tex@bk.ru", Coordinates: { lat: 53.5075, lng: 49.4198 } },
      { Title: "Регион-Снабжение", City: "Калининград", Phone: "8 (906) 213-01-23, 8 (401) 257-99-72", Email: "fg@region-snab.com", Coordinates: { lat: 54.7104, lng: 20.4522 } },
      { Title: 'ООО "ФОРТЕЦИЯ"', City: "Калининград", Phone: "8 (4012) 70-25-70", Email: "brit@baltneft.info", Coordinates: { lat: 54.7104, lng: 20.4522 } },
      { Title: 'ООО "МДА-КОМПЛЕКТ"', City: "Омск", Phone: "8 (965) 982-86-07", Email: "cool.marukov@mail.ru", Coordinates: { lat: 54.9885, lng: 73.3242 } },
      { Title: 'ООО "Герметик-УНИВЕРСАЛ"', City: "Пенза", Phone: "(8412) 30-66-38, 8 (903) 323-66-38", Email: "Germetik58@mail.ru", Coordinates: { lat: 53.1959, lng: 45.0183 } },
      { Title: "БОРА", City: "Ростов-на-Дону", Phone: "8 (918) 555-61-86, +7 929 816-61-73", Email: "bora_reg@mail.ru", Coordinates: { lat: 47.2357, lng: 39.7015 } },
      { Title: "ЭНС ЭкспортНефтеСнаб", City: "Оренбург", Phone: "8 (905) 35-35-006", Email: "natalirmal@mail.ru", Coordinates: { lat: 51.7682, lng: 55.0969 } },
      { Title: "СтройРесурс", City: "Курск", Phone: "8 (961) 190-58-85", Email: "polivoda@stroyresurs46.ru", Coordinates: { lat: 51.7373, lng: 36.1874 } },
      { Title: "СтройРесурс", City: "Белгород", Phone: "8 (961) 190-58-85", Email: "polivoda@stroyresurs46.ru", Coordinates: { lat: 50.5997, lng: 36.5876 } },
      { Title: 'ООО "СПЕЦОМ"', City: "Волгоград", Phone: "8 (917) 127-43-00", Email: "specom163@yandex.ru", Coordinates: { lat: 48.7194, lng: 44.5018 } },
      { Title: 'ООО "СПЕЦОМ"', City: "Астрахань", Phone: "8 (917) 127-43-00", Email: "specom163@yandex.ru", Coordinates: { lat: 46.3497, lng: 48.0408 } },
      { Title: "ИП Пеньков / Эренс", City: "Орел", Phone: "8 (4862) 47-65-65, 75-07-11, 71-48-01 (2,3,4)", Email: "eklevtcova@57.leso-torg.ru", Coordinates: { lat: 52.9651, lng: 36.0785 } },
      { Title: "RemontDoma / ИП Николаевский", City: "Смоленск", Phone: "8 (920) 310-10-36", Email: "al@rd24.net", Coordinates: { lat: 54.7903, lng: 32.0503 } },
    ];

    for (const d of dealersData) {
      await strapi.documents("api::dealer.dealer").create({
        data: { ...d, isActive: true },
        status: "published",
      });
    }

    // --- Portfolio Items ---
    const portfolioData: Array<{
      Title: string; Slug: string; Short_Text: string; Date: string;
      Full_Text?: string; previewFile?: string; galleryFiles?: string[];
    }> = [
      { Title: "Холодный асфальт в качестве эксперимента", Slug: "cold-asphalt-experiment", Short_Text: "Экспериментальная укладка холодного асфальта для оценки долговечности покрытия.", Date: "2020-01-15", previewFile: "preview_experiment.jpg" },
      {
        Title: "Укладка холодного асфальта для пос. Ягодный, г. Тольятти", Slug: "pos-yagodnyy-tolyatti",
        Short_Text: "Ремонт дорожного покрытия холодным асфальтом в посёлке Ягодный, Самарская область.", Date: "2019-06-20",
        previewFile: "preview_yagodnyy.jpg",
        galleryFiles: Array.from({ length: 34 }, (_, i) => `yagodnyy_${String(i + 1).padStart(2, "0")}.jpg`),
      },
      {
        Title: "Укладка холодного асфальта для ЦентроБанка, г. Тольятти", Slug: "centrobank-tolyatti",
        Short_Text: "Выполнение работ по ремонту покрытия для отделения Центрального Банка в Тольятти.", Date: "2019-05-10",
        previewFile: "preview_centrobank.jpg",
        galleryFiles: Array.from({ length: 20 }, (_, i) => `centrobank_${String(i + 1).padStart(2, "0")}.jpg`),
      },
      {
        Title: 'Укладка для ООО "Система Комплексной безопасности"', Slug: "skb-tolyatti",
        Short_Text: "Ремонтные работы с использованием холодного асфальта для ООО «Система Комплексной безопасности» в Тольятти.", Date: "2019-03-15",
        Full_Text: `<p>В кратчайшие сроки выполнен заказ компании «Система Комплексной безопасности» в городе Тольятти по восстановлению дорожного покрытия. Для этого использован холодный асфальт, изготовленный с добавлением концентрата Perma Patch.</p>
<p>Перед ремонтом дороги по ул. 40 лет Победы нашими специалистами произведены замеры и выполнены расчёты требуемого количества материала. В результате ремонтно-дорожных работ:</p>
<ul><li>уложена 1 тонна асфальтобетонной смеси высокого качества;</li><li>восстановлено 12,5\u00a0м² дороги;</li><li>открыто движение автотранспорта (сразу по завершении мероприятия).</li></ul>`,
        previewFile: "preview_skb.jpg",
        galleryFiles: Array.from({ length: 6 }, (_, i) => `skb_${String(i + 1).padStart(2, "0")}.jpg`),
      },
      {
        Title: 'Укладка для ООО «Бар», г. Тольятти', Slug: "ooo-bar-tolyatti",
        Short_Text: "Проведение работ по укладке холодного асфальта по заказу ООО «Бар» на объекте в г. Тольятти.", Date: "2019-01-20",
        Full_Text: "<p>Заявка на ремонт въезда, ведущего на открытую площадку второго этажа ДКИТ по улице Юбилейной\u00a08, поступила от компании «Бар» около недели назад. Возможности нашей фирмы позволяют выполнять более объёмные и трудоёмкие заказы, поэтому асфальтирование въезда не представляло сложности\u00a0— мы позаботились не только о работах, но и доставке асфальта. Мы подошли к выполнению задания с максимальной ответственностью, работали аккуратно и скрупулёзно, благодаря чему клиент остался доволен новым покрытием из холодного асфальта.</p>",
        previewFile: "preview_bar.jpg",
      },
      {
        Title: "Укладка для муниципальной службы г. Сызрани", Slug: "municipal-syzran",
        Short_Text: "Поставка и укладка холодного асфальта для муниципальных нужд г. Сызрани.", Date: "2018-09-01",
        Full_Text: "<p>28.02.2014 наша компания проводила презентацию укладки холодного асфальта для муниципальной службы г.\u00a0Сызрани по дорожному обслуживанию.</p>",
        previewFile: "preview_syzran.jpg",
        galleryFiles: Array.from({ length: 2 }, (_, i) => `syzran_${String(i + 1).padStart(2, "0")}.jpg`),
      },
      {
        Title: "Ремонт ж/д переезда для ЗАО «ППЖТ», г. Тольятти", Slug: "ppzht-tolyatti-railway",
        Short_Text: "Экстренный ремонт железнодорожного переезда с использованием холодного асфальта Perma Patch.", Date: "2018-07-20",
        Full_Text: "<p>1.07.2014\u00a0г. наша компания произвела ремонт железнодорожного переезда для ЗАО «Предприятие промышленного железнодорожного транспорта» г.\u00a0Тольятти.</p>",
        previewFile: "preview_ppzht.jpg",
        galleryFiles: Array.from({ length: 5 }, (_, i) => `ppzht_${String(i + 1).padStart(2, "0")}.jpg`),
      },
      { Title: "Гидроизоляция резервуаров нефтеналивных терминалов", Slug: "hydroisolation-oil-terminals", Short_Text: "Изготовление 3000 тонн холодного асфальта для гидроизоляции резервуаров на нефтеналивных терминалах.", Date: "2018-04-10", previewFile: "preview_hydroisolation.jpg" },
    ];

    for (const p of portfolioData) {
      const { galleryFiles, previewFile, ...portfolioFields } = p;
      const [previewId, galleryIds] = await Promise.all([
        previewFile ? uploadSeedFile(strapi, previewFile, portfolioFields.Title) : Promise.resolve(null),
        galleryFiles ? uploadSeedGallery(strapi, galleryFiles, portfolioFields.Title) : Promise.resolve([]),
      ]);

      await strapi.documents("api::portfolio-item.portfolio-item").create({
        data: {
          ...portfolioFields,
          ...(previewId ? { Image_Preview: previewId } : {}),
          ...(galleryIds.length ? { Gallery: galleryIds } : {}),
        },
        status: "published",
      });
    }

    // --- Media Items (articles) ---
    const yamochnyyRemontStepImages = {
      step1: await uploadSeedFileWithMeta(strapi, "article-yamochnyy-step1.png", "Очистить поверхность"),
      step2: await uploadSeedFileWithMeta(strapi, "article-yamochnyy-step2.png", "Засыпать холодный асфальт"),
      step3: await uploadSeedFileWithMeta(strapi, "article-yamochnyy-step3.png", "Распределить асфальт"),
      step4: await uploadSeedFileWithMeta(strapi, "article-yamochnyy-step4.png", "Утрамбовать асфальт"),
      arrow: await uploadSeedFileWithMeta(strapi, "article-yamochnyy-arrow.png", "Стрелка"),
      banner: await uploadSeedFileWithMeta(strapi, "article-yamochnyy-banner.jpg", "Ямочный ремонт"),
      remontDorog: await uploadSeedFileWithMeta(strapi, "article-yamochnyy-remont-dorog.jpg", "Ремонт дорог"),
    };

    const yamochnyyRemontFullText = `<p>Качество автомобильных магистралей и дорог местного назначения напрямую влияет на безопасность водителей и пассажиров. От состояния асфальта и оперативности ремонта зависит не только безопасность движения, но и плотность потока, расход топлива и износ автотранспорта.</p>
<p>Ямочный ремонт асфальтового покрытия является наиболее быстро реализуемым способом устранить дефекты, не дожидаясь капремонта.</p>
<p>Компания NovTecAs выполняет ямочный ремонт дорог с использованием современных материалов и технологий. Активно используются компанией холодные асфальтные смеси. Кроме того, компания готова выполнить капитальный ремонт дорожного полотна любой сложности.</p>
${yamochnyyRemontStepImages.banner ? `<p><img src="${yamochnyyRemontStepImages.banner.url}" alt="Ямочный ремонт дороги" /></p>` : ""}
<h2>Основные методы ямочного ремонта</h2>
<p>Компания NovTecAs выполняет ямочный ремонт с использованием различных технологий и современного оборудования. При выполнении асфальтирования учитываются текущие погодные условия, хотя новейшие способы выполнения работ позволяют выполнять восстановление дорожного покрытия в любое время года при любой температуре.</p>
<p>Текущий ремонт магистралей и дорог возможен как полным асфальтированием, так и заделкой ям, трещин и выбоин. Дорожные работы выполняются с использованием следующих материалов:</p>
<ul>
<li>Применение горячего асфальта.</li>
<li>Использование холодных асфальтовых смесей.</li>
<li>Нанесение слоя литого асфальтобетонного покрытия.</li>
<li>Ремонт полотна инфракрасным методом.</li>
<li>Литье текучей смесью.</li>
<li>Струйно-инъекционный (инжекторный) метод.</li>
</ul>
${yamochnyyRemontStepImages.step1 ? `<p style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:16px;">
<span style="text-align:center"><img src="${yamochnyyRemontStepImages.step1.url}" alt="Очистить поверхность" /><br/>Очистить поверхность от движущихся частей</span>
<span style="text-align:center"><img src="${yamochnyyRemontStepImages.step2.url}" alt="Засыпать холодный асфальт" /><br/>Засыпать горку холодного асфальта</span>
<span style="text-align:center"><img src="${yamochnyyRemontStepImages.step3.url}" alt="Распределить асфальт" /><br/>Распределить асфальт по всей поверхности</span>
<span style="text-align:center"><img src="${yamochnyyRemontStepImages.step4.url}" alt="Утрамбовать асфальт" /><br/>Утрамбовать асфальт</span>
</p>` : ""}
<h2>Технология восстановления покрытия струйно-инъекционным способом</h2>
<p>Каждая из технологий имеет определенные преимущества и недостатки и применяется в определенных условиях. Компания NovTecAs специализируется на ямочном ремонте и имеет в наличии полный ассортимент горячего и холодного асфальтобетона, герметиков и дополнительных материалов. Ремонт покрытий выполняется с соблюдением всех нормативных документов и соответствует высоким стандартам качества.</p>
<p>Предпочтительная технология и материал должны соответствовать ряду критериев:</p>
<ul>
<li>Соответствие свойств поверхностей готовой заплаты и основного покрытия.</li>
<li>Соответствие прочности асфальтобетонной смеси эксплуатационным нагрузкам на ремонтируемом участке.</li>
<li>Наличие и доступность материалов и технических средств для выполнения ремонта дорог.</li>
<li>Требования материала к погодным условиям во время ремонта.</li>
<li>Оперативности возобновления транспортного движения по завершении работы и общая скорость их выполнения.</li>
<li>Экономические особенности того или иного метода выполнения работ.</li>
</ul>
<h2>Цены на услуги по асфальтированию и ямочному ремонту</h2>
<table>
<thead><tr><th>Услуга</th><th>Цена</th></tr></thead>
<tbody>
<tr><td>Ямочный ремонт</td><td>от 700 руб./м²</td></tr>
<tr><td>Асфальтирование дорог</td><td>от 1250 руб./м²</td></tr>
<tr><td>Капитальный ремонт полотна</td><td>от 700 руб./м²</td></tr>
</tbody>
</table>
<h2>Типы холодных смесей для ямочного ремонта</h2>
<p>Ямочный ремонт асфальтового покрытия с использованием холодных материалов может выполняться в течение всего года. При этом используемые материалы могут быть трех видов. Возможно использование смеси быстрого использования, в состав которой входит специальная эмульсия. Кроме того, используются асфальтобетонные материалы эмульсионно-минерального типа, а также пакетируемые органические смеси, содержащие минеральные компоненты.</p>
<p>В состав холодной смеси входит стандартный асфальт, выполненный по специальной технологии. В состав материала входят присадки и специальный битум. Процентное содержание этого компонента варьируется в пределах от 4,2 до 4,5 процента. Такой состав позволяет получить асфальтобетон с параметрами, намного превышающими традиционные.</p>
<p>Существует несколько типов холодных асфальтобетонных смесей:</p>
<ol>
<li>С эмульсией для немедленного применения. Как правило, применяются при ремонтировании инжекторным методом. Порция подготовленного состава помещается в танк агрегата перед началом смены.</li>
<li>Эмульсионные составы с минеральными добавками.</li>
<li>Фасованная складируемая органоминеральная смесь. В упакованном виде она может храниться до 8 месяцев и сохранять свои свойства после нарушения упаковки до двух месяцев.</li>
</ol>
<h2>Этапы работ</h2>
<p>Ямочный ремонт выполняется с разделкой существующего слоя либо без нее. В первом случае необходимо удалить старое покрытие, пришедшее в негодность. При выполнении работ соблюдается следующая технология:</p>
<ul>
<li>В первую очередь монтируются временные знаки для перекрытия движения транспорта по ремонтируемому участку.</li>
<li>Удаляются все загрязняющие элементы, а также лед, снег и пыль.</li>
<li>Места, подлежащие реставрации, размечаются. После чего составляется карта ремонта.</li>
<li>Используя специальные дорожные фрезы, выполняется нарезка контуров дефектных участков дороги.</li>
<li>Поверхность полученных контуров очищается от грязи и мусора.</li>
<li>Стены и дно выбоин разогреваются газовым оборудованием и обрабатываются специальным составом на основе органических веществ (битумной эмульсией).</li>
<li>Холодная асфальтовая масса укладывается в выбоину слоями, с обязательным трамбованием каждого слоя при помощи спецтехники.</li>
<li>Контроль качества ремонта каждой ямы.</li>
<li>Складирование мусора и вывоз его за пределы ремонтируемой полосы, а также восстановление движения.</li>
</ul>
<h2>Преимущества и недостатки технологии применения холодных смесей</h2>
<p>При использовании горячего асфальта, его выработка должна производиться в сжатые сроки. При этом используется специальная техника. Холодные смеси сохраняют свои характеристики при хранении открытым способом на протяжении двух месяцев. В упаковке материал можно складировать в течение 8 месяцев.</p>
<p>Цена на ямочный ремонт с использованием холодных материалов оказывается ниже стоимости работ с использованием горячего асфальта. Модифицированный битум и специальные присадки расширяют диапазон климатических условий, позволяя асфальтировать при температуре до -10ºС. Более того, фасованная органоминеральная смесь:</p>
<ul>
<li>Не требует специальной техники (кроме газовой горелки для разогрева поверхности);</li>
<li>Может укладываться в выбоины без предварительной разделки;</li>
<li>Отсутствие специальных требований к транспортировке;</li>
<li>Не требует особой квалификации рабочей силы.</li>
</ul>
<p>С другой стороны уложенная и утрамбованная органоминеральная смесь отличается низким сопротивлением сдвигу, что не позволяет укладывать её в местах торможения транспорта. Совокупность цены и качеств материала характеризует его как средство для оперативного устранения выбоин, когда наступает зима, то есть вне традиционного сезона дорожного строительства и средства предотвращения увеличения повреждений в зимний период.</p>
<p>Инжекторный или струйно-инъекционный метод – частный случай работы с холодным асфальтобетонными смесями. Соответствующие установки (к примеру, УЯР-1 или зарубежные аналоги) позволяют оперативно выполнять восстановление небольших и средних повреждений дорог даже без разделки. Единственный агрегат выполняет все подготовительные и основные этапы ремонта, а дополнительное уплотнение не требуется ввиду нанесения материала под давлением.</p>
${yamochnyyRemontStepImages.remontDorog ? `<p><img src="${yamochnyyRemontStepImages.remontDorog.url}" alt="Ремонт дорог" /></p>` : ""}
<h2>Преимущества и недостатки технологии асфальтирования горячих смесей</h2>
<p>Горячие асфальтобетонные смеси могут быть сыпучими или текучими. Укладка разогретого материала обеспечивает его повышенную адгезию к основанию.</p>
<p>Асфальт для литья имеет тестообразную консистенцию и заполняет неровности основания под действием гравитации. Кроме того, литой асфальт не требует механического уплотнения, поскольку приобретает необходимую плотность в процессе остывания. С другой стороны такой материал размягчается в жаркое время года, что приводит к образованию колеи.</p>
<p>Сыпучие горячие смеси битума с заполнителем определенной фракции и типа (песок, щебень) обладают своими достоинствами. Прежде всего, недорогой транспортировкой. Вместе с тем технология укладки сыпучих горячих составов подразумевает использование вибротрамбующих ручных агрегатов или массивных катков, что усложняет технологический процесс и увеличивает расход времени на выполнение работ.</p>
<h2>Контроль качества ямочного ремонта</h2>
<p>После выполнения ямочного ремонта дорожного покрытия производится визуальный и инструментальный контроль качества (ГОСТ 310515, СНиП 3.06.03 и другие) заплаты по следующим параметрам:</p>
<ul>
<li>Прочности;</li>
<li>Толщины покрытия;</li>
<li>Наличие дефектов (просадки и прочие);</li>
<li>Плоскости;</li>
<li>Шероховатости полотна.</li>
</ul>
<p>Результаты проведения контроля сверяются с нормативной документацией, и на основе сравнения определяется качество выполнения работ.</p>`;

    const articlesData = [
      {
        Title: "Ямочный ремонт асфальтового покрытия",
        Slug: "yamochnyy-remont-asfaltovogo-pokrytiya",
        Type: "article" as const,
        Date: "2019-03-26",
        Short_Text: "Требования к состоянию покрытия автомобильных дорог четко прописаны в соответствующих нормативных документах (ГОСТ Р 50597-93, СНиП 2.07.01 и другие). Однако в них не учитывается стремительный рост количества транспортных средств и соответствующее увеличение нагрузки на дорожное покрытие. Вместе с прогрессом технологии растет и количество материалов и технологий для ремонта дорог.",
        Full_Text: yamochnyyRemontFullText,
        previewImage: "article-yamochnyy-remont-pokrytiya-preview.jpg",
      },
      {
        Title: "Асфальтовая крошка, технология укладки, применение",
        Slug: "asfaltovaya-kroshka-tekhnologiya-ukladki-primenenie",
        Type: "article" as const,
        Date: "2018-04-09",
        Short_Text: "Асфальтовая крошка – это вторичное сырье, находящее применение в сфере дорожного строительства и ряде других областей.",
        Full_Text: `<p>Асфальтовая крошка – это вторичное сырье, находящее применение в сфере дорожного строительства и ряде других областей.</p>`,
        previewImage: "article-asfaltovaya-kroshka-preview.jpg",
      },
      {
        Title: "Дорожные асфальтобетонные смеси: особенности и состав материала",
        Slug: "dorozhnye-asfaltobetonnye-smesi-osobennosti-i-sostav",
        Type: "article" as const,
        Date: "2018-03-27",
        Short_Text: "Асфальтобетонной смесью называется специализированный материал, в основе которого лежит бетонный состав из минеральных компонентов различного размера и органический вяжущий компонент. Данный тип смесей используется для строительства дорожного полотна.",
        Full_Text: `<p>Асфальтобетонной смесью называется специализированный материал, в основе которого лежит бетонный состав из минеральных компонентов различного размера и органический вяжущий компонент. Данный тип смесей используется для строительства дорожного полотна.</p>`,
        previewImage: "article-asfaltobetonnye-smesi-preview.jpg",
      },
      {
        Title: "Битумно-полимерная мастика: характеристики, применение",
        Slug: "bitumno-polimernaya-mastika-kharakteristiki",
        Type: "article" as const,
        Date: "2018-03-15",
        Short_Text: "Битум – материал, широко используемый для изоляционных работ, от гидроизоляции плоских кровель, до гидроизоляции бетонных фундаментов. Являясь продуктом нефтепереработки, битум после нанесения обеспечивает отличную герметизацию стыков и щелей, хорошо проникая в мелкие поры материала. Недостатком битума, как самостоятельного материала является необходимость работы с ним в разогретом состоянии.",
        Full_Text: `<p>Битум – материал, широко используемый для изоляционных работ, от гидроизоляции плоских кровель, до гидроизоляции бетонных фундаментов. Являясь продуктом нефтепереработки, битум после нанесения обеспечивает отличную герметизацию стыков и щелей, хорошо проникая в мелкие поры материала. Недостатком битума, как самостоятельного материала является необходимость работы с ним в разогретом состоянии.</p>`,
        previewImage: "article-bitumnaya-mastika-preview.jpg",
      },
      {
        Title: "Холодный асфальт",
        Slug: "kholodnyy-asfalt",
        Type: "article" as const,
        Date: "2017-01-26",
        Short_Text: "Материалы для строительства, ремонта и обслуживания асфальтированных поверхностей, реализуемые компанией «Новые Технологии Асфальта — NovTecAs», позволяют получить качественное дорожное покрытие при минимальных затратах времени и средств.",
        Full_Text: `<p>Материалы для строительства, ремонта и обслуживания асфальтированных поверхностей, реализуемые компанией «Новые Технологии Асфальта — NovTecAs», позволяют получить качественное дорожное покрытие при минимальных затратах времени и средств.</p>`,
        previewImage: "article-kholodnyy-asfalt-preview.jpg",
      },
      {
        Title: "Как влияет расход асфальта на качество укладки",
        Slug: "kak-vliyaet-raskhod-asfalta-na-kachestvo-ukladki",
        Type: "article" as const,
        Date: "2016-10-31",
        Short_Text: "Рассматривая качество укладки холодного асфальта кто то начинает сравнивать с горячим асфальтом и это правильно потому, что по составу они одинаковы за исключение разбавителя битума.",
        Full_Text: `<p>Рассматривая качество укладки холодного асфальта кто то начинает сравнивать с горячим асфальтом и это правильно потому, что по составу они одинаковы за исключение разбавителя битума.</p>`,
        previewImage: "article-kak-vliyaet-raskhod-preview.jpg",
      },
      {
        Title: "Ямочный ремонт асфальта",
        Slug: "yamochnyy-remont",
        Type: "article" as const,
        Date: "2016-01-25",
        Short_Text: "Качество автомобильных магистралей и дорог местного назначения напрямую влияет на безопасность водителей и пассажиров.",
        Full_Text: yamochnyyRemontFullText,
        previewImage: "article-yamochnyy-remont-preview.jpg",
      },
      {
        Title: "Асфальт фасованный",
        Slug: "asfalt-v-meshkakh-i-vedrakh",
        Type: "article" as const,
        Date: "2016-01-22",
        Short_Text: "Компания Новые Технологии Асфальта (NovTecAs) предлагает купить в Москве асфальт в мешках, ведрах, биг-бегах и другой фасовке по привлекательной цене и в любых количествах.",
        Full_Text: `<p>Компания Новые Технологии Асфальта (NovTecAs) предлагает купить в Москве асфальт в мешках, ведрах, биг-бегах и другой фасовке по привлекательной цене и в любых количествах.</p>`,
        previewImage: "article-asfalt-fasovannyy-preview.jpg",
      },
    ];

    for (const { previewImage, ...articleData } of articlesData) {
      const previewId = await uploadSeedFile(strapi, previewImage, articleData.Title);
      await strapi.documents("api::media-item.media-item").create({
        data: {
          ...articleData,
          ...(previewId ? { Image_Preview: previewId } : {}),
        },
        status: "published",
      });
    }

    // --- Page (Privacy) ---
    await strapi.documents("api::page.page").create({
      data: {
        title: "Политика в отношении обработки персональных данных",
        slug: "privacy",
        content: `<h2>1. Общие положения</h2>
<p>1.1. Политика в отношении обработки персональных данных (далее — Политика) направлена на защиту прав и свобод физических лиц, персональные данные которых обрабатывает Общество с ограниченной ответственностью «Новые технологии асфальта» (далее — Оператор).</p>
<p>1.2. Политика разработана в соответствии с п. 2 ч. 1 ст. 18.1 Федерального закона от 27 июля 2006 г. № 152-ФЗ «О персональных данных» (далее — ФЗ «О персональных данных»).</p>
<p>1.3. Политика содержит сведения, подлежащие раскрытию в соответствии с ч. 1 ст. 14 ФЗ «О персональных данных», и является общедоступным документом.</p>

<h2>2. Сведения об операторе</h2>
<p>2.1. Оператор ведёт свою деятельность по адресу: 119180, Российская Федерация, Москва, ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1.</p>

<h2>3. Сведения об обработке персональных данных</h2>
<p>3.1. Оператор обрабатывает персональные данные на законной и справедливой основе для выполнения возложенных законодательством функций, полномочий и обязанностей.</p>
<p>3.2. Оператор получает персональные данные непосредственно у субъектов персональных данных.</p>
<p>3.3. Оператор обрабатывает персональные данные автоматизированным и неавтоматизированным способами.</p>
<p>3.4. Действия по обработке персональных данных включают сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передачу, обезличивание, блокирование, удаление и уничтожение.</p>

<h2>4. Обработка персональных данных клиентов</h2>
<p>4.1. Оператор обрабатывает персональные данные клиентов в целях: информирования о новых услугах и товарах; обработки заявок от посетителей сайта; заключения и исполнения условий договора.</p>
<p>4.2. Оператор обрабатывает следующие персональные данные клиентов: фамилия, имя, отчество; дата рождения; адрес; номер контактного телефона; адрес электронной почты.</p>

<h2>5. Сведения об обеспечении безопасности персональных данных</h2>
<p>5.1. Оператор применяет комплекс правовых, организационных и технических мер по обеспечению безопасности персональных данных для обеспечения конфиденциальности персональных данных и их защиты от неправомерных действий.</p>

<h2>6. Права субъектов персональных данных</h2>
<p>6.1. Субъект персональных данных имеет право: на получение персональных данных, относящихся к данному субъекту; на уточнение, блокирование или уничтожение его персональных данных; на отзыв данного им согласия на обработку персональных данных; на защиту своих прав и законных интересов.</p>
<p>6.2. Для реализации своих прав и законных интересов субъекты персональных данных имеют право обратиться к Оператору либо направить запрос лично или с помощью представителя.</p>`,
      },
      status: "published",
    });

    // --- Home Page ---
    const applicationAreasData = [
      { title: "Ремонт дорожных ям", description: "Асфальт с использованием концентрата – отличный выбор при необходимости отремонтировать выбоины и ямы на любых типах дорог в кратчайшие сроки.", imageFile: "area-1.jpg" },
      { title: "Ликвидация колейности", description: "Асфальт марки Perma Patch используют федеральные и региональные органы, а также частные компании для решения проблемы колейности.", imageFile: "area-2.jpg" },
      { title: "Укрытие коммуникаций", description: "Асфальт Perma Patch хорошо подойдет, если нужно покрыть коммуникационные каналы на дорогах.", imageFile: "area-3.jpg" },
      { title: "Укладка стоков", description: "Для укладки зон вокруг люков и водоотводов перманентно используется холодный асфальт.", imageFile: "area-4.jpg" },
      { title: "Ремонт аэропортов и ВПП", description: "Холодный асфальт – наиболее быстрый и бюджетный способ в любое время года вернуть функциональность взлетно-посадочным полосам и стоянкам бортов, а также отремонтировать пути к аэропорту.", imageFile: "area-5.jpg" },
      { title: "Защита крыш", description: "На плоских крышах нежилых помещений холодный асфальт используется как дополнительный слой, защищающий от негативного воздействия воды и снега.", imageFile: "area-6.jpg" },
      { title: "Обновление переездов", description: "Данный тип концентрата подходит для экстренного и долговечного ремонта ж/д переездов любой степени поврежденности.", imageFile: "area-7.jpg" },
      { title: "Защитный слой в нефтехранилищах", description: "Perma Patch может быть использован в качестве изолирующего материала для резервуаров и хранилищ нефтепродуктов в терминалах.", imageFile: "area-8.jpg" },
      { title: "Асфальтирование дорожного полотна", description: "Холодный асфальт данной марки подходит для основного покрытия дорожных полотен 2 и 3 категории.", imageFile: "area-9.jpg" },
      { title: "Асфальтирование при низких температурах", description: "Покрытие способно уплотняться даже при -27°С, сохраняя подвижность и качество материала.", imageFile: "area-10.jpg" },
    ];

    const applicationAreas: { title: string; description: string; image?: number }[] = [];
    for (const area of applicationAreasData) {
      const imageId = await uploadSeedFile(strapi, area.imageFile, area.title);
      applicationAreas.push({
        title: area.title,
        description: area.description,
        ...(imageId ? { image: imageId } : {}),
      });
    }

    await strapi.documents("api::home-page.home-page").create({
      data: {
        heroTitle: "Производство и продажа\nдорожных покрытий",
        heroSubtitle: "<p>Холодный асфальт в мешках от производителя</p>",
        aboutTitle: "О компании",
        aboutText: "<p><strong>«Новые Технологии Асфальта – NovTecAs»</strong> специализируется на реализации холодного асфальта для ремонта дорожных покрытий.</p><p class=\"mt-4\">В основе продукта — концентрат <strong>Perma Patch</strong> от <strong>McAsphalt Industries Limited (Канада)</strong>, который зарекомендовал себя как эффективное решение для быстрого и удобного ямочного ремонта</p>.",
        aboutCtaLabel: "Подробнее о компании",
        aboutCtaHref: "/about",
        advantagesTitle: "Преимущества компании",
        advantages: [
          { title: "Собственное производство", iconKey: "Factory" },
          { title: "Собственные склады", iconKey: "Warehouse" },
          { title: "Точная дозация компонентов", iconKey: "Target" },
          { title: "Канадская технология Perma Patch", iconKey: "MapleLeaf" },
          { title: "Полная сертификация продукции", iconKey: "FileCheck" },
          { title: "Доставка по всей России (авто и ж/д)", iconKey: "Truck" },
        ],
        applicationAreasTitle: "Области применения холодного асфальта",
        applicationAreas,
        productsTitle: "Продукция",
        productsSubtitle: "<p>Холодный и сухой асфальт от производителя — высокое качество, точная дозация компонентов, доставка по всей России</p>",
        productsCtaLabel: "Вся продукция",
        productsCtaHref: "/products",
        dealersTitle: "Ищем дилеров",
        dealersText: "<p>Приглашаем к сотрудничеству дилеров по всей России. Выгодные условия, маркетинговая поддержка, обучение.</p>",
        dealersPhone: "8 (800) 707-04-71",
        dealersCtaLabel: "Подать заявку на дилерство",
      },
    });

    // --- Documents (certificates) ---
    const documentsData = [
      {
        Title: "Сертификат соответствия Perma Patch",
        Category: "Холодный асфальт",
        imageFile: "doc-cert-perma-patch.jpg",
        sortOrder: 1,
      },
      {
        Title: 'Разрешение на использование знака соответствия системы сертификации "ГК-СТАНДАРТ"',
        Category: "Холодный асфальт",
        imageFile: "doc-gk-standart.jpg",
        sortOrder: 2,
      },
      {
        Title: "Сертификат соответствия производства холодных асфальтобетонных смесей PermaPatch Тип Бх и Гх, PermaPatch COLOR, PermaPatch АэРос",
        Category: "Холодный асфальт",
        imageFile: "doc-cert-permapatch-bx-gx.jpg",
        sortOrder: 3,
      },
      {
        Title: "Паспорт качества",
        Category: "Холодный асфальт",
        imageFile: "doc-passport-kachestva.jpg",
        sortOrder: 4,
      },
      {
        Title: 'Сертификат соответствия на "Битумную добавку Evotherm"',
        Category: "Теплый асфальт",
        imageFile: "doc-cert-evotherm.jpg",
        sortOrder: 5,
      },
    ];

    for (const doc of documentsData) {
      const { imageFile, ...docData } = doc;
      const previewId = await uploadSeedFile(strapi, imageFile, docData.Title);

      await strapi.documents("api::document.document").create({
        data: {
          ...docData,
          ...(previewId ? { Preview_Image: previewId, File: previewId } : {}),
        },
        status: "published",
      });
    }

    // --- Site Settings ---
    await strapi.documents("api::site-setting.site-setting").create({
      data: {
        copyright: "Новтекас. Все права защищены.",
        contacts: {
          phones: ["8 (800) 707-04-71", "+7 (499) 504-41-63"],
          emails: ["asfalt@NovTecAs.ru"],
          addresses: [
            "119180, г. Москва, ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1",
            "445021, г. Тольятти, А/Я №3667",
          ],
          workingHours: "08:00–20:00",
        },
      },
    });

    // --- Cities ---
    const citiesData = [
      { name: "Москва", slug: "", domain: "novtecas.ru", namePrepositional: "Москве", nameDative: "Москве", phones: ["+7 (499) 504-41-63"], postalCode: "445045", address: "ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1", warehouseAddress: "", mapLat: 55.7322, mapLng: 37.6209, sortOrder: 100, isDefault: true },
      { name: "Тольятти", slug: "tolyatti", domain: "tolyatti.novtecas.ru", namePrepositional: "Тольятти", nameDative: "Тольятти", phones: ["+7 (848) 265-02-80"], postalCode: "445007", address: "ул. Новозаводская 2а стр. 20", warehouseAddress: "", mapLat: 53.5631, mapLng: 49.4697, sortOrder: 200, isDefault: false },
      { name: "Самара", slug: "samara", domain: "samara.novtecas.ru", namePrepositional: "Самаре", nameDative: "Самаре", phones: ["+7 (987) 818-44-54", "+7 (846) 212-08-78"], postalCode: "443070", address: "Московское шоссе, 41", warehouseAddress: "443070, Российская Федерация, г. Самара, ул. Дзержинского, 48", mapLat: 53.2221, mapLng: 50.1913, sortOrder: 300, isDefault: false },
      { name: "Уфа", slug: "ufa", domain: "ufa.novtecas.ru", namePrepositional: "Уфе", nameDative: "Уфе", phones: ["+7 (905) 35-35-006"], postalCode: "450078", address: "ул. Кирова, 107", warehouseAddress: "г. Уфа ул. Якуба Колоса, 127", mapLat: 54.7264, mapLng: 55.9841, sortOrder: 400, isDefault: false },
      { name: "Пенза", slug: "penza", domain: "penza.novtecas.ru", namePrepositional: "Пензе", nameDative: "Пензе", phones: ["(8412) 30-66-38", "8 (903) 323-66-38"], postalCode: "440000", address: "ул. Загородная, 2Б ООО \"Герметик-УНИВЕРСАЛ\"", warehouseAddress: "", mapLat: 53.169, mapLng: 44.9771, sortOrder: 500, isDefault: false },
      { name: "Воронеж", slug: "voronej", domain: "voronej.novtecas.ru", namePrepositional: "Воронеже", nameDative: "Воронежу", phones: ["+7 (900) 950-07-14", "+7 (900) 950-14-45"], postalCode: "394019", address: "ул. Торпедо, 45А, ООО \"ББК-Строй\"", warehouseAddress: "", mapLat: 51.6832, mapLng: 39.1511, sortOrder: 500, isDefault: false },
      { name: "Смоленск", slug: "smolensk", domain: "smolensk.novtecas.ru", namePrepositional: "Смоленске", nameDative: "Смоленску", phones: ["+7 (481) 251-56-07"], postalCode: "214025", address: "Нормандия-Неман, 35", warehouseAddress: "", mapLat: 54.7791, mapLng: 32.0163, sortOrder: 500, isDefault: false },
      { name: "Калуга", slug: "kaluga", domain: "kaluga.novtecas.ru", namePrepositional: "Калуге", nameDative: "Калуге", phones: ["8 (910) 522-67-89"], postalCode: "248025", address: "Зерновая, 22", warehouseAddress: "", mapLat: 54.5463, mapLng: 36.2941, sortOrder: 500, isDefault: false },
      { name: "Брянск", slug: "bryansk", domain: "bryansk.novtecas.ru", namePrepositional: "Брянске", nameDative: "Брянску", phones: [], postalCode: "241520", address: "Московская, 570", warehouseAddress: "", mapLat: 53.2, mapLng: 34.264, sortOrder: 500, isDefault: false },
      { name: "Орел", slug: "orel", domain: "orel.novtecas.ru", namePrepositional: "Орле", nameDative: "Орлу", phones: ["8 (4862) 47-65-65", "75-07-11", "71-48-01 (2,3,4)"], postalCode: "302042", address: "Кромское шоссе, 4 к2", warehouseAddress: "", mapLat: 52.9216, mapLng: 36.0104, sortOrder: 500, isDefault: false },
      { name: "Тамбов", slug: "tambov", domain: "tambov.novtecas.ru", namePrepositional: "Тамбове", nameDative: "Тамбову", phones: ["+7 (900) 950-07-14", "+7 (900) 950-14-45"], postalCode: "392028", address: "Ипподромная, 6", warehouseAddress: "", mapLat: 52.7354, mapLng: 41.4141, sortOrder: 500, isDefault: false },
      { name: "Липецк", slug: "lipetsk", domain: "lipetsk.novtecas.ru", namePrepositional: "Липецке", nameDative: "Липецку", phones: ["+7 (900) 950-07-14", "+7 (900) 950-14-45"], postalCode: "398006", address: "Краснозаводская, 1", warehouseAddress: "", mapLat: 52.546, mapLng: 39.5767, sortOrder: 500, isDefault: false },
      { name: "Курск", slug: "kursk", domain: "kursk.novtecas.ru", namePrepositional: "Курске", nameDative: "Курску", phones: ["+7 (471) 234-91-63"], postalCode: "305018", address: "Кулакова проспект, 24", warehouseAddress: "", mapLat: 51.6662, mapLng: 36.1404, sortOrder: 500, isDefault: false },
      { name: "Казань", slug: "kazan", domain: "kazan.novtecas.ru", namePrepositional: "Казани", nameDative: "Казани", phones: ["+7 (917) 280-43-13", "+7 (960) 075-00-70"], postalCode: "420140", address: "Городское шоссе 113В ООО \"Нинновация Маркет\"", warehouseAddress: "", mapLat: 55.7722, mapLng: 49.2208, sortOrder: 500, isDefault: false },
      { name: "Нижний Новгород", slug: "nn", domain: "nn.novtecas.ru", namePrepositional: "Нижнем Новгороде", nameDative: "Нижнему Новгороду", phones: ["+7 (951) 918-91-32"], postalCode: "603087", address: "Московское шоссе, д.85, офис 118а", warehouseAddress: "", mapLat: 56.3179, mapLng: 43.918, sortOrder: 500, isDefault: false },
      { name: "Санкт-Петербург", slug: "spb", domain: "spb.novtecas.ru", namePrepositional: "Санкт-Петербурге", nameDative: "Санкт-Петербургу", phones: ["+7 (913) 200-88-10", "+7 (999) 463-45-13", "+7 (812) 209-01-01 (офис)", "+7 (911) 817-90-46"], postalCode: "630027", address: "Тайгинская улица, 5/2", warehouseAddress: "ООО «ТОРУС», Санкт-Петербург, пр. Александровской фермы, 29к.5", mapLat: 55.1084, mapLng: 82.9956, sortOrder: 500, isDefault: false },
      { name: "Омск", slug: "omsk", domain: "omsk.novtecas.ru", namePrepositional: "Омске", nameDative: "Омску", phones: ["8 (965) 982-86-07"], postalCode: "644103", address: "ул. Нефтезаводская 42/1, ООО «МДА-КОМПЛЕКТ»", warehouseAddress: "", mapLat: 55.0533, mapLng: 73.2635, sortOrder: 500, isDefault: false },
      { name: "Томск", slug: "tomsk", domain: "tomsk.novtecas.ru", namePrepositional: "Томске", nameDative: "Томску", phones: [], postalCode: "634012", address: "улица Шевченко, 65", warehouseAddress: "", mapLat: 56.4677, mapLng: 85.0022, sortOrder: 500, isDefault: false },
      { name: "Курган", slug: "kurgan", domain: "kurgan.novtecas.ru", namePrepositional: "Кургане", nameDative: "Кургану", phones: [], postalCode: "640004", address: "улица Земнухова, 3А", warehouseAddress: "", mapLat: 55.4443, mapLng: 65.3076, sortOrder: 500, isDefault: false },
      { name: "Ханты-Мансийск", slug: "khanty-mansiysk", domain: "khanty-mansiysk.novtecas.ru", namePrepositional: "Ханты-Мансийске", nameDative: "Ханты-Мансийску", phones: [], postalCode: "628001", address: "Пристанская улица, 1", warehouseAddress: "", mapLat: 60.9663, mapLng: 69.047, sortOrder: 500, isDefault: false },
      { name: "Новосибирск", slug: "novosibirsk", domain: "novosibirsk.novtecas.ru", namePrepositional: "Новосибирске", nameDative: "Новосибирску", phones: ["+7 (383) 383-29-62"], postalCode: "630027", address: "Тайгинская улица, 5/2", warehouseAddress: "ООО «ТОРУС», 630007, г. Новосибирск, Пристанский переулок, 5, оф. 16", mapLat: 55.1084, mapLng: 82.9956, sortOrder: 500, isDefault: false },
      { name: "Кемерово", slug: "kemerovo", domain: "kemerovo.novtecas.ru", namePrepositional: "Кемерово", nameDative: "Кемерово", phones: [], postalCode: "650000", address: "Советский проспект, 6к2", warehouseAddress: "", mapLat: 55.3614, mapLng: 86.0639, sortOrder: 500, isDefault: false },
      { name: "Красноярск", slug: "krasnoyarsk", domain: "krasnoyarsk.novtecas.ru", namePrepositional: "Красноярске", nameDative: "Красноярску", phones: ["+7 (391) 989-12-47"], postalCode: "660003", address: "улица Кутузова, 1с63", warehouseAddress: "ул. им. Академика Вавилова 1, стр.50, кор.1", mapLat: 55.997, mapLng: 92.996, sortOrder: 500, isDefault: false },
      { name: "Иркутск", slug: "irkutsk", domain: "irkutsk.novtecas.ru", namePrepositional: "Иркутске", nameDative: "Иркутску", phones: [], postalCode: "664009", address: "улица Ширямова, 52", warehouseAddress: "", mapLat: 52.26, mapLng: 104.3472, sortOrder: 500, isDefault: false },
      { name: "Чита", slug: "chita", domain: "chita.novtecas.ru", namePrepositional: "Чите", nameDative: "Чите", phones: [], postalCode: "672038", address: "улица Тимирязева, 23Б", warehouseAddress: "", mapLat: 52.0485, mapLng: 113.4881, sortOrder: 500, isDefault: false },
      { name: "Улан-Удэ", slug: "ulan-ude", domain: "ulan-ude.novtecas.ru", namePrepositional: "Улан-Удэ", nameDative: "Улан-Удэ", phones: [], postalCode: "670009", address: "улица Чайковского, 3Б", warehouseAddress: "", mapLat: 51.8603, mapLng: 107.729, sortOrder: 500, isDefault: false },
      { name: "Тюмень", slug: "tumen", domain: "tumen.novtecas.ru", namePrepositional: "Тюмени", nameDative: "Тюмени", phones: ["+7 (345) 257-88-63"], postalCode: "", address: "Миусская улица, 3", warehouseAddress: "", mapLat: 57.1455, mapLng: 65.536, sortOrder: 500, isDefault: false },
      { name: "Сургут", slug: "surgut", domain: "surgut.novtecas.ru", namePrepositional: "Сургуте", nameDative: "Сургуту", phones: ["8 (800) 707-04-71"], postalCode: "", address: "ул. Гагарина, 5", warehouseAddress: "", mapLat: 61.2369, mapLng: 73.3919, sortOrder: 500, isDefault: false },
      { name: "Новый Уренгой", slug: "noviy-urengoy", domain: "noviy-urengoy.novtecas.ru", namePrepositional: "Новом Уренгое", nameDative: "Новому Уренгою", phones: ["8 (800) 707-04-71"], postalCode: "", address: "ул. Таёжная, 204", warehouseAddress: "", mapLat: 66.0788, mapLng: 76.6037, sortOrder: 500, isDefault: false },
      { name: "Нижневартовск", slug: "nijnevartovsk", domain: "nijnevartovsk.novtecas.ru", namePrepositional: "Нижневартовске", nameDative: "Нижневартовску", phones: ["8 (800) 707-04-71"], postalCode: "", address: "улица Ленина, 10Пс18", warehouseAddress: "", mapLat: 60.9375, mapLng: 76.5439, sortOrder: 500, isDefault: false },
      { name: "Салехард", slug: "salehard", domain: "salehard.novtecas.ru", namePrepositional: "Салехарде", nameDative: "Салехарду", phones: ["8 (800) 707-04-71"], postalCode: "", address: "улица Республики, 137Б", warehouseAddress: "", mapLat: 66.5336, mapLng: 66.6481, sortOrder: 500, isDefault: false },
      { name: "Нефтеюганск", slug: "nefteyugansk", domain: "nefteyugansk.novtecas.ru", namePrepositional: "Нефтеюганске", nameDative: "Нефтеюганску", phones: ["8 (800) 707-04-71"], postalCode: "", address: "Набережная улица, 16А", warehouseAddress: "", mapLat: 61.0909, mapLng: 72.5929, sortOrder: 500, isDefault: false },
      { name: "Альметьевск", slug: "almetyevsk", domain: "almetyevsk.novtecas.ru", namePrepositional: "Альметьевске", nameDative: "Альметьевску", phones: ["8 (917) 260-29-89"], postalCode: "", address: "ул. Заводская стр.8 пом 2", warehouseAddress: "", mapLat: 54.8946, mapLng: 52.333, sortOrder: 500, isDefault: false },
      { name: "Краснодар", slug: "krasnodar", domain: "krasnodar.novtecas.ru", namePrepositional: "Краснодаре", nameDative: "Краснодару", phones: ["8 (917) 127-43-00"], postalCode: "", address: "г. Краснодар, ст. Каневская: ул. Береговая, 2А", warehouseAddress: "г. Краснодар, Ростовское шоссе 26/1", mapLat: 46.0805, mapLng: 38.9699, sortOrder: 500, isDefault: false },
      { name: "Калининград", slug: "kaliningrad", domain: "kaliningrad.novtecas.ru", namePrepositional: "Калининграде", nameDative: "Калининграду", phones: ["8 (906) 21-30-123", "8 (401) 257-99-72"], postalCode: "", address: "Московский проспект, д. 40, 4 этаж", warehouseAddress: "Россия, 236006, Калининград, Московский проспект, д. 40, 4 этаж", mapLat: 54.7093, mapLng: 20.5026, sortOrder: 500, isDefault: false },
      { name: "Астрахань", slug: "astrahan", domain: "astrahan.novtecas.ru", namePrepositional: "Астрахани", nameDative: "Астрахани", phones: ["8 (917) 127-43-00"], postalCode: "", address: "", warehouseAddress: "г. Астрахань, ул. Боевая 136 Б", mapLat: null, mapLng: null, sortOrder: 500, isDefault: false },
      { name: "Челябинск", slug: "chelyabinsk", domain: "chelyabinsk.novtecas.ru", namePrepositional: "Челябинске", nameDative: "Челябинску", phones: ["8 (351) 700-74-44"], postalCode: "454084", address: "ул.Свердловский тракт д.5 корпус 11", warehouseAddress: "454084, Россия, Челябинская обл., г. Челябинск, ул.Свердловский тракт д.5 корпус 11", mapLat: null, mapLng: null, sortOrder: 500, isDefault: false },
      { name: "Саратов", slug: "saratov", domain: "saratov.novtecas.ru", namePrepositional: "Саратове", nameDative: "Саратову", phones: ["+7 (904) 24-40-700"], postalCode: "", address: "г. Саратов, Ново-Астраханское шоссе 109/3", warehouseAddress: "", mapLat: 51.4887, mapLng: 45.8875, sortOrder: 500, isDefault: false },
      { name: "Минск", slug: "by", domain: "by.novtecas.ru", namePrepositional: "Минске", nameDative: "Минске", phones: ["+375 17 227-05-21", "+375 44 743-51-22 Viber", "+375 44 743-51-23 Viber", "+375 44 743-51-71"], postalCode: "", address: "г. Минск ул. Семенова 2", warehouseAddress: "", mapLat: 53.8698, mapLng: 27.5636, sortOrder: 500, isDefault: false },
      { name: "Таджикистан", slug: "tj", domain: "tj.novtecas.ru", namePrepositional: "Таджикистане", nameDative: "Таджикистану", phones: ["+7 (495) 989-72-56", "+7 (499) 390-40-83"], postalCode: "", address: "Москва, МКАД, 60-й километр, д. 4А (БЦ Колизей)", warehouseAddress: "", mapLat: 55.7668, mapLng: 37.3721, sortOrder: 500, isDefault: false },
      { name: "Узбекистан", slug: "uz", domain: "uz.novtecas.ru", namePrepositional: "Узбекистане", nameDative: "Узбекистану", phones: ["+7 (495) 989-72-56", "+7 (499) 390-40-83"], postalCode: "", address: "Москва, МКАД, 60-й километр, д. 4А (БЦ Колизей)", warehouseAddress: "", mapLat: 55.7668, mapLng: 37.3721, sortOrder: 500, isDefault: false },
      { name: "Киргизия", slug: "kg", domain: "kg.novtecas.ru", namePrepositional: "Киргизии", nameDative: "Киргизии", phones: ["+7 (495) 989-72-56", "+7 (499) 390-40-83"], postalCode: "", address: "Москва, МКАД, 60-й километр, д. 4А (БЦ Колизей)", warehouseAddress: "", mapLat: 55.7668, mapLng: 37.3721, sortOrder: 500, isDefault: false },
      { name: "Волгоград", slug: "volgograd", domain: "volgograd.novtecas.ru", namePrepositional: "Волгограде", nameDative: "Волгограду", phones: ["8 (917) 127-43-00"], postalCode: "", address: "", warehouseAddress: "Волгоградская обл., р.п. Городище, улица Дорожников, 11", mapLat: null, mapLng: null, sortOrder: 500, isDefault: false },
      { name: "Ростов-на-Дону", slug: "rostov-na-dony", domain: "rostov-na-dony.novtecas.ru", namePrepositional: "Ростове-на-Дону", nameDative: "Ростове-на-Дону", phones: ["+7 (863) 320-00-39", "+7 929 816-61-73"], postalCode: "", address: "Ростов-на-Дону, пр-т Шолохова, 304", warehouseAddress: "", mapLat: 47.2689, mapLng: 39.8224, sortOrder: 500, isDefault: false },
      { name: "Белгород", slug: "belgorod", domain: "belgorod.novtecas.ru", namePrepositional: "Белгорода", nameDative: "Белгороде", phones: ["8 (961) 190-58-85"], postalCode: "", address: "", warehouseAddress: "", mapLat: 50.5705, mapLng: 36.6478, sortOrder: 500, isDefault: false },
    ];

    for (const c of citiesData) {
      await strapi.documents("api::city.city").create({
        data: c,
        status: "published",
      });
    }

    strapi.log.info("Seed: initial content created successfully!");
    strapi.log.info(`  - ${productsData.length} products`);
    strapi.log.info(`  - ${reviewCount} reviews`);
    strapi.log.info(`  - ${dealersData.length} dealers`);
    strapi.log.info(`  - ${portfolioData.length} portfolio items`);
    strapi.log.info(`  - ${articlesData.length} media items`);
    strapi.log.info(`  - ${documentsData.length} documents`);
    strapi.log.info(`  - ${citiesData.length} cities`);
    strapi.log.info("  - Pages: About, Production, Technology, Hydrophobic, Blacklist, Contacts, Dealers, Privacy");
    strapi.log.info("  - Home Page");
    strapi.log.info("  - Site Settings");
  },
};
