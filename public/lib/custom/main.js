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
		prevArrow: $(".carousel-prev"),
		nextArrow: $(".carousel-next")
	});

	// Hide fa elements from screen readers
	$(".fa").attr("aria-hidden", true);

	// Active Link
	$("nav a[href='/" + location.pathname.split("/")[1] + "']").parent().addClass("active");
});
