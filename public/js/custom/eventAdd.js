$(function() {
    console.info("[info] eventAdd.js is running.");

    // For use in fullcalendar
    var uniqueID = Date.now();
    var MOMENT_FORMAT = "D MMM YY HH:mm";
    var CURRENT_YEAR = new Date().getFullYear();
    var ROUNDING = 5 * 60 * 1000; // Round up to closest 5 minutes
    var $calendar = $("#calendar");
    var $start = $("[name='start']");
    var $duration = $("[name='duration']");
    var $end = $("[name='end']");
    var defaultMoment = moment(Math.ceil(uniqueID / ROUNDING) * ROUNDING);

    // Combodate
    $start.combodate({
        smartDays: "true",
        value: defaultMoment.format(MOMENT_FORMAT),
        minYear: CURRENT_YEAR - 5,
        maxYear: CURRENT_YEAR + 5
    });
    $end.combodate({
        smartDays: "true",
        value: defaultMoment.add(1, 'hour').format(MOMENT_FORMAT),
        minYear: CURRENT_YEAR - 5,
        maxYear: CURRENT_YEAR + 5
    });

    // Init
    $(".combodate").addClass("form-control");
    updateDuration();

    // Check for existence
    function getEvent() {
        return $calendar.fullCalendar("clientEvents", uniqueID)[0];
    }

    // Clear Event
    function clearEvent() {
        if (getEvent())
            $calendar.fullCalendar("removeEvents", uniqueID);
    }

    // Update Duration
    function updateDuration() {
        var start = moment($start.combodate("getValue"), MOMENT_FORMAT);
        var end = moment($end.combodate("getValue"), MOMENT_FORMAT);
        $duration.val(moment.duration(end.diff(start)).format("d [days] h [hours] m [minutes]", {
            trim: "both mid"
        }));
    }

    // Preview
    $("#eventForm :input").on("change keyup", function() {
        var title = $("[name='title']").val();
        var start = moment($start.combodate("getValue"), MOMENT_FORMAT);
        var end = moment($end.combodate("getValue"), MOMENT_FORMAT);
        if (start.isAfter(end)) {
            var prop = ["year", "month", "date", "hour", "minute"];
            for (var curProp of prop)
                if (start.isAfter(end))
                    end[curProp](start[curProp]());
            // $end comes first to prevent infinite recursion
            $end.combodate("setValue", moment(end).format(MOMENT_FORMAT));
        }
        updateDuration();
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
