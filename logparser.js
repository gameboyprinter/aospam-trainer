const fs = require("fs");
const zlib = require("zlib");

console.log("Reading log from disk...");
let wholeLog = fs.readFileSync("data\\unofficial vanilla.log");
console.log("Splitting lines...");
let lines = wholeLog.toString().split("\n");
delete wholeLog;
console.log("Processing lines...");
let dataSet = {};
lines.forEach((line) => {
    let sections = line.split("]");
    let isIC = sections[3] == "[IC";
    if (isIC) {
        let time = Date.parse(sections[0].replace("[", "").replace(",", "."));
        let ipid = sections[1].replace("[", "").trim();
        let msg = sections[sections.length - 1];
        //console.log(`time: ${time} IC: ${isIC} IPID: ${ipid} Message: ${msg}`);
        if (dataSet[ipid] == undefined) {
            dataSet[ipid] = [];
        }
        dataSet[ipid].push({
            time: Math.floor(time / 1000),
            msg: msg
        });
    }
});
let messageGroups = {};
console.log("Processing messages...");
for (let ipid in dataSet) {
    let msgs = dataSet[ipid];
    messageGroups[ipid] = [];
    let currentGroup = 0;
    for (let i = 0; i < msgs.length; i += 10) {
        if (msgs[i + 9] == undefined) {
            // Not enough messages to continue seperating into packs of 10
            break;
        } else {
            let diff = msgs[i + 9].time - msgs[i].time;
            let subset = msgs.slice(i, i + 10);
            // if more than 5 mins elapsed between these two messages then dont use them
            let times = [];
            let lengths = subset.map(obj => obj.msg.length);
            let distance = [];
            for (var n = 0; n < subset.length; n++) {
                if (n == 0) {
                    times[n] = 0;
                    distance[n] = 0;
                } else {
                    times[n] = subset[n].time - subset[n - 1].time;
                    // comment below line out for speed while testing
                    distance[n] = levenshtein(subset[n].msg, subset[n - 1].msg);
                    //distance[n] = 0;
                }
            }
            if (diff < 300) {
                messageGroups[ipid][currentGroup] = {};
                messageGroups[ipid][currentGroup].messages = subset;
                messageGroups[ipid][currentGroup].avgtime = sum(times) / times.length;
                messageGroups[ipid][currentGroup].sdtime = stddev(times);
                messageGroups[ipid][currentGroup].avglength = sum(lengths) / lengths.length;
                messageGroups[ipid][currentGroup].sdlength = stddev(lengths);
                messageGroups[ipid][currentGroup].avglev = sum(distance) / distance.length;
                messageGroups[ipid][currentGroup].sdlev = stddev(distance);
                currentGroup++;
            }
        }
    }
}
console.log("Flattening data...");
let flatData = [];
for(let ipid in messageGroups){
    let groups = messageGroups[ipid];
    groups.forEach((group) => {
        flatData.push(group);
    });
}
console.log("Writing processed data to file...");
fs.writeFileSync("data/messages.json.gz", zlib.gzipSync(JSON.stringify(flatData)));

function stddev(vals) {
    let avg = sum(vals) / vals.length;
    let meanDiffs = [];
    for (let i = 0; i < vals.length; i++) {
        meanDiffs[i] = Math.pow((vals[i] - avg), 2);
    }
    return Math.round(Math.sqrt(sum(meanDiffs) / meanDiffs.length) * 100) / 100;
}

function sum(vals) {
    let total = 0;
    vals.forEach((val) => {
        total += val;
    });
    return total;
}



function levenshtein(a, b) {
    if (a.length == 0) return b.length;
    if (b.length == 0) return a.length;

    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};