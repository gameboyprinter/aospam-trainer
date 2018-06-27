const sqlite = require("sqlite3");
const fs = require("fs");

let db = new sqlite.Database('trainserver/training.db');

// Likely spam according to humans
db.all("SELECT * FROM training_data WHERE yes_votes > no_votes ORDER BY yes_votes DESC;", [], (err, rows) => {
    fs.writeFileSync("json/spam.json", JSON.stringify(rows, filter));
});

// Likely not spam according to humans
db.all("SELECT * FROM training_data WHERE yes_votes < no_votes ORDER BY no_votes DESC;", [], (err, rows) => {
    fs.writeFileSync("json/not_spam.json", JSON.stringify(rows, filter));
});

// Unsure, add to test data
db.all("SELECT * FROM training_data WHERE yes_votes = no_votes;", [], (err, rows) => {
    fs.writeFileSync("json/test.json", JSON.stringify(rows, filter2));
});

function filter(key, value) {
    if(key === "messages") return undefined;
    else if(key === "id") return undefined;
    else if(key === "yes_votes") return undefined;
    else if(key === "no_votes") return undefined;
    else return value;
}

function filter2(key, value) {
    if(key === "yes_votes") return undefined;
    else if(key === "no_votes") return undefined;
    else return value;
}