$(document).ready(function() {
	if (location.pathname.split("/")[1] === "resource") {
		// Set first tab to be active
		$(".nav-pills li:eq(0) a").tab("show");

		// Target tabs by hash
		var url = document.URL.toString();
		if (url.match("#")) {
			$(".nav-pills a[href='#" + url.split("#")[1] + "']").tab("show");
		}

		// Change hash
		$(".nav-pills a").on("show.bs.tab", function(e) {
			window.location.hash = e.target.hash;
		});

		// Change uploaded file name text
		$(".btn-file :file").on("change", function() {
			var label = $(this).val().replace(/\\/g, '/').replace(/.*\//, '');
			$("#fileName").val(label);
			if (!$("#fileTitle").val()) {
				$("#fileTitle").val(label);
			}
		});

		// Edit Modal
		$(".edit-title").each(function() {
			$(this).editable({
				type: "text",
				pk: $(this).attr("id"),
				name: "title",
				url: "/edit",
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
					text: err,
					type: "error"
				});
			});
		});
	}

	// Lightbox
	$("[data-toggle='lightbox']").on("click", function(e) {
	    e.preventDefault();
	    $(this).ekkoLightbox();
	});

	// Active Links
	$("nav a[href='" + location.pathname + "']").parent().addClass("active");
});