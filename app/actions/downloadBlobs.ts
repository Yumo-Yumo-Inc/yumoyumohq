'use server'

import { list } from '@vercel/blob';

interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

interface BlobResponse {
  success: boolean;
  data: BlobFile[];
  count: number;
  error?: string;
}

export async function getRecentBlobs(): Promise<BlobResponse> {
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - TWO_DAYS_MS);

  try {
    const { blobs } = await list();
    
    const recentBlobs = blobs.filter(blob => 
      new Date(blob.uploadedAt) > cutoffDate
    );

    const mappedData: BlobFile[] = recentBlobs.map(blob => ({
      url: blob.downloadUrl,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt.toString() // Date -> string
    }));

    return {
      success: true,
      data: mappedData,
      count: recentBlobs.length
    };

  } catch (error) {
    console.error('Blob listesi alınırken hata:', error);
    return {
      success: false,
      error: 'Dosyalar alınamadı',
      data: [],
      count: 0
    };
  }
}