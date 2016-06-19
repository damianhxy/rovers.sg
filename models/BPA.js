var Promise = require("bluebird");
var nedb = require("nedb");
var BPAs = new nedb({ filename: "./database/BPAs", autoload: true });
Promise.promisifyAll(BPAs);
Promise.promisifyAll(BPAs.find().constructor.prototype);

exports.add = function(req) {
    var BPAInfo = {
        name: req.body.name,
        unit: req.body.unit,
        year: req.body.year,
        honorary: req.body.honorary
    };
    return BPAs.insertAsync(BPAInfo);
};

exports.all = function() {
    return BPAs.find({}).sort({ name: 1 }).execAsync();
};

exports.delete = function(name) {
    return BPAs.removeAsync({ name: name });
};
