const fs = require("fs");
const jsQR = require("jsqr");
const { PNG } = require("pngjs");

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node test-qr.cjs <image.png>");
  process.exit(1);
}

const png = PNG.sync.read(fs.readFileSync(filePath));

const result = jsQR(
  new Uint8ClampedArray(png.data),
  png.width,
  png.height
);

if (result) {
  console.log("QR code decoded successfully!");
  console.log("Decoded content:", result.data);
} else {
  console.log("No QR code detected in this image.");
}