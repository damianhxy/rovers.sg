$(document).ready(function() {
    if (location.pathname !== "/events/add")
        return;
    // For use in fullcalendar
    var uniqueID = Date.now();
    var $calendar = $("#calendar");
    var $start = $("#event-start");
    var $end = $("#event-end");

    // Date-Time Picker
    $start.datetimepicker({
        format: "DD/MM/YYYY HH:mm A"
    });
    $end.datetimepicker({
        format: "DD/MM/YYYY HH:mm A",
        useCurrent: false
    });

    // Link the pickers
    $start.on("dp.change", function(e) {
        $end.data("DateTimePicker").minDate(e.date);
    });
    $end.on("dp.change", function(e) {
        $start.data("DateTimePicker").maxDate(e.date);
    });

    // Check for existance
    function getEvent() {
        return $calendar.fullCalendar("clientEvents", uniqueID)[0];
    }

    // Preview
    $(".btn-info").on("click", function() {
        // Check if there is sufficient information
        var title = $("[name='title']").val();
        var start = $("[name='start']").val();
        var end = $("[name='end']").val();
        if (!(title && start && end)) {
            new PNotify({
                title: "Error",
                text: "Please fill up the fields.",
                type: "error"
            });
            return false;
        } else {
            start = moment(start, "DD/MM/YYYY HH:mm A");
            end = moment(end, "DD/MM/YYYY HH:mm A");
        }
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

    // Reset
    $(".btn-danger").on("click", function() {
        // Check for existance
        if (getEvent())
            $calendar.fullCalendar("removeEvents", uniqueID);
        // Clear datetimepicker
        $start.data("DateTimePicker").clear();
        $end.data("DateTimePicker").clear();
    });
});