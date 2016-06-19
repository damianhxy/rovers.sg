$(document).ready(function() {
    console.info("[info] resources.js is running.");

    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";

    // Bootbox
    $(".btn-delete").on("click", function(e) {
        var $data = $(e.target);
        var name = $data.data("name");
        var time = moment($data.data("time")).format(MOMENT_FORMAT);
        var message = "";
        message += "<p>Short URL: <strong>" + name + "</strong></p>";
        message += "<p>Created on: <strong>" + time + "</strong></p>";
        message += "<p>Are you sure? This link will be <strong>permanently</strong> deleted!</p>";
        bootbox.dialog({
            title: "Delete link",
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
                            url: "/short",
                            data: { url: name }
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
