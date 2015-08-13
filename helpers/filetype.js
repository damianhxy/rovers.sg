module.exports = function(filename) {
    var files = [
        { pattern: "xlsx?", icon: "excel" }, { pattern: "pptx?", icon: "powerpoint" },
        { pattern: "docx?", icon: "word" }, { pattern :"pdf", icon: "pdf" },
        { pattern: "(png|jpg|gif)", icon: "picture" }, { pattern: "(zip|rar)", icon: "zip" }
    ];
    var icon = "file-text-o";
    files.forEach(function(e) {
        if (RegExp(e.pattern).test(filename.split(".").pop()))
            icon = "file-" + e.icon + "-o";
    });
    return icon;
};