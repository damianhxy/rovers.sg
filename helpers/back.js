// Where to send the user "back" to: the page they came from, but only if it is on this site.
// Returns a path (never a full URL), so the redirect cannot leave the site.
module.exports = function back(req, fallback) {
  const referer = req.get("Referer");
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === req.protocol + "://" + req.get("host")) return url.pathname + url.search;
    } catch {
      // Malformed header: use the fallback.
    }
  }
  return fallback;
};
