$(function() {
    console.info("[info] resources.js is running.");

    // Hide empty descriptions
    $(".field-hidden").hide();

    // Edit mode for one resource card (inline editing is in main.js)
    $(".btn-edit").click(function() {
        $(".field-hidden").toggle();
        $(this).closest(".card").toggleClass("editing");
    });

    $(".card").on("field-saved", function(e, response) {
        if (response.field === "name") $(this).find(".btn-delete").data("name", response.value);
    });

    $(".btn-delete").click(function(e) {
        var $button = $(e.currentTarget);
        confirmDelete({
            title: "Delete resource",
            what: "resource",
            details: [
                ["Resource Name", $button.data("name")],
                ["Uploaded on", formatTime($button.data("time"))]
            ],
            onDelete: function() {
                $.ajax({
                    method: "DELETE",
                    url: "/resources",
                    data: { id: $button.data("id") }
                })
                .then(function() {
                    $button.closest(".panel").remove();
                })
                .catch(notifyError);
            }
        });
    });

    // File Name Text
    $("#uploadForm [name='url']").keyup(function() {
        $("#uploadForm [name='name']").val($(this).val());
    });

    $(".btn-file :file").change(function() {
        var name = $(this).get(0).files.item(0).name
        $("#uploadForm [name='name']").val(name);
        $("#uploadName").val(name);
    });

    // Form Validation
    $("#uploadForm").submit(function(e) {
        e.preventDefault();
        if ($("#uploadForm :file").val() && $("#uploadForm [name='url']").val())
            notify("error", "Error", "Please only add one resource.");
        else if ($("#uploadForm :file").val() || $("#uploadForm [name='url']").val())
            $(e.target).get(0).submit();
        else
            notify("error", "Error", "Please add a resource.");
    });
});
