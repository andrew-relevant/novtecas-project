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

export interface StrapiMediaItem {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  formats: Record<string, { url: string; width: number; height: number }> | null;
  mime: string;
  name: string;
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
  ogImage: StrapiMediaItem | null;
}

export interface VideoEmbed {
  id: number;
  title: string | null;
  url: string;
  platform: "youtube" | "rutube";
}

// --- Content Types (Strapi 5: flat, no data.attributes wrapper) ---

export interface Product {
  id: number;
  documentId: string;
  Title: string;
  Slug: string;
  Short_Description: string | null;
  Price_Rub: number | null;
  Unit_of_Measure: string | null;
  Weight: string | null;
  Image: StrapiMediaItem | null;
  Gallery: StrapiMediaItem[];
  Full_Description: string | null;
  Specs: Record<string, string> | null;
  isFeatured: boolean;
  isCustomOrder: boolean;
  Show_Price_Note: boolean;
  Price_Note: string | null;
  priceTiers: PriceTier[];
  category: ProductCategory | null;
  Related_Products: Product[];
  reviews: Review[];
  seo: SEOComponent | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ProductCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
  products: Product[];
}

export interface Dealer {
  id: number;
  documentId: string;
  Title: string;
  City: string | null;
  Address: string | null;
  Phone: string | null;
  Coordinates: { lat: number; lng: number } | null;
  Contact_Info: string | null;
  isActive: boolean;
  publishedAt: string;
}

export interface DocumentEntry {
  id: number;
  documentId: string;
  Title: string;
  File: StrapiMediaItem | null;
  Category: string | null;
  Preview_Image: StrapiMediaItem | null;
  sortOrder: number;
  publishedAt: string;
}

export interface PortfolioItem {
  id: number;
  documentId: string;
  Title: string;
  Slug: string;
  Date: string | null;
  Short_Text: string | null;
  Full_Text: string | null;
  Image_Preview: StrapiMediaItem | null;
  Gallery: StrapiMediaItem[];
  Videos: VideoEmbed[];
  publishedAt: string;
}

export interface MediaItem {
  id: number;
  documentId: string;
  Title: string;
  Slug: string;
  Date: string | null;
  Type: "news" | "article" | "video";
  Short_Text: string | null;
  Full_Text: string | null;
  Image_Preview: StrapiMediaItem | null;
  Gallery: StrapiMediaItem[];
  publishedAt: string;
}

export interface Review {
  id: number;
  documentId: string;
  author: string;
  text: string;
  rating: number | null;
  product: Product | null;
  isPublished: boolean;
  createdAt: string;
}

export interface Lead {
  id: number;
  documentId: string;
  type: "buy" | "dealer" | "contact" | "callback";
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  message: string | null;
  product: Product | null;
  createdAt: string;
}

export interface Partner {
  id: number;
  documentId: string;
  name: string;
  logo: StrapiMediaItem | null;
  url: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Page {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: string | null;
  seo: SEOComponent | null;
  publishedAt: string;
}

export interface PageAbout {
  id: number;
  documentId: string;
  Intro_Text: string | null;
  Full_Text: string | null;
  Sidebar_Image: StrapiMediaItem | null;
  Requisites_Table: { id?: number; label: string; value: string }[] | null;
}

export interface PageProduction {
  id: number;
  documentId: string;
  Intro_Text: string | null;
  Full_Text: string | null;
  Gallery: StrapiMediaItem[];
}

export interface PageTechnology {
  id: number;
  documentId: string;
  Full_Text: string | null;
}

export interface PageHydrophobic {
  id: number;
  documentId: string;
  Full_Text: string | null;
}

export interface PageBlacklist {
  id: number;
  documentId: string;
  Text_Content: string | null;
}

export interface Department {
  id: number;
  name: string;
  extension: string;
}

export interface PageContacts {
  id: number;
  documentId: string;
  Contact_Info: string | null;
  departments: Department[];
}

export interface PageDealers {
  id: number;
  documentId: string;
  Intro_Text: string | null;
}

export interface SiteSettings {
  id: number;
  documentId: string;
  logo: StrapiMediaItem | null;
  contacts: ContactInfo | null;
  copyright: string | null;
}

export interface Advantage {
  id: number;
  title: string;
  iconKey: string | null;
}

export interface ApplicationArea {
  id: number;
  title: string;
  description: string | null;
  image: StrapiMediaItem | null;
}

export interface HomePage {
  id: number;
  documentId: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroVideo: StrapiMediaItem | null;
  heroPoster: StrapiMediaItem | null;
  aboutTitle: string | null;
  aboutText: string | null;
  aboutCtaLabel: string | null;
  aboutCtaHref: string | null;
  advantagesTitle: string | null;
  advantages: Advantage[];
  applicationAreasTitle: string | null;
  applicationAreas: ApplicationArea[];
  productsTitle: string | null;
  productsSubtitle: string | null;
  productsCtaLabel: string | null;
  productsCtaHref: string | null;
  dealersTitle: string | null;
  dealersText: string | null;
  dealersPhone: string | null;
  dealersCtaLabel: string | null;
}
