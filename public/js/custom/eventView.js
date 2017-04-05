$(function() {
    console.info("[info] eventView.js is running.");

    var MOMENT_FORMAT = "D MMM YY | HH:mm[h]";

    // Hide empty fields
    $(".field-hidden").hide();

    // Toggle editable
    $(".btn-edit").click(function() {
        $(".field-edit").editable("toggleDisabled");
        $(".field-hidden").toggle();
    });

    // X-editable
    $(".field-edit").each(function() {
        $(this).editable({
            pk: $(this).closest("[data-id]").data("id"),
            url: "/events",
            disabled: true,
            ajaxOptions: {
                type: "put",
                dataType: "json"
            },
            success: function(data) {
                $("[data-name='" + data.field + "']").parent().parent().toggleClass("field-hidden", !data.value);
                if (data.field === "link") {
                    setTimeout(function () {
                        $("[data-name='link']").editable("setValue", data.value);
                        $("[data-name='link']").attr("href", data.value);
                    }, 500);
                } else if (data.field === "title") {
                    $(".btn-delete").first().data("name", data.value);
                    document.title = data.value + " | Rover.sg";
                    $("[href='#deleteModal']").data("title", data.value);
                }
            },
            error: function(data) {
                new PNotify({
                    title: "Error",
                    text: data.responseJSON.error,
                    type: "error"
                });
            },
            /* For combodate */
            format: MOMENT_FORMAT,
            template: "D / MMM / YY | HH : mm",
            combodate: {
                smartDays: "true",
                minYear: new Date().getFullYear(),
                maxYear: new Date().getFullYear() + 1
            }
        });
    });

    // Bootbox - Event
    $(".btn-delete").click(function(e) {
        var $data = $(e.target);
        var name = $data.data("name");
        var time = moment($data.data("time")).format(MOMENT_FORMAT);
        var id = $data.data("id");
        var message = "";
        message += "<p>Event Name: <strong>" + name + "</strong></p>";
        message += "<p>Created on: <strong>" + time + "</strong></p>";
        message += "<p>Are you sure? This event will be <strong>permanently</strong> deleted!</p>";
        bootbox.dialog({
            title: "Delete event",
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
                            url: "/events",
                            data: { id: id }
                        })
                        .then(function() {
                            location.assign("/upcoming");
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

    // Bootbox - photos
    $(".btn-delete-photo").click(function(e) {
        var $data = $(e.target);
        var name = $data.data("name");
        var time = moment($data.data("time")).format(MOMENT_FORMAT);
        var eventid = $(".btn-delete").data("id");
        var message = "";
        message += "<p>Photo Name: <strong>" + name + "</strong></p>";
        message += "<p>Uploaded on: <strong>" + time + "</strong></p>";
        message += "<p>Are you sure? This photo will be <strong>permanently</strong> deleted!</p>";
        bootbox.dialog({
            title: "Delete photo",
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
                            url: "/events/" + eventid,
                            data: { name: name }
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

    // File name(s) text
    $(".btn-file :file").change(function(e) {
        var fileNames = "";
        file = $(e.target).get(0);
        for (var a = 0; a < file.files.length; ++a) {
            fileNames += file.files[a].name + "\n";
        }
        $("#uploadName").attr("rows", file.files.length);
        $("#uploadName").val(fileNames);
    });
});
