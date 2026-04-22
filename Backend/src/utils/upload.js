const cloudinary = require("../config/cloudinary");

const uploadSelfieFromBase64 = async (base64Image) => {
  if (!base64Image || !base64Image.startsWith("data:image")) {
    throw new Error("Invalid selfie payload");
  }

  const uploaded = await cloudinary.uploader.upload(base64Image, {
    folder: process.env.CLOUDINARY_FOLDER || "attendance-selfies",
    resource_type: "image",
  });

  return uploaded.secure_url;
};

module.exports = { uploadSelfieFromBase64 };
