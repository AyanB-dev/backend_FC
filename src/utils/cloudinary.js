//  resuable code for other projects

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// cloudinary configuration

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => { 
    try {
        if(!localFilePath) {
            throw new Error('No file path provided for upload');
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        // console.log("File has been uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);  // remove the locally saved temporary file
        return response;
    }
    catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath);  // remove the locally saved temporary file
        return null;
    }
    
}

export { uploadOnCloudinary };