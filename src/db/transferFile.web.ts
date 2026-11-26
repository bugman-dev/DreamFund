import * as DocumentPicker from "expo-document-picker";

export async function shareJson(
  filename: string,
  contents: string,
): Promise<void> {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function pickJson(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    base64: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if (asset.file) return asset.file.text();
  const response = await fetch(asset.uri);
  return response.text();
}
