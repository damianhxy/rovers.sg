$(document).ready(function() {
	// File Size Sorting
	$.fn.dataTable.ext.type.order["file-size-pre"] = function(e) {
		var units = e.replace(/[\d\.]/g, '');
		var map = {
			"b": 1,
			"kb": 1 << 10,
			"mb": 1 << 20,
			"gb": 1 << 30
		};
		return parseFloat(e) * map[units];
	};

	// Date Sorting
	$.fn.dataTable.ext.type.order["file-time-pre"] = function(e) {
		return moment(e, "DD MMMM YYYY, h:mm:ss a").format();
	};

	// DataTables
	if (location.pathname.split("/")[1] === "resource") {
		var table = $(".table").DataTable({
			"columnDefs": [
				{ "type": "file-size", "targets": 2 },
				{ "type": "file-time", "targets": 3 },
				{ "orderable": false, "targets": "no-sort"}
			],
			"order": [[3, "desc"]], // Sort by date first
			"deferRender": true,
			"language": {
				"emptyTable": "No files found",
				"zeroRecords": "No matching files found"
			}
		});

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
				Messenger().success({
					message: "Deleted file",
					id: "page"
				});
				table
				.row($("#" + $(e.target).data("id")).parent().parent())
				.remove()
				.draw();
			})
			.fail(function(err) {
				Messenger().error({
				    message: "Failed to delete file",
				    id: "page"
				});
			});
		});
	} else // Links || Contact Us
		$(".table").DataTable({
			"deferRender": true,
			"language": {
				"emptyTable": "No files found",
				"zeroRecords": "No matching files found"
			}
		});

	// Fancybox
	$(".fancybox").fancybox();

	// Active Links
	$("nav a[href='" + location.pathname + "']").parent().addClass("active");
});