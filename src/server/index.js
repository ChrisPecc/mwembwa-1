/* becodeorg/mwenbwa
 *
 * /src/server/index.js - Server entry point
 *
 * coded by leny@BeCode
 * started at 18/05/2020
 */

import express from "express";
import path from "path";
const mongoose = require("mongoose");
const treeRoutes = require("./routes/tree");
const userRoutes = require("./routes/user");
const bodyParser = require("body-parser");

mongoose
    .connect("mongodb://dev:dev@mongo:27017/", {
        dbName: "mwenbwa",
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connection to MongoDB successful"))
    .catch(() => console.log("Connection to MongoDB failed"));

const {APP_PORT} = process.env;

const app = express();

app.use(express.static(path.resolve(__dirname, "../../bin/client")));

app.use(bodyParser.json());

app.use("/api/auth", userRoutes);
app.use("/api/tree", treeRoutes);

app.listen(APP_PORT, () =>
    console.log(`🚀 Server is listening on port ${APP_PORT}.`),
);
