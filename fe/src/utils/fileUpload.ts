import axiosInstance from "@/hooks/axios";

export const uploadFileToLocalStorage = async (file: File, _folder = "local_uploads") => {
  try {
    if (!file) {
      return { success: false, message: "No file provided", url: null };
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosInstance.post("/api/artifacts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.status >= 200 && res.status < 300 && res.data?.success) {
      const id = res.data?.data?.id;
      const url = id ? `/api/artifacts/${id}/download` : null;
      return { success: true, message: "File uploaded successfully", url };
    }
    return { success: false, message: res.data?.message || "File upload failed", url: null };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "File upload failed",
      url: null,
    };
  }
};
