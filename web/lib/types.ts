export interface StrapiResponse<T> {
  data: T;
  meta: StrapiMeta;
}

export interface StrapiMeta {
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

export interface StrapiEntry<T> {
  id: number;
  attributes: T;
}

export interface StrapiMedia {
  data: {
    id: number;
    attributes: {
      url: string;
      alternativeText: string | null;
      width: number;
      height: number;
      formats: Record<string, { url: string; width: number; height: number }>;
      mime: string;
      name: string;
    };
  } | null;
}

export interface StrapiMediaMultiple {
  data: Array<{
    id: number;
    attributes: {
      url: string;
      alternativeText: string | null;
      width: number;
      height: number;
      formats: Record<string, { url: string; width: number; height: number }>;
      mime: string;
      name: string;
    };
  }>;
}

// --- Components ---

export interface PriceTier {
  id: number;
  minQtyKg: number;
  price: number;
  label: string;
}

export interface ContactInfo {
  id: number;
  phones: string[];
  emails: string[];
  addresses: string[];
  workingHours: string;
}

export interface SEOComponent {
  id: number;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: StrapiMedia;
}

// --- Content Types ---

export interface ProductAttributes {
  Title: string;
  Slug: string;
  Short_Description: string | null;
  Price_Rub: number | null;
  Unit_of_Measure: string | null;
  Weight: string | null;
  Image: StrapiMedia;
  Gallery: StrapiMediaMultiple;
  Full_Description: string | null;
  Specs: Record<string, string> | null;
  isFeatured: boolean;
  isCustomOrder: boolean;
  priceTiers: PriceTier[];
  category: { data: StrapiEntry<ProductCategoryAttributes> | null };
  Related_Products: { data: StrapiEntry<ProductAttributes>[] };
  reviews: { data: StrapiEntry<ReviewAttributes>[] };
  seo: SEOComponent | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProductCategoryAttributes {
  name: string;
  slug: string;
  description: string | null;
  products: { data: StrapiEntry<ProductAttributes>[] };
}

export interface DealerAttributes {
  Title: string;
  City: string | null;
  Address: string | null;
  Phone: string | null;
  Coordinates: { lat: number; lng: number } | null;
  Contact_Info: string | null;
  isActive: boolean;
  publishedAt: string;
}

export interface DocumentAttributes {
  Title: string;
  File: StrapiMedia;
  Category: string | null;
  Preview_Image: StrapiMedia;
  sortOrder: number;
  publishedAt: string;
}

export interface PortfolioItemAttributes {
  Title: string;
  Slug: string;
  Date: string | null;
  Short_Text: string | null;
  Full_Text: string | null;
  Image_Preview: StrapiMedia;
  Gallery: StrapiMediaMultiple;
  publishedAt: string;
}

export interface MediaItemAttributes {
  Title: string;
  Slug: string;
  Date: string | null;
  Type: "news" | "article" | "video";
  Short_Text: string | null;
  Full_Text: string | null;
  Image_Preview: StrapiMedia;
  Gallery: StrapiMediaMultiple;
  publishedAt: string;
}

export interface ReviewAttributes {
  author: string;
  text: string;
  rating: number | null;
  product: { data: StrapiEntry<ProductAttributes> | null };
  isPublished: boolean;
  createdAt: string;
}

export interface LeadAttributes {
  type: "buy" | "dealer" | "contact" | "callback";
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  message: string | null;
  product: { data: StrapiEntry<ProductAttributes> | null };
  createdAt: string;
}

export interface PartnerAttributes {
  name: string;
  logo: StrapiMedia;
  url: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface PageAttributes {
  title: string;
  slug: string;
  content: string | null;
  seo: SEOComponent | null;
  publishedAt: string;
}

export interface PageAboutAttributes {
  Intro_Text: string | null;
  Full_Text: string | null;
  Sidebar_Image: StrapiMedia;
  Requisites_Table: Record<string, string>[] | null;
}

export interface PageProductionAttributes {
  Intro_Text: string | null;
  Gallery: StrapiMediaMultiple;
}

export interface PageBlacklistAttributes {
  Text_Content: string | null;
}

export interface PageContactsAttributes {
  Contact_Info: string | null;
}

export interface PageDealersAttributes {
  Intro_Text: string | null;
}

export interface SiteSettingsAttributes {
  logo: StrapiMedia;
  contacts: ContactInfo | null;
  copyright: string | null;
  heroVideo: StrapiMedia;
  heroPoster: StrapiMedia;
}
