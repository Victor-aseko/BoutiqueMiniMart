const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Folder where your images are stored
const ASSETS_DIR = path.join(__dirname, "assets");

// Maximum width/height for Android
const MAX_SIZE = 512;

// Helper to sanitize filenames
function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/\s+/g, "_")     // spaces → underscores
    .replace(/[^a-z0-9_.]/g, ""); // remove invalid chars
}

// Recursively process all images in a folder
function processFolder(folder) {
  fs.readdirSync(folder).forEach(file => {
    const fullPath = path.join(folder, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processFolder(fullPath); // recursive
    } else if (stat.isFile() && /\.(png|jpg|jpeg)$/i.test(file)) {
      const sanitized = sanitizeFilename(file);
      const newFullPath = path.join(folder, sanitized);

      if (fullPath !== newFullPath) {
        fs.renameSync(fullPath, newFullPath);
      }

      sharp(newFullPath)
        .resize(MAX_SIZE, MAX_SIZE, { fit: "inside" }) // maintain aspect ratio
        .toBuffer()
        .then(data => fs.writeFileSync(newFullPath, data))
        .then(() => console.log(`Resized: ${sanitized}`))
        .catch(err => console.error(`Error resizing ${sanitized}:`, err));
    }
  });
}

processFolder(ASSETS_DIR);
