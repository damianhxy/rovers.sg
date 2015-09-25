$(document).ready(function() {
    if (location.pathname !== "/events/add")
        return;

    console.info("[info] eventAdd.js is running.");

    // For use in fullcalendar
    var uniqueID = Date.now();
    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";
    var CURRENT_YEAR = new Date().getFullYear();
    var ROUNDING = 5 * 60 * 1000; // Round up to closest 5 minutes
    var $calendar = $("#calendar");
    var $start = $("[name='start']");
    var $end = $("[name='end']");
    var defaultMoment = moment(Math.ceil(uniqueID / ROUNDING) * ROUNDING);

    // Combodate
    $start.combodate({
        smartDays: "true",
        value: defaultMoment.format(MOMENT_FORMAT),
        minYear: CURRENT_YEAR,
        maxYear: CURRENT_YEAR + 1
    });
    $end.combodate({
        smartDays: "true",
        value: defaultMoment.add(5, 'minutes').format(MOMENT_FORMAT),
        minYear: CURRENT_YEAR,
        maxYear: CURRENT_YEAR + 1
    });

    $(".combodate").addClass("form-control");

    // Check for existence
    function getEvent() {
        return $calendar.fullCalendar("clientEvents", uniqueID)[0];
    }

    // Clear Event
    function clearEvent() {
        if (getEvent())
            $calendar.fullCalendar("removeEvents", uniqueID);
    }

    // Preview
    $(":input").on("change keyup", function() {
        // Check if there is sufficient information
        var title = $("[name='title']").val();
        var start = $start.combodate("getValue");
        var end = $end.combodate("getValue");
        if (!(title && start && end))
            return clearEvent();
        start = moment(start, MOMENT_FORMAT);
        end = moment(end, MOMENT_FORMAT);
        var event = getEvent();
        if (event) {
            event.title = title;
            event.start = start;
            event.end = end;
            $calendar.fullCalendar("updateEvent", event);
        } else {
            $calendar.fullCalendar("renderEvent", {
                id: uniqueID,
                title: title,
                start: start,
                end: end
            }, true);
        }
    });

    // Form Validation
    $("form").on("submit", function(e) {
        e.preventDefault();
        var start = moment($start.combodate("getValue"), MOMENT_FORMAT);
        var end = moment($end.combodate("getValue"), MOMENT_FORMAT);
        if (start.isBefore(end))
            $(e.target).get(0).submit();
        else
            new PNotify({
                title: "Error",
                text: "Start time must be before end time.",
                type: "error"
            });
    });
});