// ============================================================
// Cloudinary Upload Helper
// Cloud Name: mfsjx1oc
// ⚠️ IMPORTANT: Replace UPLOAD_PRESET below with your actual
//    Unsigned Upload Preset name from:
//    Cloudinary Dashboard → Settings → Upload → Upload Presets
// ============================================================

const CLOUD_NAME = 'mfsjx1oc';
const UPLOAD_PRESET = 'iot365_unsigned'; // ← change this to your preset name

/**
 * Uploads a File to Cloudinary and returns the secure URL.
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @param {string} folder - Cloudinary folder path (optional)
 * @returns {Promise<string>} - The secure download URL
 */
export async function uploadToCloudinary(file, onProgress = null, folder = 'iot365/projects') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        let message = 'Cloudinary upload failed';
        try {
          const errData = JSON.parse(xhr.responseText);
          message = errData?.error?.message || message;
        } catch { /* ignore */ }
        reject(new Error(message));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
    xhr.send(formData);
  });
}

/**
 * Compresses an image using Canvas before uploading.
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality (0–1)
 * @returns {Promise<File>}
 */
export function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return resolve(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        if (h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
