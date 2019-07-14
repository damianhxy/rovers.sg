$(function() {
    console.info("[info] about.js is running.");

    function showNRCPhoto(target) {
        $(".NRC-photo").hide();
        $(target).show();
    }

    $("[data-toggle='pill']").click(function(e) {
        showNRCPhoto(e.target.getAttribute("title").replace(" ", "-"));
    });

    // Init to first pill
    $("#nrc-menu").children().first().children().click();

    // Bootbox
    $(".btn-delete").click(function(e) {
        var $data = $(e.target);
        var name = $data.data("name");
        var id = $data.data("id");
        var message = "";
        message += "<p>Awardee Name: <strong>" + name + "</strong></p>";
        message += "<p>Are you sure? This record will be <strong>permanently</strong> deleted!</p>";
        bootbox.dialog({
            title: "Remove awardee",
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
                            url: "/about/BPA",
                            data: { id: id }
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
});
