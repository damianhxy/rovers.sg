$(document).ready(function() {
    console.info("[info] eventAdd.js is running.");

    // For use in fullcalendar
    var uniqueID = Date.now();
    var MOMENT_FORMAT = "DD/MM/YYYY hh:mm A";
    var CURRENT_YEAR = new Date().getFullYear();
    var ROUNDING = 5 * 60 * 1000; // Round up to closest 5 minutes
    var $calendar = $("#calendar");
    var $start = $("[name='start']");
    var $end = $("[name='end']");
    var defaultMoment = moment(Math.ceil(uniqueID / ROUNDING) * ROUNDING).utcOffset(8);

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
    $("#eventForm :input").on("change keyup", function() {
        var title = $("[name='title']").val();
        var start = moment($start.combodate("getValue")).utc(8).format(MOMENT_FORMAT);
        var end = moment($end.combodate("getValue")).utc(8).format(MOMENT_FORMAT);
        if (start.isAfter(end)) {
            var prop = ["year", "month", "date", "hour", "minute"];
            for (var curProp of prop)
                if (start.isAfter(end))
                    end[curProp](start[curProp]());
            // $end comes first to prevent infinite recursion
            $end.combodate("setValue", moment(end).utc(8).format(MOMENT_FORMAT));
            $start.combodate("setValue", moment(start).utc(8).format(MOMENT_FORMAT));
        }
        if (!title)
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