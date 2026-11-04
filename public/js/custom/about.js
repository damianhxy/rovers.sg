$(function() {
    console.info("[info] about.js is running.");

    function showNRCPhoto(target) {
        $(".NRC-photo").hide();
        $(target).show();
    }

    $("[data-toggle='pill']").click(function(e) {
        var title = e.target.getAttribute("title") || e.target.getAttribute("data-title");
        showNRCPhoto(title.replace(" ", "-"));
    });

    // Init to first pill
    $("#nrc-menu").children().first().children().click();

    $(".btn-delete").click(function(e) {
        var $button = $(e.currentTarget);
        confirmDelete({
            title: "Remove awardee",
            what: "record",
            details: [["Awardee Name", $button.data("name")]],
            onDelete: function() {
                $.ajax({
                    method: "DELETE",
                    url: "/about/BPA",
                    data: { id: $button.data("id") }
                })
                .then(function() {
                    $button.closest("tr").remove();
                })
                .catch(notifyError);
            }
        });
    });
});
