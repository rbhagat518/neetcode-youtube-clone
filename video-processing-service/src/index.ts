import express from "express";
import { setupDirectories, downloadRawVideo, uploadProcessedVideo, convertVideo, deleteRawVideo, deleteProcessedVideo } from "./storage";

setupDirectories();

const app = express();
app.use(express.json());

// post request to handle file upload
app.post("/process-video", async (req, res) => {
    // Get the bucket and filename from the Cloud Pub/Sub message

    // from the Cloud Pub/Sub documentation for using Cloud Pub/Sub with Cloud Run tutorial
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);

        if (!data.name) {
            throw new Error('Invalid message payload received');
        }
    }
    catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename. ');
    }

    // neetcode written code
    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    // download the raw video from Cloud Storage
    await downloadRawVideo(inputFileName);

    // process the video
    try {
        await convertVideo(inputFileName, outputFileName)
    } catch(err) {
        // if we're failing while coverting the video, the input file and the output file must be corrupted and we should delete the file
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        console.log(err);
        res.status(500).send('Internal Server Error: video processing failed');
    }

    // upload the processed video to Cloud Storage
    await uploadProcessedVideo(outputFileName);
    // if we succesfully process the video, we can delete from our environment
    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send("Processing finished succesfully");

});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(
        `Video host processing service listening on http://localhost:${port}`);
});