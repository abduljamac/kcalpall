import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { NutritionData } from "@/types/nutrition";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export class SupabaseService {
  private supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  async storeNutritionalData(data: NutritionData) {
    try {
      const { data: productData, error: productError } = await this.supabase
        .from("products")
        .insert([{ name: data.name }])
        .select()
        .single();

      console.log("Inserted product data:", productData);

      if (productError) {
        console.error("Error inserting product:", productError);
        throw productError;
      }

      for (const info of data.nutritionalInfo) {
        try {
          console.log("info", info);
          const { error } = await this.supabase
            .from("nutritional_info")
            .insert({
              product_id: productData.product_id,
              serving_label: info.per,
              energy_kj: info.values.energy.kj,
              energy_kcal: info.values.energy.kcal,
              fat_total: info.values.fat.total,
              fat_saturates: info.values.fat.saturates,
              carbohydrate_total: info.values.carbohydrate.total,
              carbohydrate_sugars: info.values.carbohydrate.sugars,
              fibre: info.values.fibre,
              protein: info.values.protein,
              salt: info.values.salt,
            });

          if (error) {
            console.error("Error inserting nutritional info:", error);
          }
        } catch (error) {
          console.error("Exception caught:", error);
        }
      }

      return { success: true, productId: productData.id };
    } catch (error) {
      console.error("Error storing nutritional data:", error);
      throw error;
    }
  }

  async getProductWithNutrition(productId: number) {
    const { data: product, error: productError } = await this.supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError) throw productError;

    const { data: nutritionInfo, error: nutritionError } = await this.supabase
      .from("nutritional_info")
      .select("*")
      .eq("product_id", productId);

    if (nutritionError) throw nutritionError;

    return {
      product,
      nutritionInfo,
    };
  }
}
