const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');
const fs = require("fs");

let spam = JSON.parse(fs.readFileSync("json/spam.json"));
let notSpam = JSON.parse(fs.readFileSync("json/not_spam.json"));
let test = JSON.parse(fs.readFileSync("json/test.json"));

let xArr = [];
let yArr = [];
spam.forEach(element => {
  xArr.push(Object.values(element));
  yArr.push(1);
});
notSpam.forEach(element => {
  xArr.push(Object.values(element));
  yArr.push(0);
});

//let ones = Array.apply(null, Array(spam.length)).map(Number.prototype.valueOf,1);
//let zeroes = Array.apply(null, Array(notSpam.length)).map(Number.prototype.valueOf,0);
//yArr = ones.concat(zeroes);

// Set the backend to TensorFlow:
tf.setBackend('tensorflow');

// Train a simple model:
const model = tf.sequential();
model.add(tf.layers.dense({units: 30, activation: 'relu', inputShape: [6], biasInitializer: "randomNormal", kernelInitializer: "randomNormal"}));
model.add(tf.layers.dense({units: 1, activation: 'sigmoid', biasInitializer: "randomNormal", kernelInitializer: "randomNormal"}));
model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});

// Input paramaters:
// Stats are computed across groups of 10 messages (per IPID)
// average time (seconds) between each message
// standard deviation of message timing
// average length of messages
// standard deviation of message length
// average Levenshtein distance
// standard deviation of Levenshtein distance

// Outputs:
// There should only be one, likelihood of spam

// xs is training input
// ys is "correct" output
const xs = tf.tensor(xArr);
const ys = tf.tensor(yArr);


model.fit(xs, ys, {
  epochs: 50,
  shuffle: true,
  callbacks: {
    onEpochEnd: async (epoch, log) => {
      console.log(`Epoch ${epoch}: loss = ${log.loss}`);
    }
  }
}).then(() => {
  let testArr = [];
  for(let i = 0; i < test.length; i++){
    testArr[i] = Object.values(test[i]).slice(2);
  }
  let stats = tf.tensor(testArr);
  let predictions = model.predict(stats).dataSync();
  console.log("Building output...");
  let fileOut = "";
  for(let i = 0; i < test.length; i++){
    let msgs = JSON.parse(test[i].messages);
    msgs.forEach(msg => {
      fileOut += `${msg.msg}\r\n`;
    });
    fileOut += `Spam confidence: ${predictions[i] * 100}%\r\n`;
    let isSpam = predictions[i] > 0.4;
    fileOut += isSpam ? "This message is likely to be spam.\r\n" : "This message is unlikely to be spam.\r\n";
    fileOut += "------------------------------------------------------------\r\n";
  }
  fs.writeFileSync("output.txt", fileOut);
});