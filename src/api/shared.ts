export const defaultHeaders = {
  Authorization: "Bearer hb2vxjo1ayu0agrkr97eprrl5rccqotc",
  Accept: "application/json",
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  attribute_set_id: number;
  price: number;
  status: number;
  visibility: number;
  type_id: string;
  created_at: string;
  updated_at: string;
  weight: number;
  extension_attributes: {
    website_ids: Array<number>;
    category_links: Array<{
      position: number;
      category_id: string;
    }>;
    configurable_product_options?: Array<{
      id: number;
      attribute_id: string;
      label: string;
      position: number;
      values: Array<{
        value_index: number;
      }>;
      product_id: number;
    }>;
    configurable_product_links?: Array<number>;
  };
  product_links: Array<any>;
  options: Array<any>;
  media_gallery_entries: Array<{
    id: number;
    media_type: string;
    label?: string;
    position: number;
    disabled: boolean;
    types: Array<string>;
    file: string;
  }>;
  tier_prices: Array<any>;
  custom_attributes: Array<{
    attribute_code: string;
    value: any;
  }>;
};

export type Category = {
  id: number;
  parent_id: number;
  name: string;
  position: number;
  level: number;
  children: string;
  created_at: string;
  updated_at: string;
  path: string;
  include_in_menu: boolean;
  custom_attributes: Array<{
    attribute_code: string;
    value: string;
  }>;
  is_active?: boolean;
};

export type LookbookCategory = {
  category_id: number;
  identifier: string;
  title: string;
  is_active: number;
  position: number;
  include_in_menu: number;
  canonical_url: string;
  image: any;
  description: any;
  meta_title: string;
  meta_keywords: string;
  meta_description: string;
  store_id: Array<string>;
  profiles: Array<{
    profile_id: number;
    name: string;
    description: string;
    image: string;
    identifier: string;
    marker: string;
    page_layout: string;
    try_on_url: string;
    store_id: Array<string>;
  }>;
};
