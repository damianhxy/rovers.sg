$(document).ready(function() {
    if (location.pathname.split("/")[1] !== "resource")
        return;

    console.info("[info] resources.js is running.");
    // Edit file name
    $(".edit-btn").click(function() {
        $("#" + $(this).parent().data("id")).editable("toggleDisabled");
    });

    // Edit
    $(".edit-title").each(function() {
        $(this).editable({
            type: "text",
            pk: $(this).attr("id"),
            name: "title",
            url: "/resource/edit",
            disabled: true,
            error: function(res) {
                new PNotify({
                    title: "Error",
                    text: res.responseText,
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
        $(this).find(".btn-danger").data("id", data.data("id"));
        $("#modalFileName").html("File Name: <strong>" + originalName + "</strong>");
        $("#modalFileTime").html("Added on: <strong>" + addedTime + "</strong>");
    });

    // Ajax
    $("#deleteModal .btn-danger").click(function(e) {
        $.ajax({
            method: "POST",
            url: "/resource/delete",
            data: { id: $(this).data("id") }
        })
        .done(function() {
            $("#deleteModal").modal("hide");
            new PNotify({
                title: "Success",
                text: "Deleted file",
                type: "success"
            });
            $("#" + $(e.target).data("id")).closest("tr").remove();
        })
        .fail(function(err) {
            new PNotify({
                title: "Error",
                text: err.message,
                type: "error"
            });
        });
    });

    // Change uploaded file name text
    $(".btn-file :file").on("change", function() {
        var label = $(this).val().replace(/\\/g, '/').replace(/.*\//, '');
        $("#fileName").val(label);
        if (!$("#fileTitle").val()) {
            $("#fileTitle").val(label);
        }
    });
});