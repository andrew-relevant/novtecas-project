import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAdvantage extends Struct.ComponentSchema {
  collectionName: 'components_shared_advantages';
  info: {
    description: '\u041F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u043E \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438';
    displayName: 'Advantage';
    icon: 'star';
  };
  attributes: {
    iconKey: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedApplicationArea extends Struct.ComponentSchema {
  collectionName: 'components_shared_application_areas';
  info: {
    description: '\u041E\u0431\u043B\u0430\u0441\u0442\u044C \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u044F';
    displayName: 'ApplicationArea';
    icon: 'layer';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

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

export interface SharedDepartment extends Struct.ComponentSchema {
  collectionName: 'components_shared_departments';
  info: {
    description: '\u041E\u0442\u0434\u0435\u043B \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u0441 \u0434\u043E\u0431\u0430\u0432\u043E\u0447\u043D\u044B\u043C \u043D\u043E\u043C\u0435\u0440\u043E\u043C';
    displayName: 'Department';
    icon: 'briefcase';
  };
  attributes: {
    extension: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
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
      'shared.advantage': SharedAdvantage;
      'shared.application-area': SharedApplicationArea;
      'shared.contact-info': SharedContactInfo;
      'shared.department': SharedDepartment;
      'shared.price-tier': SharedPriceTier;
      'shared.seo': SharedSeo;
    }
  }
}
