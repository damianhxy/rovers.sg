$(function() {
    console.info("[info] eventView.js is running.");

    var MOMENT_FORMAT = "D MMM YY | HH:mm[h]";
    var $start = $("[data-name='start']");
    var $end = $("[data-name='end']");
    var $duration = $("[data-name='duration']");

    function strip(str) {
        str = str.replace(/\ 0 minutes$/, "");
        str = str.replace(/\ 0 hours$/, "");
        str = str.replace("1 minutes", "1 minute");
        str = str.replace("1 hours", "1 hour");
        str = str.replace("1 days", "1 day");
        return str;
    }

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
            success: function(response) {
                $("[data-name='" + response.field + "']").closest("tr").toggleClass("field-hidden", !response.value);
                if (response.field === "start" || response.field === "end") {
                    setTimeout(function () {
                        var start = moment($start.text(), MOMENT_FORMAT);
                        var end = moment($end.text(), MOMENT_FORMAT);
                        $duration.text(strip(moment.duration(end.diff(start)).format("d [days] h [hours] m [minutes]")));
                    }, 500);
                } else if (response.field === "link") {
                    $("[data-name='link']").attr("href", response.value);
                    return response;
                } else if (response.field === "title") {
                    $(".btn-delete").first().data("name", response.value);
                    document.title = response.value + " | Rover.sg";
                    $("[href='#deleteModal']").data("title", response.value);
                }
            },
            error: function(response) {
                return response.responseJSON.error;
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
                            location.assign("/events");
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
                            $(e.target).closest("tr").remove();
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
        var fileNames = [];
        var fileList = $(e.target).get(0).files;
        for (var file of fileList) {
            fileNames.push(file.name);
        }
        $("#uploadName").attr("rows", fileList.length);
        $("#uploadName").val(fileNames.join("\n"));
    });
});
