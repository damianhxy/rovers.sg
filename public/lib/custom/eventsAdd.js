$(document).ready(function() {
    if (location.pathname !== "/events/add")
        return;

    console.info("[info] eventsAdd.js is running.");

    // For use in fullcalendar
    var uniqueID = Date.now();
    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";
    var $calendar = $("#calendar");
    var $start = $("[name='start']");
    var $end = $("[name='end']");

    // Combodate
    $start.combodate({
        smartDays: "true",
        value: moment(uniqueID).format(MOMENT_FORMAT),
        minYear: new Date().getFullYear(),
        maxYear: new Date().getFullYear() + 1
    });
    $end.combodate({
        smartDays: "true",
        value: moment(uniqueID).format(MOMENT_FORMAT),
        minYear: new Date().getFullYear(),
        maxYear: new Date().getFullYear() + 1
    });

    $(".combodate").addClass("form-control");

    // Check for existance
    function getEvent() {
        return $calendar.fullCalendar("clientEvents", uniqueID)[0];
    }

    // Clear Event
    function clearEvent() {
        if (getEvent())
            $calendar.fullCalendar("removeEvents", uniqueID);
    }

    // Preview
    $(":input").on("change", function() {
        // Check if there is sufficient information
        var title = $("[name='title']").val();
        var start = $start.combodate("getValue");
        var end = $end.combodate("getValue");
        if (!(title && start && end))
            return clearEvent();
        start = moment(start, MOMENT_FORMAT);
        end = moment(end, MOMENT_FORMAT);
        // Check for existance
        var event = getEvent();
        if (event) {
            // Update
            event.title = title;
            event.start = start;
            event.end = end;
            $calendar.fullCalendar("updateEvent", event);
        } else {
            // Add
            $calendar.fullCalendar("renderEvent", {
                id: uniqueID,
                title: title,
                start: start,
                end: end
            }, true);
        }
    });
});