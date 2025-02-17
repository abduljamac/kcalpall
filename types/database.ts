export interface Product {
  id: number;
  name: string;
}

export interface NutritionalInfo {
  id: number;
  product_id: number;
  serving_label: string;
  energy_kj: number;
  energy_kcal: number;
  fat_total: number;
  fat_saturates: number;
  carbohydrate_total: number;
  carbohydrate_sugars: number;
  fibre: number;
  protein: number;
  salt: number;
}
