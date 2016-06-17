$(document).ready(function() {
    console.info("[info] resources.js is running.");

    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";

    // Ajax
    $("#deleteModal .btn-danger").click(function(e) {
        $.ajax({
            method: "DELETE",
            url: "/short",
            data: { url: $(this).data("id") }
        })
        .done(function() {
            $("#deleteModal").modal("hide");
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

    // Delete modal
    $("#deleteModal").on("show.bs.modal", function(e) {
        var data = $(e.relatedTarget).parent().parent().parent();
        var url = data.data("url");
        var time = moment(data.data("time")).format(MOMENT_FORMAT);
        $(this).find(".btn-danger").data("id", url);
        $("#modalURL").html("Short URL: <strong>" + url + "</strong>");
        $("#modalTime").html("Added on: <strong>" + time + "</strong>");
    });
});
