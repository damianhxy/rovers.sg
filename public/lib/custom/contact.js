$(document).ready(function() {
    console.info("[info] contact.js is running.");

    $("#feedbackForm").on("submit", function(e) {
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