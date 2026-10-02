import zlib from "zlib";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(toCrc) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPNG(width, height, getPixel) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      raw[offset++] = Math.max(0, Math.min(255, Math.round(r)));
      raw[offset++] = Math.max(0, Math.min(255, Math.round(g)));
      raw[offset++] = Math.max(0, Math.min(255, Math.round(b)));
      raw[offset++] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdrData),
    makeChunk("IDAT", idatData),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

// Draw the Restaurant Food Platter / Cloche on Emerald-to-Amber Gradient
function renderRestaurantIconPixel(x, y, w, h) {
  // Normalize coordinates to 0..1
  const nx = x / (w - 1);
  const ny = y / (h - 1);

  // Squircle distance from center
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  const rad = 0.44;
  const cornerRadius = 0.12;

  // Squircle SDF (signed distance function)
  const qx = Math.abs(cx) - (rad - cornerRadius);
  const qy = Math.abs(cy) - (rad - cornerRadius);
  const distOutside = Math.sqrt(Math.max(0, qx) ** 2 + Math.max(0, qy) ** 2) - cornerRadius;
  const distInside = Math.min(Math.max(qx, qy), 0);
  const dist = distOutside + distInside;

  // Anti-aliased outer edge
  const aa = 1 / Math.min(w, h);
  const alphaSquircle = Math.max(0, Math.min(1, 0.5 - dist / aa));

  if (alphaSquircle <= 0.01) {
    return [0, 0, 0, 0];
  }

  // Background Gradient: Emerald (#059669 -> #10b981) to Amber (#f59e0b)
  const gradT = Math.max(0, Math.min(1, (nx + ny) * 0.7));
  let bgR = 5 + (245 - 5) * gradT;
  let bgG = 150 + (158 - 150) * gradT;
  let bgB = 105 + (11 - 105) * gradT;

  // Inner subtle highlight border
  if (dist > -0.025 && dist <= 0) {
    bgR += 40;
    bgG += 40;
    bgB += 40;
  }

  let r = bgR;
  let g = bgG;
  let b = bgB;
  let a = alphaSquircle * 255;

  // Centered Restaurant Cloche & Platter
  // Normalized icon area: center is cx=0, cy=0
  // Platter Tray: y in [0.12, 0.18], width around [-0.28, 0.28]
  if (cy >= 0.12 && cy <= 0.18 && Math.abs(cx) <= 0.28) {
    // Golden Tray Rim
    r = 254;
    g = 215;
    b = 100;
  }
  // Platter Base bottom curve: y in [0.18, 0.26]
  else if (cy > 0.18 && cy <= 0.26) {
    const bottomW = 0.24 * (1 - (cy - 0.18) / 0.10);
    if (Math.abs(cx) <= bottomW) {
      r = 240;
      g = 245;
      b = 245;
    }
  }
  // Cloche Dome: y in [-0.14, 0.12]
  else if (cy >= -0.14 && cy < 0.12) {
    // Semi-ellipse: (cx / 0.25)^2 + ((cy - 0.12) / 0.26)^2 <= 1
    const domeDist = (cx / 0.25) ** 2 + ((cy - 0.12) / 0.26) ** 2;
    if (domeDist <= 1.0) {
      // Shading on white dome: glossy highlight at top left
      const hl = Math.max(0, 1 - Math.sqrt((cx + 0.08) ** 2 + (cy + 0.05) ** 2) * 3);
      r = 240 + 15 * hl;
      g = 245 + 10 * hl;
      b = 250 + 5 * hl;

      // Golden inner ring
      if (domeDist >= 0.70 && domeDist <= 0.85 && cy > -0.05) {
        r = 251;
        g = 191;
        b = 36;
      }
    }
  }
  // Cloche Knob: circle at cx=0, cy=-0.17, radius 0.045
  else {
    const knobDist = Math.sqrt(cx ** 2 + (cy + 0.17) ** 2);
    if (knobDist <= 0.048) {
      r = 254;
      g = 230;
      b = 120; // Golden yellow knob
    }
    // Steam Swirls above knob: y in [-0.32, -0.22]
    else if (cy >= -0.32 && cy <= -0.22) {
      const steam1 = Math.abs(cx - 0.08 - Math.sin((cy + 0.22) * 30) * 0.03);
      const steam2 = Math.abs(cx + 0.08 + Math.sin((cy + 0.22) * 30) * 0.03);
      const steamMid = Math.abs(cx - Math.sin((cy + 0.22) * 35) * 0.02);
      if (steamMid < 0.015 || steam1 < 0.012 || steam2 < 0.012) {
        r = 255;
        g = 255;
        b = 255;
      }
    }
  }

  return [r, g, b, a];
}

// Multi-image ICO generator wrapping PNG images
function createICO(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = Icon
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const { width, height, buf } of pngBuffers) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(width >= 256 ? 0 : width, 0);
    dir.writeUInt8(height >= 256 ? 0 : height, 1);
    dir.writeUInt8(0, 2); // Palette
    dir.writeUInt8(0, 3); // Reserved
    dir.writeUInt16LE(1, 4); // Color planes
    dir.writeUInt16LE(32, 6); // Bits per pixel
    dir.writeUInt32LE(buf.length, 8); // Size of image data
    dir.writeUInt32LE(offset, 12); // Offset of image data
    dirEntries.push(dir);
    offset += buf.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map((p) => p.buf),
  ]);
}

async function run() {
  console.log("🎨 স্বাদ রেস্টুরেন্ট ব্র্যান্ড Favicon ও আইকন জেনারেশন শুরু হচ্ছে...");

  const png16 = createPNG(16, 16, renderRestaurantIconPixel);
  const png32 = createPNG(32, 32, renderRestaurantIconPixel);
  const png48 = createPNG(48, 48, renderRestaurantIconPixel);
  const png64 = createPNG(64, 64, renderRestaurantIconPixel);
  const png180 = createPNG(180, 180, renderRestaurantIconPixel);
  const png192 = createPNG(192, 192, renderRestaurantIconPixel);
  const png512 = createPNG(512, 512, renderRestaurantIconPixel);

  const icoBuf = createICO([
    { width: 16, height: 16, buf: png16 },
    { width: 32, height: 32, buf: png32 },
    { width: 48, height: 48, buf: png48 },
    { width: 64, height: 64, buf: png64 },
  ]);

  const root = path.resolve(__dirname, "..");

  // Write to src/app
  fs.writeFileSync(path.join(root, "src/app/favicon.ico"), icoBuf);
  fs.writeFileSync(path.join(root, "src/app/icon.png"), png32);
  fs.writeFileSync(path.join(root, "src/app/apple-icon.png"), png180);

  // Write to public
  fs.writeFileSync(path.join(root, "public/favicon.ico"), icoBuf);
  fs.writeFileSync(path.join(root, "public/icon.png"), png32);
  fs.writeFileSync(path.join(root, "public/apple-icon.png"), png180);
  fs.writeFileSync(path.join(root, "public/icon-192.png"), png192);
  fs.writeFileSync(path.join(root, "public/icon-512.png"), png512);

  console.log("✅ সকল ফেভিকন ও অ্যাপ আইকন সফলভাবে তৈরি হয়েছে:");
  console.log("   - src/app/favicon.ico (Multi-res 16, 32, 48, 64)");
  console.log("   - src/app/icon.png (32x32)");
  console.log("   - src/app/apple-icon.png (180x180)");
  console.log("   - public/favicon.ico");
  console.log("   - public/icon.png");
  console.log("   - public/apple-icon.png");
  console.log("   - public/icon-192.png, icon-512.png");
}

run().catch(console.error);
