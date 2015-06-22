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
		$(".table").DataTable({
			"columnDefs": [
				{ "type": "file-size", "targets": 1 },
				{ "type": "file-time", "targets": 2 },
				{ "orderable": false, "targets": "no-sort"}
			],
			"order": [[2, "desc"]], // Sort by date first
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
		$(document).change(".btn-file :file", function() {
			var label = $(this).val().replace(/\\/g, '/').replace(/.*\//, '');
			$("#filename").val(label);
			$("#filetitle").val() || $("#filetitle").val(label);
		});

		// Edit Modal
		/* Add Toggle, Pointer */
		$(".edit-btn").click(function() {
			var fileid = $(this).parent().data("id");
			$("#edit-" + fileid).editable({
				type: "text",
				pk: fileid,
				name: "title",
				url: "/edit"
			});
		});

		// Delete Modal
		$("#deleteModal").on("show.bs.modal", function(e) {
			var data = $(e.relatedTarget).parent();
			$(this).find(".btn-danger").data("_id", data.data("_id"));
			$(this).find(".file-name").html("File Name: <strong>" + data.data("original") + "</strong>");
		});
		$("#deleteModal .btn-danger").click(function(e) {
			/* Send DELETE request, delete row */
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

	// Alerts
	/* Code */
});