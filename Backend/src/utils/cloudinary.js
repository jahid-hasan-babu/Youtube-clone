import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// Helper function to extract public ID from Cloudinary URL
const extractPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const publicIdWithExtension = parts[parts.length - 1];
  const publicId = publicIdWithExtension.split(".")[0]; // Remove extension
  return publicId;
};

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath); // Delete local file after upload
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath); // Ensure local file is deleted
    return null;
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (url) => {
  try {
    const publicId = extractPublicIdFromUrl(url);
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
