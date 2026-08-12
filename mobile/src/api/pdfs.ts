import { apiClient } from '@/api/client';
import type { PdfItem } from '@/types';

export async function getPdfs(options?: { search?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.tag) params.set('tag', options.tag);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiClient.get<{ pdfs: PdfItem[] }>(`/api/pdfs${query}`);
}

export async function getPdfById(id: string) {
  return apiClient.get<{ pdf: PdfItem }>(`/api/pdfs/${id}`);
}

export async function createPdf(payload: {
  title: string;
  pdfUrl: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
}) {
  return apiClient.post<{ pdf: PdfItem }>('/api/pdfs', payload);
}

export async function updatePdf(id: string, payload: Partial<PdfItem>) {
  return apiClient.patch<{ pdf: PdfItem }>('/api/pdfs', { id, ...payload });
}

export async function deletePdf(id: string) {
  return apiClient.delete(`/api/pdfs?id=${encodeURIComponent(id)}`);
}

export async function togglePdfFavorite(id: string) {
  return apiClient.patch<{ pdf: PdfItem }>('/api/pdfs', { id, action: 'favorite' });
}