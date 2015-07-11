// PNotify defaults
PNotify.prototype.options.styling = "fontawesome";
PNotify.prototype.options.delay = 5000;
PNotify.prototype.options.addclass = "stack-bottomleft";
PNotify.prototype.options.nonblock = {
	nonblock: true,
	nonblock_opacity: 0.5
};

$(document).ready(function() {
	// Set first tab to be active
	$(".nav-pills li:eq(0) a").tab("show");

	// Change hash
	$(".nav-pills a").on("show.bs.tab", function(e) {
		window.location.hash = e.target.hash;
	});

	// Target tabs by hash
	var url = document.URL.toString();
	if (url.match("#")) {
		$(".nav-pills a[href='#" + url.split("#")[1] + "']").tab("show");
	}

	// Lightbox
	$("[data-toggle='lightbox']").on("click", function(e) {
	    e.preventDefault();
	    $(this).ekkoLightbox();
	});

	// Active Link
	$("nav a[href='" + location.pathname + "']").parent().addClass("active");

	if (location.pathname === "/resource") {
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
			var data = $(e.relatedTarget).parent();
			$(this).find(".btn-danger").data("id", data.data("id"));
			$("#modalFileName").html("File Name: <strong>" + data.data("original") + "</strong>");
		});

		$("#deleteModal .btn-danger").click(function(e) {
			$.ajax({
				method: "POST",
				url: "/resource/delete",
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
				$("#" + $(e.target).data("id")).closest("tr").remove();
			})
			.fail(function(err) {
				new PNotify({
					title: "Error",
					text: err,
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
	}
});