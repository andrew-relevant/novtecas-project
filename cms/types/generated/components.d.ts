import type { Schema, Struct } from '@strapi/strapi';

export interface SharedContactInfo extends Struct.ComponentSchema {
  collectionName: 'components_shared_contact_infos';
  info: {
    description: '\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435';
    displayName: 'ContactInfo';
    icon: 'phone';
  };
  attributes: {
    addresses: Schema.Attribute.JSON;
    emails: Schema.Attribute.JSON;
    phones: Schema.Attribute.JSON;
    workingHours: Schema.Attribute.String;
  };
}

export interface SharedPriceTier extends Struct.ComponentSchema {
  collectionName: 'components_shared_price_tiers';
  info: {
    description: '\u0422\u0438\u0440\u0430\u0436\u043D\u043E\u0435 \u0446\u0435\u043D\u043E\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435';
    displayName: 'PriceTier';
    icon: 'priceTag';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    minQtyKg: Schema.Attribute.Integer & Schema.Attribute.Required;
    price: Schema.Attribute.Decimal & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'SEO-\u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.contact-info': SharedContactInfo;
      'shared.price-tier': SharedPriceTier;
      'shared.seo': SharedSeo;
    }
  }
}
