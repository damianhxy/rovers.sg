$(document).ready(function() {
    // For use in fullcalendar
    var uniqueID = Date.now();
    var $calendar = $("#calendar");

    // Date-Time Picker
    $(".datetimepicker").datetimepicker();

    // Check for existance
    function getEvent() {
        return $calendar.fullCalendar("clientEvents", uniqueID)[0];
    }

    // Preview
    $(".btn-info").on("click", function(e) {
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
    $(".btn-danger").on("click", function(e) {
        // Check for existance
        if (getEvent())
            $calendar.fullCalendar("removeEvents", uniqueID);
    });
});