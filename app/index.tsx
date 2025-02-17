import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useCamera } from "@/hooks/use-camera";
import { GeminiService } from "@/services/gemini";
import { NutritionData } from "@/types/nutrition";
import { SupabaseService } from "@/services/superbase";

export default function Index() {
  const { image, setImage, takePicture } = useCamera();
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(
    null
  );
  const geminiService = new GeminiService();
  const supabaseService = new SupabaseService();

  const saveNutritionData = async (data: NutritionData | null) => {
    try {
      await supabaseService.storeNutritionalData(data as NutritionData);
      Alert.alert("Success", "Nutrition data saved successfully!");
    } catch (error) {
      console.error("Supabase Error:", error);
      Alert.alert(
        "Error",
        "Failed to save nutrition data. Check console for details."
      );
    }
  };

  const handleTakePicture = async () => {
    const result = await takePicture();
    if (result) {
      setImage(result.uri);
      try {
        const data = await geminiService.processImage(result.base64!);
        if (data) {
          setNutritionData(data);
        }
      } catch (error) {
        console.error("Gemini API Error:", error);
        Alert.alert(
          "API Error",
          "Failed to process image with Gemini API. Check console for details."
        );
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nutritional Scanner</Text>

      {!image && (
        <TouchableOpacity style={styles.button} onPress={handleTakePicture}>
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>
      )}

      {image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            style={styles.capturedImage}
            resizeMode="contain"
          />
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.button} onPress={handleTakePicture}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => saveNutritionData(nutritionData)}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {nutritionData && (
        <ScrollView style={styles.nutritionDataContainer}>
          <Text style={styles.dataTitle}>
            Nutritional Information (JSON Logged in Console)
          </Text>
          {nutritionData.error ? (
            <Text style={styles.errorText}>Error: {nutritionData.error}</Text>
          ) : (
            <Text style={styles.jsonText}>
              {JSON.stringify(nutritionData, null, 2)}
            </Text> // Display formatted JSON
          )}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  capturedImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageActions: {
    flexDirection: "row",
  },
  nutritionDataContainer: {
    marginTop: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  jsonText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  errorText: {
    color: "red",
    fontSize: 14,
  },
});
