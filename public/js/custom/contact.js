$(function() {
    console.info("[info] contact.js is running.");

    $("#contactForm").submit(function(e) {
        e.preventDefault();
        $.ajax({
            method: "POST",
            url: "/contact",
            data: $(this).serialize()
        })
        .then(function() {
            new PNotify({
                title: "Success",
                text: "Your feedback has been recorded",
                type: "success"
            });
            $(e.target).trigger("reset");
        })
        .catch(function(err) {
            new PNotify({
                title: "Error",
                text: "There was an error recording your feedback",
                type: "error"
            });
        });
    });

    $("#feedbackForm").submit(function(e) {
        e.preventDefault();
        $.ajax({
            method: "POST",
            url: "/feedback",
            data: $(this).serialize()
        })
        .then(function() {
            new PNotify({
                title: "Success",
                text: "Your feedback has been recorded",
                type: "success"
            });
            $(e.target).trigger("reset");
        })
        .catch(function(err) {
            new PNotify({
                title: "Error",
                text: "There was an error recording your feedback",
                type: "error"
            });
        });
    });
});
