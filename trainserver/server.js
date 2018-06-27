const express = require("express");
const app = express();
const sqlite = require("sqlite3");
const fs = require("fs");
const zlib = require("zlib");

let db = new sqlite.Database('training.db');
let webScript = fs.readFileSync("script.js");

/* one time code to populate the db
console.log("Unzipping messages...");
let trainingData = JSON.parse(zlib.gunzipSync(fs.readFileSync("../data/messages.json.gz")));
console.log("Writing to DB...");
let query = db.prepare("INSERT INTO training_data (messages, average_dtime, std_dev_dtime, average_length, std_dev_length, average_levenshtein, std_dev_levenshtein) VALUES (?, ?, ?, ?, ?, ?, ?);");
trainingData.forEach((datum) => {
    query.run(JSON.stringify(datum.messages), datum.avgtime, datum.sdtime, datum.avglength, datum.sdlength, datum.avglev, datum.sdlev);
});
query.finalize();
*/

app.get("/", (req, res) => {
    db.get('SELECT * FROM training_data ORDER BY RANDOM() LIMIT 1', [], (err, row) => {
        let html = "";
        let messages = JSON.parse(row.messages);
        messages.forEach((message) => {
            html += `${message.msg}<br>`
        });

        let document = `<html><head><script>var id = ${row.id};${webScript}</script></head><body><h1>Attorney Online - Is This Spam?</h1><h3>Help fight spam by training the computer to recognize what spam does and does not look like.</h3><p>Note: Shitposting does not mean the message is spam. Spam is messages where the goal is to disrupt anything else.</p><hr>${html}<hr><button onclick="guilty()">Yes, This is spam</button><button onclick="innocent()">No, this is not spam</button></body></html>`;
        res.send(document);
    });
});

app.get("/guilty", (req, res) => {
    let id = req.query.id;
    if(id == undefined){
        res.send("Bad request");
        return;
    }
    let query = db.prepare("UPDATE training_data SET yes_votes = yes_votes + 1 WHERE ID = ?");
    query.run(id);
    res.send("success");
});

app.get("/innocent", (req, res) => {
    let id = req.query.id;
    if(id == undefined){
        res.send("Bad request");
        return;
    }
    let query = db.prepare("UPDATE training_data SET no_votes = no_votes + 1 WHERE ID = ?");
    query.run(id);
    res.send("success");
});

app.listen(8099, () => console.log("Listening..."));