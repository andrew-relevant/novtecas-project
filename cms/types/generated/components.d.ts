import type { Attribute, Schema } from '@strapi/strapi';

export interface SharedContactInfo extends Schema.Component {
  collectionName: 'components_shared_contact_infos';
  info: {
    description: '\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435';
    displayName: 'ContactInfo';
    icon: 'phone';
  };
  attributes: {
    addresses: Attribute.JSON;
    emails: Attribute.JSON;
    phones: Attribute.JSON;
    workingHours: Attribute.String;
  };
}

export interface SharedPriceTier extends Schema.Component {
  collectionName: 'components_shared_price_tiers';
  info: {
    description: '\u0422\u0438\u0440\u0430\u0436\u043D\u043E\u0435 \u0446\u0435\u043D\u043E\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435';
    displayName: 'PriceTier';
    icon: 'priceTag';
  };
  attributes: {
    label: Attribute.String & Attribute.Required;
    minQtyKg: Attribute.Integer & Attribute.Required;
    price: Attribute.Decimal & Attribute.Required;
  };
}

export interface SharedSeo extends Schema.Component {
  collectionName: 'components_shared_seos';
  info: {
    description: 'SEO-\u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Attribute.Text;
    metaTitle: Attribute.String;
    ogImage: Attribute.Media<'images'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'shared.contact-info': SharedContactInfo;
      'shared.price-tier': SharedPriceTier;
      'shared.seo': SharedSeo;
    }
  }
}
