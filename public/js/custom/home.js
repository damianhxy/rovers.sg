$(function() {
    console.info("[info] home.js is running.");

    $("#mailingForm").submit(function(e) {
        e.preventDefault();
        $.ajax({
            method: "POST",
            url: "/mailing",
            data: $(this).serialize()
        })
        .then(function() {
            new PNotify({
                title: "Success",
                text: "Your details have been recorded",
                type: "success"
            });
            $(e.target).trigger("reset");
        })
        .catch(function(err) {
            new PNotify({
                title: "Error",
                text: "There was an error recording your details",
                type: "error"
            });
        });
    });
});
