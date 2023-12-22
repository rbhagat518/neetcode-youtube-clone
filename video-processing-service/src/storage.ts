// this file is responsible for all things storage related with our video processing

// API's to help with file processing production and consumption 

// 1. GCS file interactions
// 2. local file interactions

import {Storage} from '@google-cloud/storage';
import fs from 'fs'; // file system from Node.js native file system library
import ffmpeg from 'fluent-ffmpeg';

const storage = new Storage(); // create an instance of the library

const rawVideoBucketName = "bhagat-yt-raw-videos"; // globally unique bucket names required
const processedVideoBucketName = "bhagat-yt-processed-videos"; // globally unique bucket names required

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/**
 * Creates local directories for raw and processed videos.
 * 
 * we want to place the raw and processed videos in separate folders. That we can boil video processing 
 * down to a producer/consumer problem
 * 
 */
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 *  @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 *  @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 *  @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions("-vf", "scale=-1:360") // 360p
        .on("end", () => {
            // we don't have access to the response and so we can't send a response status
            console.log("Processing finished successfully.");
            resolve();
        })
        .on("error", (err) => {
            console.log(`An error occurred: ${err.message}`);
            reject(err);
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}

/**
 * @param fileName - The name of the file to download from the
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 * take file from bucket and put into our local path
 */
export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({destination: `${localRawVideoPath}/${fileName}`});
    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`
    );

}

/**
 * @param fileName - The name of the file to upload from the
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file is uploaded.
 * take file from path and upload to bucket.
 */
export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);
    await bucket.upload(`${localProcessedVideoPath}/${processedVideoBucketName}`, {
        destination: fileName
    }); // upload signature: upload(path to file in cur dir, keyVal pair of file we want to make in the bucket)
    console.log(
        `${localProcessedVideoPath}/${fileName} has been uploaded to the gs://${processedVideoBucketName}/${fileName} bucket`
    );    
    await bucket.file(fileName).makePublic();
}

/**
 * @param fileName - the name of the file to delete from the 
 * {@link localRawVideoPath} folder
 * @returns a promise that resolves when the file is deleted
 * once the file has been processed, we no longer need the file on our system
 */
 export async function deleteRawVideo(fileName:string){
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/**
 * @param fileName - the name of the file to delete from the 
 * {@link localProcessedVideoPath} folder
 * @returns a promise that resolves when the file is deleted
 * once the file is on the GCS bucket, we no longer need the file on our system
 */
export async function deleteProcessedVideo(fileName:string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * @param filePath - The path of the file to delete.
 * @returns A promsie that resolves when the file has been deleted
 * clean up files after an upload has occurred or if a user requests to delete a file from the interface
 */
function deleteFile(filePath:string): Promise<void> {
    return new Promise<void>((resolve,reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err){
                    console.log(`An error occured while deleting the file at ${filePath}`,err);
                } else {
                    console.log(`File deleted at ${filePath}`);
                    resolve();
                }
            })
        } else {
            console.log("file not found");
            resolve();
        }
    }); 
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true});
        console.log(`Directory created at ${dirPath}`);
    }
}
