import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadFolder = "branding" | "menu" | "expenses" | "attachments";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Uploads a base64 or buffer image securely to Cloudinary in the designated folder.
 */
export async function uploadToCloudinary(
  fileBase64OrUrl: string,
  folder: UploadFolder = "menu"
): Promise<CloudinaryUploadResult> {
  const rootFolder = "restaurant-pos";
  const targetFolder = `${rootFolder}/${folder}`;

  try {
    const result = await cloudinary.uploader.upload(fileBase64OrUrl, {
      folder: targetFolder,
      resource_type: "auto",
      transformation: [
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error("[Cloudinary] Upload error:", error);
    throw new Error("Failed to upload image to cloud storage");
  }
}

/**
 * Deletes an obsolete asset from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (error) {
    console.error("[Cloudinary] Delete asset error:", error);
    return false;
  }
}

export { cloudinary };
