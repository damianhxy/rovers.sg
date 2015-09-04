$(document).ready(function() {
    if (location.pathname.split("/").slice(0,3).join("/") !== "/events/view")
        return;

    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";

    console.info("[info] eventsView.js is running.");

    // Hide empty fields
    $(".field-hidden").css("display", "none");

    // Toggle editable
    $(".btn-edit").click(function() {
        $(".field-edit").editable("toggleDisabled");
        if ($(".field-hidden").css("display") === "none")
            $(".field-hidden").css("display", "");
        else
            $(".field-hidden").css("display", "none");
    });

    // X-editable
    $(".field-edit").each(function() {
        $(this).editable({
            pk: $(this).closest("[data-id]").data("id"),
            url: "/events/edit",
            disabled: true,
            error: function(res) {
                new Pnotify({
                    title: "Error",
                    text: res.responseText,
                    type: "error"
                });
            },
            /* For combodate */
            format: MOMENT_FORMAT,
            template: "DD / MM / YYYY     hh : mm A",
            combodate: {
                smartDays: "true",
                minYear: new Date().getFullYear(),
                maxYear: new Date().getFullYear() + 1
            }
        });
    });

    // Update tab name
    $("[data-name='title']").on("save", function(e, params) {
        document.title = params.newValue + " | Rover.sg";
    });

    // Update link href
    $("[data-name='link']").on("save", function(e, params) {
        $(this).parent().prev().find("a").attr("href", params.newValue);
    });

    // Delete Modal
    $("#deleteModal").on("show.bs.modal", function(e) {
        var $data = $(e.relatedTarget);
        var eventName = $data.data("title");
        var createdTime = moment($data.data("time")).format(MOMENT_FORMAT);
        $("#modalEventName").html("Event name: <strong>" + eventName + "</strong>");
        $("#modalEventTime").html("Created on: <strong>" + createdTime + "</strong>");
    });

    // Ajax
    $("#deleteModal .btn-danger").click(function(e) {
        $.ajax({
            method: "POST",
            url: "/events/delete",
            data: { id: $(this).closest("[data-id]").data("id") }
        })
        .then(function() {
            $("#deleteModal").modal("hide");
            location.assign("/");
        })
        .fail(function(err) {
            new PNotify({
                title: "Error",
                text: err.message,
                type: "error"
            });
        });
    });
});