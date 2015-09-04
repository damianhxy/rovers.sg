$(document).ready(function() {
    if (location.pathname !== "/contact")
        return;

    console.info("[info] contact.js is running.");

    $("form").on("submit", function(e) {
        e.preventDefault();
        $.ajax({
            method: "POST",
            url: "https://docs.google.com/forms/d/1zjb3DchxXPAlBRPALm8Pm6dkJq6LuMWPo_uXkHEwZig/formResponse",
            data: $(this).serialize()
        })
        .always(function() {
            /* Assume it succeeded */
            new PNotify({
                title: "Success",
                text: "Your message has been recorded",
                type: "success"
            });
            $(e.target).trigger("reset");
        })
    });
});