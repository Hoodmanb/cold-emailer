export const objectToFormData = (obj: Record<string, any>): FormData => {
  const formData = new FormData();

  const buildFormData = (data: any, parentKey = ''): void => {
    if (data instanceof File || data instanceof Blob) {
      // ✅ Real file or blob
      formData.append(parentKey, data);
    } else if (Array.isArray(data)) {
      data.forEach((value, index) => {
        const key = `${parentKey}[${index}]`;
        buildFormData(value, key);
      });
    } else if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        const fullKey = parentKey ? `${parentKey}[${key}]` : key;
        buildFormData(value, fullKey);
      });
    } else if (data !== null && data !== undefined) {
      formData.append(parentKey, String(data));
    }
  };

  buildFormData(obj);
  return formData;
};
