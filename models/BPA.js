var nedb = require("@seald-io/nedb");
var BPAs = new nedb({ filename: "./database/BPAs", autoload: true });

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
    return BPAs.find({})
    .sort({ name: 1 })
    .execAsync();
};

exports.delete = function(id) {
    return BPAs.removeAsync({ _id: id });
};
