import https from 'https';
import fs from 'fs';

const url = 'https://cdn.dribbble.com/userupload/16173984/file/original-b16f18e43f879cc0651218953dd95e02.png?resize=752x&vertical=center';
const dest = 'C:/Users/Dell/.gemini/antigravity/brain/75f051e4-6a8a-41a8-8441-18517c19c29f/dribbble_ref.png';

const file = fs.createWriteStream(dest);
https.get(url, (response) => {
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    https.get(response.headers.location, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('DOWNLOAD_SUCCESS');
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('DOWNLOAD_SUCCESS');
    });
  }
}).on('error', (err) => {
  console.error('DOWNLOAD_ERROR:', err.message);
});
