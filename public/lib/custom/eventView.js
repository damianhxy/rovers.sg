$(document).ready(function() {
    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";

    console.info("[info] eventView.js is running.");

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
            url: "/events/edit",
            disabled: true,
            ajaxOptions: {
                dataType: "json"
            },
            success: function(data) {
                $("[data-name='" + data.field + "']").parent().parent().toggleClass("field-hidden", !data.value);
                if (data.field === "link") {
                    setTimeout(function () {
                        $("[data-name='link']").editable("setValue", data.value);
                    }, 500);
                    $("[data-name='link']").parent().prev().find("a").attr("href", data.value);
                } else if (data.field === "title") {
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
            template: "DD / MM / YYYY     hh : mm A",
            combodate: {
                smartDays: "true",
                minYear: new Date().getFullYear(),
                maxYear: new Date().getFullYear() + 1
            }
        });
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