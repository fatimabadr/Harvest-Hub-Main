export interface Product {
  product_id?: number;
  farm_id: number;
  product_name: string;
  unit_price: number;
  unit: string;
  category: string;
  description: string;
  available_stock: number;
  image_url?: string | null;
  harvest_date?: string | null;
  best_before_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface NewProduct {
  product_name: string;
  unit_price: number;
  unit: string;
  category: string;
  description: string;
  available_stock: number;
  image_url: string | null;
  harvest_date: string | null;
  best_before_date: string | null;
}

export interface ProductData extends NewProduct {
  farm_id: number;
} 