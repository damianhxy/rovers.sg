$(function() {
    console.info("[info] eventView.js is running.");

    var $event = $("[data-edit-url='/events']");

    // Hide empty fields
    $(".field-hidden").hide();

    // Edit mode (inline editing is in main.js)
    $(".btn-edit").click(function() {
        $event.toggleClass("editing");
        $(".field-hidden").toggle();
    });

    $event.on("field-saved", function(e, response) {
        $("[data-name='" + response.field + "']").closest("tr").toggleClass("field-hidden", !response.value);
        if (response.duration) {
            $("[data-name='duration']").text(response.duration);
        } else if (response.field === "title") {
            document.title = response.value + " | Rovers.sg";
            $(".btn-delete").data("name", response.value);
        }
    });

    $(".btn-delete").click(function(e) {
        var $button = $(e.currentTarget);
        confirmDelete({
            title: "Delete event",
            what: "event",
            details: [
                ["Event Name", $button.data("name")],
                ["Created on", formatTime($button.data("time"))]
            ],
            onDelete: function() {
                $.ajax({
                    method: "DELETE",
                    url: "/events",
                    data: { id: $button.data("id") }
                })
                .then(function() {
                    location.assign("/events");
                })
                .catch(notifyError);
            }
        });
    });

    $(".btn-delete-photo").click(function(e) {
        var $button = $(e.currentTarget);
        var name = $button.data("name");
        confirmDelete({
            title: "Delete photo",
            what: "photo",
            details: [
                ["Photo Name", name],
                ["Uploaded on", formatTime($button.data("time"))]
            ],
            onDelete: function() {
                $.ajax({
                    method: "DELETE",
                    url: "/events/" + $(".btn-delete").data("id"),
                    data: { name: name }
                })
                .then(function() {
                    $button.closest("tr").remove();
                })
                .catch(notifyError);
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
