$(document).ready(function() {
    console.info("[info] about.js is running.");

    // Bootbox
    $(".btn-delete").on("click", function(e) {
        var $data = $(e.target);
        var name = $data.data("name");
        var id = $data.data("id");
        var message = "";
        message += "<p>Awardee Name: <strong>" + name + "</strong></p>";
        message += "<p>Are you sure? This record will be <strong>permanently</strong> deleted!</p>";
        bootbox.dialog({
            title: "Remove awardee",
            message: message,
            onEscape: function() {},
            buttons: {
                "Cancel": {
                    className: "btn-default"
                },
                "Delete": {
                    className: "btn-danger",
                    callback: function() {
                        $.ajax({
                            method: "DELETE",
                            url: "/about",
                            data: { id: id }
                        })
                        .done(function() {
                            location.reload();
                        })
                        .fail(function(err) {
                            new PNotify({
                                title: "Error",
                                text: err.message,
                                type: "error"
                            });
                        });
                    }
                }
            }
        });
    });
});
