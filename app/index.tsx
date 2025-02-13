import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Index() {
  const [image, setImage] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [permissionStatus, requestPermission] =
    ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== "granted") {
        Alert.alert(
          "Camera permission required",
          "Please grant camera access to use this feature."
        );
      }

      if (permissionStatus?.status !== "granted") {
        requestPermission(); // Request media library permission if needed
      }
    })();
  }, []);

  const takePicture = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false, // You might want to allow editing for better cropping
      aspect: [4, 3], // Adjust aspect ratio as needed
      quality: 0.8, // Adjust image quality
      base64: true, // Important: Get base64 encoded image for Gemini API
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processImageWithGemini(result.assets[0].base64);
    }
  };

  function cleanGeminiResponse(responseText: any) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const cleanedData = JSON.parse(jsonMatch[0]);
        return cleanedData;
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
      }
    }
    return null;
  }

  const genAI = new GoogleGenerativeAI(
    process.env.EXPO_PUBLIC_GEMINI_API || ""
  );

  const processImageWithGemini = async (base64Image: any) => {
    if (!base64Image) {
      Alert.alert("Error", "No image data to process.");
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

      const prompt =
        'Convert this nutritional information table into JSON using the following format. Create a new nutritionalInfo array entry for EACH \'Per X\' column in the table:\n{\n  "name": "Product Name",\n  "nutritionalInfo": [\n    {\n      "per": "per value as written",\n      "values": {\n        "energy": {\n          "kj": number,\n          "kcal": number\n        },\n        "fat": {\n          "total": number,\n          "saturates": number\n        },\n        "carbohydrate": {\n          "total": number,\n          "sugars": number\n        },\n        "fibre": number,\n        "protein": number,\n        "salt": number\n      }\n    }\n  ]\n}\n\nImportant instructions:\n1. Include ALL columns from the nutrition table, creating a new array entry for each \'Per X\' column\n2. Remove any % values and only use the numerical values\n3. Preserve the original units and precision of numbers as shown in the table\n4. Ensure all columns are processed in the order they appear in the table';

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini API Response Text:", text);

      // Extract JSON from text (assuming text contains the JSON string)
      const cleanedData = cleanGeminiResponse(text);
      if (cleanedData) {
        setNutritionData(cleanedData);
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      Alert.alert(
        "API Error",
        "Failed to process image with Gemini API. Check console for details."
      );
      setNutritionData({ error: "API Request Failed", details: error.message });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nutritional Scanner</Text>

      {!image && (
        <TouchableOpacity style={styles.button} onPress={takePicture}>
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
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.buttonText}>Retake</Text>
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
