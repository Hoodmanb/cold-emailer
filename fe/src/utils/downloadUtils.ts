import axiosInstance from "@/hooks/axios";

/**
 * Download a file with authentication headers
 * @param url The endpoint URL
 * @param filename Desired filename
 * @param format File format for query params
 */
export const downloadAuthenticatedFile = async (url: string, filename: string, format?: string) => {
  try {
    const response = await axiosInstance.get(url, {
      params: format ? { format } : {},
      responseType: 'blob', // Important for handling binary data
    });

    // Create a blob from the response data
    const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    
    // Create a link element, set its href to the blob URL, and trigger a click
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true };
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
};
