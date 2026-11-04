// `filename` (optional) is the original name of a file stored outside public/, whose url has no
// extension.
module.exports = function (url, filename) {
  const files = [
    { pattern: "xlsx?", icon: "excel" },
    { pattern: "pptx?", icon: "powerpoint" },
    { pattern: "docx?", icon: "word" },
    { pattern: "pdf", icon: "pdf" },
    { pattern: "(png|jpe?g|gif)", icon: "picture" },
    { pattern: "(zip|rar)", icon: "zip" },
  ];
  let icon = "file-text-o";
  if (url.indexOf("http") === 0) return "cloud";
  const name = typeof filename === "string" && filename ? filename : url;
  files.forEach(function (e) {
    if (RegExp(e.pattern).test(name.split(".").pop())) icon = "file-" + e.icon + "-o";
  });
  return icon;
};
