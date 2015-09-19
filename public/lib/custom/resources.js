$(document).ready(function() {
    if (location.pathname !== "/resources")
        return;

    console.info("[info] resources.js is running.");

    // Toggle editable
    $(".btn-edit").click(function() {
        $("#" + $(this).parent().parent().data("id")).editable("toggleDisabled");
    });

    // X-editable
    $(".field-edit").each(function() {
        $(this).editable({
            type: "text",
            pk: $(this).attr("id"),
            name: "description",
            url: "/resources/edit",
            disabled: true,
            ajaxOptions: {
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

    // Delete modal
    $("#deleteModal").on("show.bs.modal", function(e) {
        var data = $(e.relatedTarget).parent().parent();
        var originalName = data.data("original");
        var addedTime = moment(data.prev().data("value")).format("DD/MM/YYYY HH:mm A");
        // Attach id for x-editable
        $(this).find(".btn-danger").data("id", data.data("id"));
        $("#modalFileName").html("File Name: <strong>" + originalName + "</strong>");
        $("#modalFileTime").html("Added on: <strong>" + addedTime + "</strong>");
    });

    // Ajax
    $("#deleteModal .btn-danger").click(function(e) {
        $.ajax({
            method: "POST",
            url: "/resources/delete",
            data: { id: $(this).data("id") }
        })
        .done(function() {
            $("#deleteModal").modal("hide");
            $("#" + $(e.target).data("id")).closest("tr").remove();
            if (!$("tbody:visible").eq(0).children())
                location.reload();
        })
        .fail(function(err) {
            new PNotify({
                title: "Error",
                text: err.message,
                type: "error"
            });
        });
    });

    // File Name Text
    $(".btn-file :file").on("change", function() {
        $("#upload-name").val($(this).val());
    });
});