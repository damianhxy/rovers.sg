$(document).ready(function() {
	$(".fancybox").fancybox();
	var loc = location.href.split("/");
	$("li a[href='/" + loc[3] + "']").eq(0).parent().addClass("active");
	$(".shortcuts a[href='/" + loc[3] + (loc[4] ? '/' + loc[4] : '') + "']").addClass("highlight");
});