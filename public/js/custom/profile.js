$(function() {
    console.info("[info] profile.js is running.");

    var MOMENT_FORMAT = "D MMM YY | HH:mm[h]";

    // Ace Editor
    var editor = ace.edit("editor");
    var $data = $("[name='data']");
    var $form = $("#NRCForm");
    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/json");
    editor.getSession().on("change", function() {
        $data.val(editor.getSession().getValue());
    });

    // Bootbox
    $(".btn-delete").click(function(e) {
        var $data = $(e.target);
        var name = $data.data("name");
        var time = moment($data.data("time")).format(MOMENT_FORMAT);
        var id = $data.data("id");
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
                            url: "/s",
                            data: { id: id }
                        })
                        .then(function() {
                            location.reload();
                        })
                        .catch(function(err) {
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
