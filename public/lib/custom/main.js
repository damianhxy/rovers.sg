// PNotify defaults
PNotify.prototype.options.styling = "fontawesome";
PNotify.prototype.options.delay = 2500;
PNotify.prototype.options.addclass = "stack-bottomleft";
PNotify.prototype.options.nonblock = {
	nonblock: true,
	nonblock_opacity: 0.5
};
PNotify.prototype.options.stack = {
	dir1: "up",
	dir2: "right",
	push: "top"
};

$(document).ready(function() {
	console.info("[info] main.js is running.");

	// Change active shortcut item
	/*
	$(window).on("hashchange", function(e) {
		var oldHash = e.originalEvent.oldURL.split("#")[1];
		var newHash = e.originalEvent.newURL.split("#")[1];
		$(".nav-pills a[href='#" + oldHash + "']").removeClass("active");
		$(".nav-pills a[href='#" + newHash + "']").addClass("active");
	});

	var hash = document.URL.split("#")[1];
	if (hash) {
		// Active shortcut item
		$(".nav-pills a[href='#" + hash + "']").addClass("active");
	}
	*/

	// Lightbox
	$("[data-toggle='lightbox']").on("click", function(e) {
	    e.preventDefault();
	    $(this).ekkoLightbox();
	});

	// Slick
	$(".slick").slick({
		infinite: true,
		slidesToShow: 1,
		slidesToScroll: 1,
		dots: true,
		arrows: false
	});

	// Hide fa elements from screen readers
	$(".fa").attr("aria-hidden", true);

	// Show labels only to screen readers
	$("label").addClass("sr-only");

	// Active Link
	$("nav a[href='" + location.pathname + "']").parent().addClass("active");
});