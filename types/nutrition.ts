export interface NutritionValues {
  energy: {
    kj: number;
    kcal: number;
  };
  fat: {
    total: number;
    saturates: number;
  };
  carbohydrate: {
    total: number;
    sugars: number;
  };
  fibre: number;
  protein: number;
  salt: number;
}

export interface NutritionInfo {
  per: string;
  values: NutritionValues;
}

export interface NutritionData {
  name: string;
  nutritionalInfo: NutritionInfo[];
  error?: string;
}
