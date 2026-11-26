import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { PRESET_IMAGE_PREFIX } from "../constants";
import { createId } from "../domain/id";

const GOALS_DIR = "goals";

export function isPresetImage(uri: string | null | undefined): boolean {
  return !uri || uri.startsWith(PRESET_IMAGE_PREFIX);
}

export function isPersistedGoalImage(uri: string, goalId: string): boolean {
  if (isPresetImage(uri)) return false;
  return (
    uri.includes(`/${GOALS_DIR}/${goalId}.`) ||
    uri.includes(`\\${GOALS_DIR}\\${goalId}.`)
  );
}

export async function persistGoalImage(
  goalId: string,
  sourceUri: string,
): Promise<string> {
  if (isPresetImage(sourceUri) || isPersistedGoalImage(sourceUri, goalId))
    return sourceUri;
  const extension = extensionFromUri(sourceUri);
  if (Platform.OS === "web" || !FileSystem.documentDirectory) {
    return sourceUri;
  }
  const dir = `${FileSystem.documentDirectory}${GOALS_DIR}`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(
    () => undefined,
  );
  const destination = `${dir}/${goalId}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function writeGoalImageBytes(
  goalId: string,
  bytes: ArrayBuffer,
  extension: string,
): Promise<string> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) {
    const blob = new Blob([bytes]);
    return URL.createObjectURL(blob);
  }
  const dir = `${FileSystem.documentDirectory}${GOALS_DIR}`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(
    () => undefined,
  );
  const destination = `${dir}/${goalId}.${extension}`;
  const base64 = arrayBufferToBase64(bytes);
  await FileSystem.writeAsStringAsync(destination, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return destination;
}

export async function readImageBytes(
  uri: string,
): Promise<{ bytes: ArrayBuffer; mimeType: string; extension: string } | null> {
  if (isPresetImage(uri)) return null;
  try {
    if (uri.startsWith("file://") && FileSystem.documentDirectory) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const extension = extensionFromUri(uri);
      return {
        bytes: base64ToArrayBuffer(base64),
        mimeType: mimeFromExtension(extension),
        extension,
      };
    }
    const response = await fetch(uri);
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    const extension =
      extensionFromUri(uri) ||
      extensionFromMime(response.headers.get("content-type"));
    return {
      bytes,
      mimeType:
        response.headers.get("content-type") || mimeFromExtension(extension),
      extension,
    };
  } catch {
    return null;
  }
}

export function cloudImageName(goalId: string, extension: string): string {
  return `goal-${goalId}.${extension || "jpg"}`;
}

export function tempImageId(): string {
  return createId();
}

function extensionFromUri(uri: string): string {
  const clean = uri.split("?")[0] ?? uri;
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  if (!match) return "jpg";
  const ext = match[1].toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (
    ext === "png" ||
    ext === "jpg" ||
    ext === "webp" ||
    ext === "gif" ||
    ext === "heic"
  )
    return ext;
  return "jpg";
}

function extensionFromMime(mime: string | null): string {
  if (!mime) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function mimeFromExtension(extension: string): string {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1)
    binary += String.fromCharCode(bytes[i]!);
  return globalThis.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
