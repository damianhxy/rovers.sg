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

$(function() {
	console.info("[info] main.js is running.");

	// Lightbox
	$("[data-toggle='lightbox']").click(function(e) {
	    e.preventDefault();
	    $(this).ekkoLightbox();
	});

    // Select 2
    $("[data-toggle='select2']").select2({
        theme: "bootstrap"
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

    // Show first pill
    $(".nav-pills li:first-child a").tab("show");

	// Active Link
    var active = $("nav a[href='" + location.pathname + "']").parent();
	active.addClass("active");
    // Highlight parent too
    active.closest("li.dropdown").addClass("active");

    // Full Calendar
    $("#calendar").fullCalendar({
        header: {
            left: "prev,next today",
            center: "title",
            right: "month,agendaWeek,agendaDay"
        },
        events: "/events/feed"
    });
});
