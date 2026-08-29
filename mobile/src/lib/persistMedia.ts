import * as FileSystem from 'expo-file-system';
import { uploadMediaFile } from '@/api/media';
import { isDurableMediaUrl } from '@/lib/durableMedia';
import { networkMonitor } from '@/lib/networkMonitor';

export { isDurableMediaUrl } from '@/lib/durableMedia';

function fileNameFromUri(uri: string, fallback: string) {
  const piece = uri.split('/').pop() || fallback;
  return piece.split('?')[0] || fallback;
}

export async function toDataUrl(uri: string, mimeType: string) {
  if (uri.startsWith('data:')) return uri;
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${mimeType};base64,${base64}`;
}

function looksLikeImage(uri: string, mimeType: string) {
  return mimeType.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic)$/i.test(uri);
}

export async function persistMediaUrl(
  uri: string,
  options?: { name?: string; mimeType?: string; upload?: boolean },
) {
  if (!uri || isDurableMediaUrl(uri)) return uri;

  const mimeType = options?.mimeType || 'image/jpeg';
  const name = options?.name || fileNameFromUri(uri, 'file');
  const image = looksLikeImage(uri, mimeType);

  if (options?.upload !== false && networkMonitor.isOnline()) {
    try {
      const uploaded = await uploadMediaFile({ uri, name, mimeType });
      if (uploaded?.url && isDurableMediaUrl(uploaded.url)) return uploaded.url;
    } catch (error) {
      console.warn('[Media] Upload failed, embedding in note', error);
    }
  }

  if (image) {
    try {
      return await toDataUrl(uri, mimeType.startsWith('image/') ? mimeType : 'image/jpeg');
    } catch (error) {
      console.warn('[Media] Could not embed image, keeping local file', error);
    }
  }

  return uri;
}
