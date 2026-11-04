$(function() {
    console.info("[info] profile.js is running.");

    // Ace Editor
    var editor = ace.edit("editor");
    var $data = $("[name='data']");
    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/json");
    editor.getSession().on("change", function() {
        $data.val(editor.getSession().getValue());
    });

    $(".btn-delete").click(function(e) {
        var $button = $(e.currentTarget);
        confirmDelete({
            title: "Delete link",
            what: "link",
            details: [
                ["Short URL", $button.data("name")],
                ["Created on", formatTime($button.data("time"))]
            ],
            onDelete: function() {
                $.ajax({
                    method: "DELETE",
                    url: "/s",
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
