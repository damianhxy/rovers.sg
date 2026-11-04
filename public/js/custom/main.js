// Shared helpers for the page scripts: toasts, confirmation dialogs, times and inline editing.

// A short message in the bottom-left corner that fades after a few seconds.
// type is "success", "info" or "error".
function notify(type, title, text) {
    var stack = document.getElementById("toasts");
    if (!stack) {
        stack = document.createElement("div");
        stack.id = "toasts";
        stack.setAttribute("role", "status");
        document.body.appendChild(stack);
    }
    var toast = document.createElement("div");
    toast.className = "toast alert alert-" + (type === "error" ? "danger" : type);
    var heading = document.createElement("strong");
    heading.textContent = title;
    toast.appendChild(heading);
    if (text) {
        toast.appendChild(document.createElement("br"));
        toast.appendChild(document.createTextNode(text));
    }
    stack.prepend(toast);
    setTimeout(function() {
        toast.classList.add("toast-hide");
        setTimeout(function() { toast.remove(); }, 400);
    }, 2500);
}

// Asks before deleting something. details is a list of [label, value] pairs, shown as text.
function confirmDelete(options) {
    var dialog = document.createElement("dialog");
    dialog.className = "confirm-dialog modal-content";
    dialog.innerHTML =
        '<div class="modal-header"><h4 class="modal-title"></h4></div>' +
        '<div class="modal-body"></div>' +
        '<form method="dialog" class="modal-footer">' +
        '<button value="cancel" class="btn btn-default">Cancel</button>' +
        '<button value="delete" class="btn btn-danger">Delete</button>' +
        "</form>";
    dialog.querySelector(".modal-title").textContent = options.title;
    var body = dialog.querySelector(".modal-body");
    options.details.forEach(function(detail) {
        var line = document.createElement("p");
        var value = document.createElement("strong");
        value.textContent = detail[1];
        line.append(detail[0] + ": ", value);
        body.appendChild(line);
    });
    var warning = document.createElement("p");
    warning.innerHTML = "Are you sure? This " + options.what + " will be <strong>permanently</strong> deleted!";
    body.appendChild(warning);
    dialog.addEventListener("close", function() {
        if (dialog.returnValue === "delete") options.onDelete();
        dialog.remove();
    });
    // A click on the backdrop (outside the box) cancels, like Escape.
    dialog.addEventListener("click", function(e) {
        if (e.target === dialog) {
            var box = dialog.getBoundingClientRect();
            var inside = e.clientX >= box.left && e.clientX <= box.right &&
                e.clientY >= box.top && e.clientY <= box.bottom;
            if (!inside) dialog.close("cancel");
        }
    });
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector(".btn-default").focus();
}

// Shows a failed AJAX request's error message.
function notifyError(xhr) {
    var message = xhr.responseJSON && xhr.responseJSON.error;
    notify("error", "Error", message || "Something went wrong. Please try again.");
}

// "4 Nov 26 | 14:30h", in Singapore time.
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatTime(time) {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Singapore",
        day: "numeric", month: "numeric", year: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(time)).forEach(function(part) {
        parts[part.type] = part.value;
    });
    return Number(parts.day) + " " + MONTHS[parts.month - 1] + " " + parts.year + " | " +
        parts.hour + ":" + parts.minute + "h";
}

// Singapore wall-clock time as a datetime-local value ("2026-11-04T14:30").
function singaporeInputTime(date) {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Singapore",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(date).forEach(function(part) {
        parts[part.type] = part.value;
    });
    return parts.year + "-" + parts.month + "-" + parts.day + "T" + parts.hour + ":" + parts.minute;
}

// Minutes between two datetime-local values ("2026-11-04T14:30"), as "1 day 2 hours 30 minutes".
function formatDuration(start, end) {
    var total = Math.round((Date.parse(end + "Z") - Date.parse(start + "Z")) / 60000);
    if (!(total >= 0)) return "";
    var units = [["day", Math.floor(total / 1440)], ["hour", Math.floor(total % 1440 / 60)], ["minute", total % 60]];
    var parts = units.filter(function(unit) { return unit[1]; }).map(function(unit) {
        return unit[1] + " " + unit[0] + (unit[1] === 1 ? "" : "s");
    });
    return parts.join(" ") || "0 minutes";
}

