$(document).ready(function() {
    if (location.pathname !== "/contact")
        return;

    console.info("[info] contact.js is running.");

    $("form").on("submit", function(e) {
        e.preventDefault();
        $.ajax({
            method: "POST",
            url: "/contact/form",
            data: $(this).serialize()
        })
        .then(function() {
            new PNotify({
                title: "Success",
                text: "Your message has been recorded",
                type: "success"
            });
            $(e.target).trigger("reset");
        })
        .fail(function(err) {
            new PNotify({
                title: "Error",
                text: "There was an error recording your response",
                type: "error"
            });
        });
    });
});