import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //this comes along with node js we donot have to install seprately it helps us to read write remove a file

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });
    // file has been uploaded successfull
    console.log("file is uploaded on cloudinary ", response.url); 
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinaryByUrl = async (fileUrl) => {
  try {
    if (!fileUrl) return false;

    const url = fileUrl.split("?")[0].split("#")[0];
    const parts = url.split("/");
    const uploadIndex = parts.findIndex((p) => p === "upload");
    if (uploadIndex === -1) return false;

    let publicId = parts.slice(uploadIndex + 1).join("/");

    publicId = publicId.replace(/^v\d+\//, "");

    publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, "");

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });

    return result?.result === "ok" || result?.result === "not found";
  } catch (error) {
    return false;
  }
};
export { uploadOnCloudinary, deleteFromCloudinaryByUrl };
