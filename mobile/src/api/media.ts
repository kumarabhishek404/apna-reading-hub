import { apiClient } from '@/api/client';

export async function uploadMediaFile(payload: {
  uri: string;
  name: string;
  mimeType: string;
}) {
  const formData = new FormData();
  formData.append('file', {
    uri: payload.uri,
    name: payload.name,
    type: payload.mimeType,
  } as unknown as Blob);

  return apiClient.post<{ url: string; name: string; mimeType: string }>(
    '/api/media/upload',
    formData,
  );
}
