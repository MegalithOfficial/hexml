const hexml = require("../src/main.js");
const fs = require("fs")

const data = fs.readFileSync("./test.hexml", 'utf8');
const deserializedData = hexml.deserialize(data);

console.log("Deserialized data: \n" + JSON.stringify(deserializedData, null, 1) + "\n");
console.log("Serialized data: \n" + hexml.serialize(deserializedData));

fs.writeFileSync("./writed.hexml", hexml.serialize(deserializedData), { encoding: "utf-8" });