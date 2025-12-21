import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

// Logs for debugging
console.log('☁️ Cloudinary Configured:', {
    cloud_name: config.cloudinary.cloudName ? 'Set' : 'Missing',
    api_key: config.cloudinary.apiKey ? 'Set' : 'Missing',
    api_secret: config.cloudinary.apiSecret ? 'Set' : 'Missing',
});

class CloudinaryService {
    // Upload file buffer to Cloudinary
    async uploadFile(buffer, options = {}) {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                resource_type: 'auto',
                folder: 'knowledge-assistant/documents',
                ...options,
            };

            cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error.message);
                    reject(error);
                } else {
                    resolve({
                        publicId: result.public_id,
                        url: result.secure_url,
                        format: result.format,
                        bytes: result.bytes,
                        resourceType: result.resource_type,
                    });
                }
            }).end(buffer);
        });
    }

    // Delete file from Cloudinary
    async deleteFile(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result.result === 'ok';
        } catch (error) {
            console.error('❌ Cloudinary delete error:', error.message);
            throw error;
        }
    }

    // Get file info
    async getFileInfo(publicId) {
        try {
            const result = await cloudinary.api.resource(publicId);
            return result;
        } catch (error) {
            console.error('❌ Cloudinary get info error:', error.message);
            throw error;
        }
    }
}

const cloudinaryService = new CloudinaryService();

export default cloudinaryService;