// Inline editing on admin pages. A container with data-edit-url and data-id holds elements
// with class "field-edit", data-name (the field) and data-type (text, textarea or datetime).
// While the container has class "editing", clicking one opens an editor; saving sends
// PUT {pk, name, value} and the container gets a "field-saved" event with the response.
function showFieldValue($fields, text) {
    $fields.each(function() {
        var $field = $(this);
        $field.toggleClass("field-empty", !text);
        $field.text($field.data("label") && text ? $field.data("label") : text || "Empty");
    });
}

$(document).on("click", ".editing .field-edit", function(e) {
    e.preventDefault();
    var $field = $(this);
    var $container = $field.closest("[data-edit-url]");
    var name = $field.data("name");
    var type = $field.data("type");
    var $input = type === "textarea" ? $('<textarea class="form-control input-sm" rows="3">') :
        $('<input class="form-control input-sm">').attr("type", type === "datetime" ? "datetime-local" : "text");
    var current = $field.attr("data-value");
    $input.val(current !== undefined ? current : $field.hasClass("field-empty") ? "" : $field.text().trim());
    var $form = $('<form class="field-editor form-inline">').append(
        $input,
        ' <button type="submit" class="btn btn-primary btn-sm" title="Save"><i class="fa fa-check"></i></button>',
        ' <button type="button" class="btn btn-default btn-sm field-cancel" title="Cancel"><i class="fa fa-times"></i></button>',
        '<div class="help-block text-danger"></div>'
    );
    function close() {
        $form.remove();
        $field.show();
    }
    $form.on("click", ".field-cancel", close);
    $form.on("keydown", function(e) {
        if (e.key === "Escape") close();
        if (e.key === "Enter" && type === "textarea" && (e.ctrlKey || e.metaKey)) $form.trigger("submit");
    });
    $form.on("submit", function(e) {
        e.preventDefault();
        $form.find("button").prop("disabled", true);
        $.ajax({
            method: "PUT",
            url: $container.data("edit-url"),
            data: { pk: $container.data("id"), name: name, value: $input.val() },
            dataType: "json"
        })
        .then(function(response) {
            var $fields = $container.find(".field-edit[data-name='" + name + "']");
            if ($field.is("[data-value]")) $fields.attr("data-value", response.value);
            if (name === "link") $fields.attr("href", response.value);
            showFieldValue($fields, response.text !== undefined ? response.text : response.value);
            close();
            $container.trigger("field-saved", response);
        })
        .catch(function(xhr) {
            $form.find("button").prop("disabled", false);
            var error = xhr.responseJSON && xhr.responseJSON.error;
            $form.find(".help-block").text(error || "Could not save. Please try again.");
        });
    });
    $field.hide().after($form);
    $input.trigger("focus");
});

$(function() {
	console.info("[info] main.js is running.");

	// Something to click on for empty editable fields
	$("[data-edit-url] .field-edit").each(function() {
		if (!$(this).text().trim()) showFieldValue($(this), "");
	});

	// Messages from the server (e.g. after a form submission)
	var flash = $("#flash");
	if (flash.data("success")) notify("success", flash.data("success"));
	if (flash.data("error")) notify("error", flash.data("error"));

	// Lightbox
	$("[data-toggle='lightbox']").click(function(e) {
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

    // Show first pill
    $(".nav-pills li:first-child a").tab("show");

	// Show first carousel slide
	$(".carousel ol li:first-child").addClass("active");
	$(".carousel-inner div:first-child").addClass("active");

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

    // Newsletter
    $("#mailingForm").submit(function(e) {
        e.preventDefault();
        var data = $(this).serialize();
        $(e.target).trigger("reset");
        notify("info", "Processing", "Your details are being recorded");
        $.ajax({
            method: "POST",
            url: "/mailing",
            data
        })
        .then(function() {
            notify("success", "Success", "Your details have been recorded");
        })
        .catch(function() {
            notify("error", "Error", "There was an error recording your details");
        });
    });

    // Overflow Tables
    $(".table-overflow tr").each(function(i, e) {
        if ($(e).children("td").length == 4) {
            $(e).closest("table").css({
                display: "block",
                overflow: "scroll"
            });
        }
    });
});
