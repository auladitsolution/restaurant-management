import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-auth";
import { uploadToCloudinary, UploadFolder } from "@/lib/cloudinary/cloudinary";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const contentType = req.headers.get("content-type") || "";

    let fileBase64 = "";
    let folder: UploadFolder = "menu";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      fileBase64 = body.image || body.file;
      folder = body.folder || "menu";
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const folderVal = formData.get("folder") as string;
      if (folderVal) folder = folderVal as UploadFolder;

      if (!file) {
        return NextResponse.json(
          { success: false, message: "কোন ফাইল পাওয়া যায়নি।" },
          { status: 400 }
        );
      }

      // Validate MIME type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: "শুধুমাত্র ছবি (JPG, PNG, WEBP) আপলোড করা যাবে।" },
          { status: 400 }
        );
      }

      // Max size: 5MB
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: "ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।" },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fileBase64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    if (!fileBase64) {
      return NextResponse.json(
        { success: false, message: "ফাইল ডাটা পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    // If Cloudinary credentials are not present (dev placeholder), return a high quality mock image URL
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === "dev_key") {
      return NextResponse.json({
        success: true,
        url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80",
        publicId: "dev-placeholder",
      });
    }

    const result = await uploadToCloudinary(fileBase64, folder);

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error uploading asset";
    console.error("[Upload Route Error]", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
