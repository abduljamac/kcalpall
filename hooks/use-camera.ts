import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const useCamera = () => {
  const [image, setImage] = useState<string | null>(null);
  const [permissionStatus, requestPermission] =
    ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    requestCameraPermissions();
  }, []);

  const requestCameraPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== "granted") {
      Alert.alert("Camera permission required");
    }

    if (permissionStatus?.status !== "granted") {
      requestPermission();
    }
  };

  const takePicture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    return !result.canceled ? result.assets[0] : null;
  };

  return { image, setImage, takePicture };
};
