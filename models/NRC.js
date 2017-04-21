var Promise = require("bluebird");
var fs = require("fs");
Promise.promisifyAll(fs);

exports.update = function(data) {
    return fs.writeFileAsync("./controllers/NRCs.js", "exports.NRC = " + data);
};
