const axios = require('axios');

/**
 * Upload a base64 image to free image hosting (imgbb) and return URL
 * Requires process.env.IMGBB_API_KEY
 */
async function uploadBase64Image(base64) {
  if (!process.env.IMGBB_API_KEY) {
    throw new Error('IMGBB_API_KEY is not configured');
  }
  // Strip data URL prefix if present
  const imageData = base64.replace(/^data:image\/\w+;base64,/, '');
  const form = new URLSearchParams();
  form.append('key', process.env.IMGBB_API_KEY);
  form.append('image', imageData);

  const res = await axios.post('https://api.imgbb.com/1/upload', form.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  if (res.data && res.data.success) {
    return { url: res.data.data.url, deleteUrl: res.data.data.delete_url };
  }
  throw new Error('Image upload failed');
}

module.exports = { uploadBase64Image };


