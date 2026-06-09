// src/lib/urlEncoder.js
export const encodePrescriptionData = (data) => {
  const jsonString = JSON.stringify(data);
  // Base64 encoding (works with UTF-8)
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return base64;
};

export const decodePrescriptionData = (base64) => {
  const jsonString = decodeURIComponent(escape(atob(base64)));
  return JSON.parse(jsonString);
};