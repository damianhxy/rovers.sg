$(function() {
    console.info("[info] eventAdd.js is running.");

    // For use in fullcalendar
    var uniqueID = Date.now();
    var FIVE_MINUTES = 5 * 60 * 1000;
    var HOUR = 60 * 60 * 1000;
    var $calendar = $("#calendar");
    var $start = $("[name='start']");
    var $duration = $("[name='duration']");
    var $end = $("[name='end']");

    // Times are Singapore time. Default: now rounded up to 5 minutes, for an hour.
    var defaultStart = Math.ceil(uniqueID / FIVE_MINUTES) * FIVE_MINUTES;
    $start.val(singaporeInputTime(new Date(defaultStart)));
    $end.val(singaporeInputTime(new Date(defaultStart + HOUR)));
    var lastStart = $start.val();
    updateDuration();

    // Milliseconds between two datetime-local values
    function diff(from, to) {
        return Date.parse(to + "Z") - Date.parse(from + "Z");
    }

    // Moving the start keeps the duration, as in most calendars.
    $start.on("change", function() {
        var start = $start.val();
        if (start && lastStart && $end.val()) {
            var end = new Date(Date.parse($end.val() + "Z") + diff(lastStart, start));
            $end.val(end.toISOString().slice(0, 16));
        }
        lastStart = start;
    });

    function updateDuration() {
        var backwards = diff($start.val(), $end.val()) < 0;
        $end.get(0).setCustomValidity(backwards ? "The end must be after the start." : "");
        $duration.val(backwards ? "End is before start" : formatDuration($start.val(), $end.val()));
    }

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
    $("#eventForm :input").on("input change", function() {
        var title = $("[name='title']").val();
        var start = $start.val();
        var end = $end.val();
        updateDuration();
        if (!title || !start || !end || diff(start, end) < 0)
            return clearEvent();
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
});
