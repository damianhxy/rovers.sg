// X-editable default
$.fn.editable.defaults.mode = 'inline';

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