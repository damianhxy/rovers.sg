module.exports = function(req, res, next) {
    if (req.isAuthenticated() && req.user.admin)
        return next();
    req.session.error = "Unauthorised";
    res.redirect("/");
};
