import * as FileSystem from 'expo-file-system';
import { apiClient } from '@/api/client';

export async function uploadMediaFile(payload: {
  uri: string;
  name: string;
  mimeType: string;
}) {
  // JSON (not multipart) so the Vercel/Next catch-all keeps the /api/media/upload path.
  const base64 = await FileSystem.readAsStringAsync(payload.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return apiClient.post<{ url: string; name: string; mimeType: string }>(
    '/api/media/upload',
    {
      name: payload.name,
      mimeType: payload.mimeType,
      data: base64,
    },
  );
}
