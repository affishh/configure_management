const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Welcome to Blue-Green Deployment App!");
});

app.get("/version", (req, res) => {
    res.send("App Version: v1.0.0");
});

app.get("/health", (req, res) => {
    res.json({ status: "UP" });
});

app.listen(5000, () => {
    console.log("App running on port 5000");
});
