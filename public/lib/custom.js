// File Size Sorting
$.fn.dataTable.ext.type.order["file-size-pre"] = function(e) {
	var units = e.replace(/[\d\.]/g, '').toLowerCase();
	var map = {
		"b": 1,
		"kb": 1 << 10,
		"mb": 1 << 20,
		"gb": 1 << 30
	};
	return parseFloat(e) * map[units];
};

$(document).ready(function() {
	// DataTables
	if (location.pathname.split("/")[1] === "resource") {
		$(".table").DataTable({
			"columnDefs": [{
				"type": "file-size",
				"targets": 1
			}],
			"order": [[2, "desc"]],
			"deferRender": true,
			"language": {
				"emptyTable": "No files found",
				"zeroRecords": "No matching files found"
			}
		});
		$("tab-pane").eq(0).addClass("in active"); // Set first tab to be active
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