import fs from "fs";
import path from "path";

const SEED_IMAGES_DIR = path.join(process.cwd(), "seeds", "images");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Загружает один файл из src/seeds/images/ в Strapi Media Library.
 *  Если файл не найден — возвращает null (поле остаётся пустым). */
async function uploadSeedFile(
  strapi: any,
  fileName: string,
  altText: string
): Promise<number | null> {
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
    return file?.id ?? null;
  } catch (err) {
    strapi.log.warn(`Seed: ошибка загрузки "${fileName}": ${err.message}`);
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
    "api::page-about.page-about.find",
    "api::page-production.page-production.find",
    "api::page-blacklist.page-blacklist.find",
    "api::page-contacts.page-contacts.find",
    "api::page-dealers.page-dealers.find",
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

export default {
  async bootstrap({ strapi }) {
    await ensureAdminUser(strapi);
    await ensurePublicPermissions(strapi);

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
    const productsData = [
      {
        Title: "Холодный асфальт 35 кг (до 1000 кг)", Slug: "cold-asphalt-35kg-under-1000",
        Short_Description: "Цена при оплате менее 1000 кг. Стандартная фасовка в полиэтиленовых мешках.",
        Price_Rub: 680, Unit_of_Measure: "мешок", Weight: "35 кг", isFeatured: true, isCustomOrder: false, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Холодный асфальт Perma Patch в полиэтиленовых мешках по 35 кг — стандартная упаковка, всегда в наличии на складе. Идеально подходит для ямочного ремонта дорог, тротуаров и парковок.</p><p>Состав может уплотняться даже при -27°С, сохраняя подвижность и качество материала.</p>",
        priceTiers: [{ minQtyKg: 0, price: 680, label: "до 1000 кг" }, { minQtyKg: 1000, price: 640, label: "от 1000 кг" }, { minQtyKg: 5000, price: 610, label: "от 5000 кг" }],
        imageFile: "35kg.jpg",
        galleryFiles: ["35kg.jpg"],
      },
      {
        Title: "Холодный асфальт 35 кг (от 1000 кг)", Slug: "cold-asphalt-35kg-from-1000",
        Short_Description: "Цена при оплате более 1000 кг. Стандартная фасовка в полиэтиленовых мешках.",
        Price_Rub: 640, Unit_of_Measure: "мешок", Weight: "35 кг", isFeatured: true, isCustomOrder: false, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Холодный асфальт Perma Patch в мешках по 35 кг. Оптовая цена при заказе от 1000 кг. Стандартная упаковка, всегда в наличии.</p>",
        imageFile: "35kg.jpg",
        galleryFiles: ["35kg.jpg"],
      },
      {
        Title: "Холодный асфальт 35 кг (от 5000 кг)", Slug: "cold-asphalt-35kg-from-5000",
        Short_Description: "Оптовая партия от 5000 кг. Максимально выгодная цена.",
        Price_Rub: 610, Unit_of_Measure: "мешок", Weight: "35 кг", isFeatured: true, isCustomOrder: false, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Холодный асфальт Perma Patch — лучшая цена при крупном опте от 5000 кг. Упаковка 35 кг, всегда в наличии.</p>",
        imageFile: "35kg.jpg",
        galleryFiles: ["35kg.jpg"],
      },
      {
        Title: "Холодный асфальт 50 кг (полипропилен)", Slug: "cold-asphalt-50kg",
        Short_Description: "Под спецзаказ при определённой партии. Полипропиленовые мешки.",
        Price_Rub: 760, Unit_of_Measure: "мешок", Weight: "50 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Холодный асфальт в полипропиленовых мешках по 50 кг. Производится под спецзаказ при определённой партии. Уточняйте актуальную цену у менеджера.</p>",
        imageFile: "30-50kg.jpg",
        galleryFiles: ["30-50kg.jpg"],
      },
      {
        Title: "Холодный асфальт 30 кг (полипропилен)", Slug: "cold-asphalt-30kg",
        Short_Description: "Под спецзаказ при определённой партии. Минимальная партия — 1 тонна.",
        Price_Rub: 470, Unit_of_Measure: "мешок", Weight: "30 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Холодный асфальт Perma Patch в мешках по 30 кг. Фасовка в полипропилен под заказ. Минимальная партия — 1 тонна.</p>",
        imageFile: "30-50kg.jpg",
        galleryFiles: ["30-50kg.jpg"],
      },
      {
        Title: "Холодный асфальт 1000 кг (биг-бег)", Slug: "cold-asphalt-1000kg",
        Short_Description: "Холодный асфальт Perma Patch в биг-бегах по 1000 кг.",
        Price_Rub: 17910, Unit_of_Measure: "тонна", Weight: "1000 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Холодный асфальт Perma Patch фасовка в биг-бегах по 1000 кг. Экономичный вариант для крупных объёмов работ.</p>",
        imageFile: "1000kg.jpg",
        galleryFiles: ["1000kg.jpg"],
      },
      {
        Title: "Красный холодный асфальт Perma Patch COLOR (мешки)", Slug: "red-cold-asphalt-bags",
        Short_Description: "Цветной холодный асфальт для выделения дорожных зон и покрытий.",
        Price_Rub: 1565, Unit_of_Measure: "мешок", Weight: "35 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Красный холодный асфальт Perma Patch COLOR — декоративное покрытие для выделения пешеходных зон, велодорожек и специальных площадок. Уточняйте актуальную цену.</p>",
        imageFile: "1000kg.jpg",
        galleryFiles: ["1000kg.jpg","red1.jpg","red2.jpg"],
      },
      {
        Title: "Вяжущее для холодного асфальта 205 л (185 кг)", Slug: "binder-perma-patch-205l",
        Short_Description: "Вяжущее для производства холодного асфальта Perma Patch.",
        Price_Rub: 34385, Unit_of_Measure: "бочка", Weight: "185 кг", isFeatured: false, isCustomOrder: true, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catCold.documentId,
        Full_Description: "<p>Вяжущее (концентрат) для производства холодного асфальта по канадской технологии Perma Patch. Объём 205 литров (185 кг).</p>",
        imageFile: "vyazhuschee.jpg",
        galleryFiles: ["vyazhuschee.jpg"],
      },
      {
        Title: "Мешки полиэтиленовые для холодного асфальта", Slug: "pe-bags-cold-asphalt",
        Short_Description: "Мешки полиэтиленовые с заваренным дном, для пакетирования холодного асфальта по 25 или 30 кг.",
        Price_Rub: 95, Unit_of_Measure: "шт.", Weight: "—", isFeatured: false, isCustomOrder: false, Show_Price_Note: true, Price_Note: "Уточняйте актуальную цену у менеджера", category: catBags.documentId,
        Full_Description: "<p>Мешки полиэтиленовые с заваренным дном, без боковых складок, для пакетирования холодного асфальта по 25 или 30 кг.</p>",
        imageFile: "meshki.jpg",
        galleryFiles: ["meshki.jpg"],
      },
    ];

    for (const p of productsData) {
      const { imageFile, galleryFiles, ...productData } = p;

      const [imageId, galleryIds] = await Promise.all([
        uploadSeedFile(strapi, imageFile, productData.Title),
        uploadSeedGallery(strapi, galleryFiles, productData.Title),
      ]);

      await strapi.documents("api::product.product").create({
        data: {
          ...productData,
          ...(imageId ? { Image: imageId } : {}),
          ...(galleryIds.length ? { Gallery: galleryIds } : {}),
        },
        status: "published",
      });
    }

    // --- Page About ---
    await strapi.documents("api::page-about.page-about").create({
      data: {
        Intro_Text: "Компания «Новые Технологии Асфальта – NovTecAs» – это молодое и динамично развивающееся предприятие.",
        Full_Text: `<p>Наша основная цель – ознакомить потребителей с продукцией McAsphalt Industries Limited (Канада). Материалы этого производителя используются для изготовления теплого и холодного асфальта. Также доступны гидроизоляционные мастики для ремонта дорожных полотен.</p>
<p>Деятельность компании также связана с поставками оборудования для битумных хозяйств, продажей плавильно-заливочных котлов, систем АБЗ, антиобледенителей для железных дорог и аэропортов.</p>
<p>Предприятие наладило выпуск холодного асфальта с использованием концентрата Perma Patch. Состав расфасован в удобные биг-беги (1000 кг) и пластиковые мешки (30 кг).</p>
<h3>Преимущества сотрудничества с компанией</h3>
<ul>
<li>Применение новейших технологий и проверенных добавок, доказавших эффективность при использовании в суровых климатических условиях.</li>
<li>Бесплатные консультации по вопросам приобретения, эксплуатации товаров.</li>
<li>Оперативная доставка клиенту готовых составов и оборудования.</li>
</ul>
<p>Мы всегда открыты для нового сотрудничества и готовы оказать заказчикам поддержку по любым возникающим вопросам.</p>`,
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
        Intro_Text: "Производство холодного асфальта осуществляется на собственных мощностях с использованием канадской технологии Perma Patch. Современное оборудование обеспечивает точную дозацию компонентов и стабильное качество продукции.",
      },
      status: "published",
    });

    // --- Page Blacklist ---
    await strapi.documents("api::page-blacklist.page-blacklist").create({
      data: {
        Text_Content: `<p>Предлагаем Вашему вниманию список компаний и людей, с которыми наша организация имеет негативный опыт сотрудничества и работа с которыми может быть опасна для Вас и Вашей компании:</p>
<ol>
<li><strong>ООО «Ямалгазпрогресс»</strong> (ИНН 7841407982) — между компаниями ООО «Ямалгазпрогресс» и ООО «Новые технологии асфальта» был заключён договор и соглашение о поставке дизельного топлива на 230 230,00 рублей от поставщика ООО «Ямалгазпрогресс». Прошло уже несколько месяцев, а договорные обязательства не были исполнены поставщиком. В ответ на нашу претензию компания направила ответное письмо, что денежные средства будут возвращены в течение 14 рабочих дней. На данный момент обязательства по договору не были исполнены. Возврата уплаченных средств также не поступило.</li>
<li><strong>ООО «ТЕХНОРЭД»</strong> (ИНН 5036173648) — поставка некачественного оборудования.</li>
</ol>`,
      },
      status: "published",
    });

    // --- Page Contacts ---
    await strapi.documents("api::page-contacts.page-contacts").create({
      data: {
        Contact_Info: `<p><strong>Адрес:</strong> 119180, Российская Федерация, г. Москва, ул. Большая Полянка, д. 51А/9, этаж 8, помещение 1</p>
<p><strong>Склад:</strong> Московская обл., Домодедово, ул. Заборье, 2д, стр. 10</p>
<p><strong>Телефон:</strong> +7 800 707-04-71, +7 (499) 504-41-63</p>
<p>Отдел продаж — доп. номер (100)</p>
<p>Финансовый отдел — доп. номер (101)</p>
<p>Техническая поддержка — доп. номер (102)</p>`,
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
      { Title: "УРАЛСТРОЙПАРТНЕР", City: "Челябинск", Phone: "8 (351) 700-74-44", Coordinates: { lat: 55.1644, lng: 61.4368 } },
      { Title: "Склад NovTecAs", City: "Москва", Phone: "+7 (495) 240-83-05", Coordinates: { lat: 55.7558, lng: 37.6173 } },
      { Title: 'ООО "Строительная Помощь"', City: "Нижний Новгород", Phone: "(831) 415-55-59", Coordinates: { lat: 56.2965, lng: 43.9361 } },
      { Title: "Новая Хатка", City: "Минск", Phone: "8 (017) 227-05-21", Coordinates: { lat: 53.9006, lng: 27.559 } },
      { Title: "ВМК", City: "Владимир", Phone: "8 (4922) 44-03-03", Coordinates: { lat: 56.1291, lng: 40.4069 } },
      { Title: "СТРОЙ РЕМ ГАРАНТ / ИП Лаптев", City: "Киров", Phone: "8 (8332) 74-61-09", Coordinates: { lat: 58.6036, lng: 49.668 } },
      { Title: "ИП Козлова Д.А. (Строймат)", City: "Саратов", Phone: "8 (904) 24-40-700", Coordinates: { lat: 51.5336, lng: 46.0343 } },
      { Title: 'ООО "Бизон бизнес"', City: "Ульяновск", Phone: "8 8422 97-44-00", Coordinates: { lat: 54.3187, lng: 48.3978 } },
      { Title: 'ООО "ТОРУС"', City: "Санкт-Петербург", Phone: "8 (913) 200-88-10", Coordinates: { lat: 59.9343, lng: 30.3351 } },
      { Title: 'Группа компаний "Проф.Ком"', City: "Мурманск", Phone: "", Coordinates: { lat: 68.9585, lng: 33.0827 } },
      { Title: "Иновация Маркет", City: "Казань (Татарстан)", Phone: "8 (917) 260-29-89", Coordinates: { lat: 55.7887, lng: 49.1221 } },
      { Title: 'ООО "ЭкспортНефтеСнаб"', City: "Уфа", Phone: "8 (905) 35-35-006", Coordinates: { lat: 54.7388, lng: 55.9721 } },
      { Title: 'ООО "Стройторг"', City: "Красноярск", Phone: "+7 391 2-051-051", Coordinates: { lat: 56.0153, lng: 92.8932 } },
      { Title: "Агреман", City: "Ярославль", Phone: "+7 (915) 988-80-25", Coordinates: { lat: 57.6261, lng: 39.8845 } },
      { Title: "Строймат (ББК-Строй)", City: "Воронеж", Phone: "8 (900) 950-07-14", Coordinates: { lat: 51.6755, lng: 39.2089 } },
      { Title: 'ООО "СПЕЦОМ"', City: "Краснодар", Phone: "8 (917) 127-43-00", Address: "г. Краснодар, Ростовское шоссе, 26/1", Coordinates: { lat: 45.0355, lng: 38.975 } },
      { Title: 'ООО "ТОРУС"', City: "Новосибирск", Phone: "", Coordinates: { lat: 55.0084, lng: 82.9357 } },
      { Title: 'ООО "Термотехника"', City: "Самарская обл.", Phone: "+7 (937) 072-63-22", Coordinates: { lat: 53.5075, lng: 49.4198 } },
      { Title: "Регион-Снабжение", City: "Калининград", Phone: "8 (906) 213-01-23", Coordinates: { lat: 54.7104, lng: 20.4522 } },
      { Title: 'ООО "МДА-КОМПЛЕКТ"', City: "Омск", Phone: "8 (965) 982-86-07", Coordinates: { lat: 54.9885, lng: 73.3242 } },
      { Title: 'ООО "Герметик-УНИВЕРСАЛ"', City: "Пенза", Phone: "(8412) 30-66-38", Coordinates: { lat: 53.1959, lng: 45.0183 } },
      { Title: "БОРА", City: "Ростов-на-Дону", Phone: "8 (918) 555-61-86", Address: "пр-т Шолохова, 304", Coordinates: { lat: 47.2357, lng: 39.7015 } },
      { Title: "ЭНС ЭкспортНефтеСнаб", City: "Оренбург", Phone: "8 905 35-35-006", Coordinates: { lat: 51.7682, lng: 55.0969 } },
    ];

    for (const d of dealersData) {
      await strapi.documents("api::dealer.dealer").create({
        data: { ...d, isActive: true },
        status: "published",
      });
    }

    // --- Portfolio Items ---
    const portfolioData = [
      { Title: "Холодный асфальт в качестве эксперимента", Slug: "cold-asphalt-experiment", Short_Text: "Экспериментальная укладка холодного асфальта для оценки долговечности покрытия.", Date: "2020-01-15" },
      { Title: "Укладка холодного асфальта для пос. Ягодный, г. Тольятти", Slug: "pos-yagodnyy-tolyatti", Short_Text: "Ремонт дорожного покрытия холодным асфальтом в посёлке Ягодный, Самарская область.", Date: "2019-06-20" },
      { Title: "Укладка холодного асфальта для ЦентроБанка, г. Тольятти", Slug: "centrobank-tolyatti", Short_Text: "Выполнение работ по ремонту покрытия для отделения Центрального Банка в Тольятти.", Date: "2019-05-10" },
      { Title: 'Укладка для ООО "Система Комплексной безопасности"', Slug: "skb-tolyatti", Short_Text: "Ремонтные работы с использованием холодного асфальта для ООО «Система Комплексной безопасности» в Тольятти.", Date: "2019-03-15" },
      { Title: "Укладка для муниципальной службы г. Сызрани", Slug: "municipal-syzran", Short_Text: "Поставка и укладка холодного асфальта для муниципальных нужд г. Сызрани.", Date: "2018-09-01" },
      { Title: "Ремонт ж/д переезда для ЗАО «ППЖТ», г. Тольятти", Slug: "ppzht-tolyatti-railway", Short_Text: "Экстренный ремонт железнодорожного переезда с использованием холодного асфальта Perma Patch.", Date: "2018-07-20" },
      { Title: "Гидроизоляция резервуаров нефтеналивных терминалов", Slug: "hydroisolation-oil-terminals", Short_Text: "Изготовление 3000 тонн холодного асфальта для гидроизоляции резервуаров на нефтеналивных терминалах.", Date: "2018-04-10" },
    ];

    for (const p of portfolioData) {
      await strapi.documents("api::portfolio-item.portfolio-item").create({
        data: p,
        status: "published",
      });
    }

    // --- Media Items (articles) ---
    const articlesData = [
      { Title: "Ямочный ремонт асфальтового покрытия", Slug: "yamochnyy-remont", Type: "article", Date: "2019-03-26", Short_Text: "Требования к состоянию покрытия автомобильных дорог чётко прописаны в нормативных документах. Обзор современных материалов и технологий для ремонта дорог.", Full_Text: "<p>Требования к состоянию покрытия автомобильных дорог четко прописаны в соответствующих нормативных документах (ГОСТ Р 50597-93, СНиП 2.07.01 и другие). Однако в них не учитывается стремительный рост количества транспортных средств и соответствующее увеличение нагрузки на дорожное покрытие. Вместе с прогрессом технологии растет и количество материалов и технологий для ремонта дорог.</p>" },
      { Title: "Асфальтовая крошка: технология укладки, применение", Slug: "asfaltovaya-kroshka", Type: "article", Date: "2018-04-09", Short_Text: "Асфальтовая крошка — вторичное сырьё, находящее применение в сфере дорожного строительства и ряде других областей.", Full_Text: "<p>Асфальтовая крошка – это вторичное сырье, находящее применение в сфере дорожного строительства и ряде других областей.</p>" },
      { Title: "Дорожные асфальтобетонные смеси: особенности и состав", Slug: "dorozhnye-asfaltobetonnye-smesi", Type: "article", Date: "2018-03-27", Short_Text: "Асфальтобетонная смесь — специализированный материал на основе минеральных компонентов и органического вяжущего.", Full_Text: "<p>Асфальтобетонной смесью называется специализированный материал, в основе которого лежит бетонный состав из минеральных компонентов различного размера и органический вяжущий компонент. Данный тип смесей используется для строительства дорожного полотна.</p>" },
    ];

    for (const a of articlesData) {
      await strapi.documents("api::media-item.media-item").create({
        data: a,
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

    strapi.log.info("Seed: initial content created successfully!");
    strapi.log.info(`  - ${productsData.length} products`);
    strapi.log.info(`  - ${dealersData.length} dealers`);
    strapi.log.info(`  - ${portfolioData.length} portfolio items`);
    strapi.log.info(`  - ${articlesData.length} media items`);
    strapi.log.info("  - Pages: About, Production, Blacklist, Contacts, Dealers, Privacy");
    strapi.log.info("  - Site Settings");
  },
};
