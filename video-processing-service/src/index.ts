import express from "express";

const app = express();
const port = 3000;

// root app
app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(
        `Video host processing service listening on http://localhost:${port}`);
});