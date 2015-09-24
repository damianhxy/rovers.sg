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

	// Set first tab to be active
	$(".nav-pills li:eq(0) a").tab("show");

	// Change hash
	$(".nav-pills a").on("show.bs.tab", function(e) {
		window.location.hash = e.target.hash;
	});

	// Change active shortcut item
	$(window).on("hashchange", function(e) {
		var oldHash = e.originalEvent.oldURL.split("#")[1];
		var newHash = e.originalEvent.newURL.split("#")[1];
		$(".list-group a[href='#" + oldHash + "']").removeClass("active");
		$(".list-group a[href='#" + newHash + "']").addClass("active");
	});

	var hash = document.URL.split("#")[1];
	if (hash) {
		// Active tab
		$(".nav-pills a[href='#" + hash + "']").tab("show");

		// Active shortcut item
		$(".list-group a[href='#" + hash + "']").addClass("active");
	}

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

	// Append aria-hidden to fa elements
	$(".fa").attr("aria-hidden", true);

	// Active Link
	$("nav a[href='" + location.pathname + "']").parent().addClass("active");
});