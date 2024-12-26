export interface ProductRequest {
  category: string[];
  sub_category?: string[] | null;
  sub_sub_category?: string[] | null;
  product_type: string[];
  formation?: string[] | null;
  material?: string[] | null;
  hair_type?: string[] | null;
  shape?: string[] | null;
  fabric?: string[] | null;
  texture?: string[] | null;
  skin_type?: string[] | null;
  skin_concern?: string[] | null;
  hair_concern?: string[] | null;
  fragrance_note?: string[] | null;
}
