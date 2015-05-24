$.fn.dataTable.ext.type.order["file-size-pre"] = function (e) {
	var units = e.replace(/[\d\.]/g, '').toLowerCase()
	var map = {
		"b": 1,
		"kb": 1 << 10,
		"mb": 1 << 20,
		"gb": 1 << 30
	}
	return parseFloat(e) * map[units];
}

$(document).ready(function() {
	$(".fancybox").fancybox();
	var loc = location.href.split("/");
	if (loc[3] === "resources") {
		$(".table").DataTable({
			"columnDefs": [{
				"type": "file-size",
				"targets": 1
			}],
			"order": [[2, "desc"]],
			"pagingType": "full_numbers",
			"language": {
				"emptyTable": "No files found",
				"zeroRecords": "No matching files found"
			}
		});
	} else { // Links || Contact Us
		$(".table").DataTable({
			"pagingType": "full_numbers",
			"language": {
				"emptyTable": "No files found",
				"zeroRecords": "No matching files found"
			}
		});
	}
	$("li a[href='/" + loc[3] + "']").eq(0).parent().addClass("active");
	$(".shortcuts a[href='/" + loc[3] + (loc[4] ? '/' + loc[4] : '') + "']").addClass("highlight");
});