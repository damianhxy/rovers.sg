$(document).ready(function() {
    console.info("[info] resources.js is running.");

    var MOMENT_FORMAT = "D MMM YY | HH:mm[h]";

    // Hide empty descriptions
    $(".field-hidden").hide();

    // Toggle editable
    $(".btn-edit").click(function() {
        $(".field-hidden").toggle();
        $(this).parent().parent().prev().find(".field-edit").editable("toggleDisabled");
    });

    // X-editable
    $(".field-edit").each(function() {
        $(this).editable({
            disabled: true,
            ajaxOptions: {
                type: "put",
                dataType: "json"
            },
            error: function(data) {
                new PNotify({
                    title: "Error",
                    text: data.responseJSON.error,
                    type: "error"
                });
            }
        });
    });

    // Bootbox
    $(".btn-delete").on("click", function(e) {
        var $data = $(e.target);
        var name = $data.data("name");
        var time = moment($data.data("time")).format(MOMENT_FORMAT);
        var id = $data.data("id");
        var message = "";
        message += "<p>Resource Name: <strong>" + name + "</strong></p>";
        message += "<p>Uploaded on: <strong>" + time + "</strong></p>";
        message += "<p>Are you sure? This resource will be <strong>permanently</strong> deleted!</p>";
        bootbox.dialog({
            title: "Delete resource",
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
                            url: "/resources",
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

    // File Name Text
    $("#uploadForm [name='url']").on("keyup", function() {
        $("#uploadForm [name='name']").val($(this).val());
    });

    $(".btn-file :file").on("change", function() {
        $("#uploadForm [name='name']").val($(this).val());
        $("#uploadName").val($(this).val());
    });

    // Form Validation
    $("#uploadForm").on("submit", function(e) {
        e.preventDefault();
        if ($("#uploadForm :file").val() && $("#uploadForm [name='url']").val())
            new PNotify({
                title: "Error",
                text: "Please only add one resource.",
                type: "error"
            });
        else if ($("#uploadForm :file").val() || $("#uploadForm [name='url']").val())
            $(e.target).get(0).submit();
        else
            new PNotify({
                title: "Error",
                text: "Please add a resource.",
                type: "error"
            });
    });
});
