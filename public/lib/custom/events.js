$(document).ready(function() {
    if (location.pathname.split("/")[1] !== "events")
        return;

    console.info("[info] events.js is running.");
    /* ADD PAGE */
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
    $("#preview").on("click", function() {
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
    $("#reset").on("click", function() {
        // Check for existance
        if (getEvent())
            $calendar.fullCalendar("removeEvents", uniqueID);
        // Clear datetimepicker
        $start.data("DateTimePicker").clear();
        $end.data("DateTimePicker").clear();
    });

    /* VIEW PAGE */
    // Delete Modal
    $("#deleteModal").on("show.bs.modal", function(e) {
        var data = $(e.relatedTarget).parent().parent().prev();
        var eventName = data.data("title");
        var createdTime = moment(data.data("time")).format("DD/MM/YYYY HH:mm A");
        $(this).find(".btn-danger").data("id", data.data("id"));
        $("#modalEventName").html("Event name: <strong>" + eventName + "</strong>");
        $("#modalEventTime").html("Created on: <strong>" + createdTime + "</strong>");
    });

    // Ajax
    $("#deleteModal .btn-danger").click(function(e) {
        $.ajax({
            method: "POST",
            url: "/events/delete",
            data: { id: $(this).data("id") }
        })
        .then(function() {
            $("#deleteModal").modal("hide");
            location.assign("/");
        })
        .fail(function(err) {
            new PNotify({
                title: "Error",
                text: err.message,
                type: "error"
            });
        });
    });
});