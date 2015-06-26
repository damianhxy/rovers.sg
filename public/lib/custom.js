$(document).ready(function() {
	if (location.pathname.split("/")[1] === "resource") {

		// Set first tab to be active
		$(".nav-pills li:eq(0) a").tab("show");

		// Target tabs by hash
		var url = document.URL.toString();
		if (url.match("#"))
			$(".nav-pills a[href='#" + url.split("#")[1] + "']").tab("show");

		// Change hash
		$(".nav-pills a").on("show.bs.tab", function(e) {
			window.location.hash = e.target.hash;
		});

		// Change uploaded file name text
		$(document).on("change", ".btn-file :file", function() {
			var label = $(this).val().replace(/\\/g, '/').replace(/.*\//, '');
			$("#fileName").val(label);
			$("#fileTitle").val() || $("#fileTitle").val(label);
		});

		// Edit Modal
		$(".edit-title").each(function() {
			$(this).editable({
				type: "text",
				pk: $(this).attr("id"),
				name: "title",
				url: "/edit",
				disabled: true
			});
		});

		$(".edit-btn").click(function() {
			$("#" + $(this).parent().data("id")).editable("toggleDisabled");
		});

		// Delete Modal
		$("#deleteModal").on("show.bs.modal", function(e) {
			var data = $(e.relatedTarget).parent();
			$(this).find(".btn-danger").data("id", data.data("id"));
			$("#modalFileName").html("File Name: <strong>" + data.data("original") + "</strong>");
		});

		$("#deleteModal .btn-danger").click(function(e) {
			$.ajax({
				method: "POST",
				url: "/delete",
				data: {
					id: $(this).data("id")
				}
			})
			.done(function() {
				$("#deleteModal").modal("hide");
				new PNotify({
					title: "Success",
					text: "Deleted file",
					type: "success"
				});
				$("#" + $(e.target).data("id")).parent().parent().remove();
			})
			.fail(function(err) {
				new PNotify({
					title: "Error",
					text: "Failed to delete file",
					type: "error"
				});
			});
		});
	}

	// Lightbox
	$(document).delegate('[data-toggle="lightbox"]', 'click', function(e) {
	    e.preventDefault();
	    $(this).ekkoLightbox();
	});

	// Active Links
	$("nav a[href='" + location.pathname + "']").parent().addClass("active");
});