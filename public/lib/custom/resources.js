$(document).ready(function() {
    console.info("[info] resources.js is running.");

    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";

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

    // Delete modal
    $("#deleteModal").on("show.bs.modal", function(e) {
        var data = $(e.relatedTarget).parent().parent().parent();
        var originalName = data.data("name");
        var addedTime = moment(data.data("time")).format(MOMENT_FORMAT);
        $(this).find(".btn-danger").data("id", data.attr("id"));
        $("#modalName").html("Resource Name: <strong>" + originalName + "</strong>");
        $("#modalTime").html("Added on: <strong>" + addedTime + "</strong>");
    });

    // Ajax
    $("#deleteModal .btn-danger").click(function(e) {
        $.ajax({
            method: "DELETE",
            url: "/resources",
            data: { id: $(this).data("id") }
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

    // File Name Text
    $("#uploadForm [name='url']").on("keyup", function() {
        $("#uploadForm [name='name']").val($(this).val());
    });

    $(".btn-file :file").on("change", function() {
        $("#uploadForm [name='name']").val($(this).val());
        $("#upload-name").val($(this).val());
    });

    // Form Validation
    $("#uploadForm").on("submit", function(e) {
        e.preventDefault();
        if ($("#uploadForm :file").val() || $("#uploadForm [name='url']").val())
            $(e.target).get(0).submit();
        else
            new PNotify({
                title: "Error",
                text: "Please add a resource.",
                type: "error"
            });
    });
});
