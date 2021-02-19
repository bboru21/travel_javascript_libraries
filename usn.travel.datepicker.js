/*
    Name: usn.travel.datepicker
    Dependencies:
        * moment.js
        * bootstrap.js
        * vendors.js
        * templates.js
        * usn.travel.base.js
        * main.js

        jQuery UI
        * jquery-ui.min.js
*/
(function($,USN,usn) {

    "use strict";

    var _INIT_FUNCTIONS = [];
    var _ON_INIT = function() {
        for (var i = 0, len = _INIT_FUNCTIONS.length; i < len; i++) {
            _INIT_FUNCTIONS[i].call();
        }
    };

    var _DEFAULT_DATEPICKER_LIBRARY = "jQueryUI";
    if (!!usn.travel.debug) { _DEFAULT_DATEPICKER_LIBRARY = "jQueryUI"; }

    // AdManager dispatcher
    var DISPATCHER = window.usn.ads.adManager.instance.dispatcher;

    // begin  - Datepicker superclass
    function Datepicker(input, options) {
        var context = this; // store context for use by callbacks
        options = options || {};
        this.isUSNDatepicker = true;

        // setup input
        this.input = typeof input === "undefined" ? null : input;
        this.$input = typeof input === "undefined" ? null : $(input);
        this.inputType = (!!this.$input && this.$input.prop("type")==="date") ? "date" : "text";

        this.visibleFormat = options.visibleFormat || "MM/DD/YYYY";
        this.cookieName = options.cookieName || null;
        this.changeFocusSelector = options.changeFocusSelector || null;

        if (options.populateDates) this.populateDates(options.populateDates);
        this.defaultDate = options.defaultDate || null;
        this.defaultOffset = options.defaultOffset || null;
        this.defaultOffsetUnit = options.defaultOffsetUnit || "days";
        // if no default date, but cookie exists, set default date to that
        if (!this.defaultDate && !!this.cookieName) { this.defaultDate = usn.travel.getDateCookie(this.cookieName); }
        if (!this.defaultDate && !!this.defaultOffset) { this.defaultDate = usn.travel.dateAdd(new Date(), this.defaultOffset, this.defaultOffsetUnit); }

        // set minimum date to options passed in, or the current date
        this.minDate = options.minDate || new Date();
        // override minimum date to that of another "previous" datepicker
        this.$minDatepicker = typeof options.minDatepickerSelector==="undefined" ? null : $(options.minDatepickerSelector);
        if (this.$minDatepicker) {
            this.minDate = usn.travel.stringToDate(this.$minDatepicker.val(), this.visibleFormat);
        }

        // selector of elements to watch to sync with
        this.syncSelector = options.syncSelector || null;

        if (this.$input) { usn.travel.events.on("datepicker:valueChanged", this.onDatepickerValueChanged.bind(this)); }
    }

    Datepicker.prototype.populateDates = function(packedString) {
        /*
         * Checks to see if we have a checkin or a checkout date
         * if not then set those to be a multiple of weeks
         * from the tested checkin&&checkout days of week
         * usage: data-populate-dates="dayOfWeekCheckin:int,dayOfWeekCheckout:int,multiplier:int" on input
         */

        var checkin  = usn.travel.getCookie('checkin_date'),
            checkout = usn.travel.getCookie('checkout_date'),
            has_checkin_checkout = Boolean(checkin && checkout);

        if (!(packedString && /^((\w+:\d,){2}\w+:\d)$/.test(packedString)) || has_checkin_checkout) {
            return;
        }

        var unpacked = packedString.split(',').map(function(setting) {
           return Number(setting.split(':').pop())
        });

        var settings = {
            dayOfWeekCheckin: unpacked[0],
            dayOfWeekCheckout: unpacked[1],
            multiplier: unpacked[2]
        };

        var BEGIN = settings.dayOfWeekCheckin,
            END = settings.dayOfWeekCheckout,

            today = new Date(),

            diff = today.getDate() != BEGIN ? Math.abs(BEGIN - today.getDay()) : 0,

            firstFriday = new Date(new Date().setDate(today.getDate() + diff)),

            WEEK_DAYS = 7,
            WEEKS = settings.multiplier,

            formula = WEEK_DAYS*WEEKS,

            checkinDate  = new Date().setDate(firstFriday.getDate() + formula),
            checkoutDate = new Date().setDate(firstFriday.getDate() + formula + END-BEGIN);

        if (this.$input.hasClass("checkin-date")) {
            usn.travel.setCookie('checkin_date', checkinDate, {expires: 1});
        }
        if (this.$input.hasClass("checkout-date")) {
            usn.travel.setCookie('checkout_date', checkoutDate, {expires: 1});
        }

    };

    Datepicker.prototype.onDatepickerValueChanged = function(data) {
        var $changedInput = $(data.input);
        var changedDate = data.date;
        var date;

        // reset minimum date
        if ($changedInput.is(this.$minDatepicker)) {
            this.setOptions.call(this, {"minDate": changedDate });
            date = this.getDate.call(this);
            // reset actual date if min date is greater than current date
            if (usn.travel.isDateValid(date) && changedDate.getTime() > date.getTime()) {
                this.setDate.call(this, changedDate, true);
            }
        }

        // sync logic
        date = this.getDate.call(this);
        if (!usn.travel.isDateValid(date) || changedDate.getTime() != date.getTime()) { // don't do anyting if dates already equal
            var syncSelector = $changedInput.data("syncSelector");
            if ($changedInput.not(this.$input) && syncSelector === this.syncSelector) {
                this.setDate.call(this, changedDate);
            }
        }
    };

    Datepicker.prototype.triggerFocus = function() {
        if (!!this.changeFocusSelector) {
            setTimeout(function () {
                if (Modernizr && Modernizr.touch) {
                    $(this.changeFocusSelector).trigger('touchend');
                }
                else {
                    $(this.changeFocusSelector).focus();
                }
            }.bind(this), 250);
        }
    };

    Datepicker.prototype.setCookie = function(date) {
        if (this.cookieName) {
            usn.travel.setDateCookie(this.cookieName, date, { "expires": 7 });
        }
    };

    Datepicker.prototype.getDate = function() { return new Date(); };
    Datepicker.prototype.setDate = function() {/*...*/};
    Datepicker.prototype.setOptions = function() {/*...*/};
    // end  - Datepicker superclass

    // begin  - Native Datepicker class
    function DateInputDatepicker(input, options) {
        options = options || {};
        options.visibleFormat = "YYYY-MM-DD";
        Datepicker.call(this, input, options);

        // set min date by default to prevent past dates from being selecteds
        this.$input.attr("min", usn.travel.dateToString(this.minDate, this.visibleFormat));

        // remove SVG calendar since it conflicts with native controls
        this.$input.closest("label.input-calendar").find(".icon-calendar-box:not(.js-keep-icon)").remove();

        // handle change event
        this.$input.on("change", this.onChange.bind(this));

        this.setDate.call(this, this.defaultDate);
        usn.travel.events.trigger("datepicker:valueSet", {"input": this.input, "date": this.getDate()});
    }
    DateInputDatepicker.prototype = new Datepicker();

    DateInputDatepicker.prototype.getDate = function() {
        var date = null;

        try {
            var val = this.input.value;
            var arr = val.split("-");
            date = new Date(arr[1] + "/" + arr[2] + "/" + arr[0]); // split date to avoid converting it to GMT
        }
        catch(e) {}

        return date;
    };
    DateInputDatepicker.prototype.setDate = function(date, triggerValueChanged) {
        triggerValueChanged = triggerValueChanged===true;

        this.$input.val( usn.travel.dateToString(date, this.visibleFormat) );
        this.setCookie.call(this, date);
        if (triggerValueChanged) {
            var ts = new Date().getTime(); // timestamp for identifying event to several related listeners only, no relation to datepicker's date
            usn.travel.events.trigger("datepicker:valueChanged", {"input": this.input, "date": this.getDate(), "timestamp": ts });
        }
    };
    DateInputDatepicker.prototype.setOptions = function(options) {

        for (var prop in options) {
            if (prop === "minDate") {
                this.$input.attr("min", usn.travel.dateToString(options[prop], this.visibleFormat));
            } else if (prop === "maxDate") {
                this.$input.attr("max", usn.travel.dateToString(options[prop], this.visibleFormat));
            }
        }
    };

    DateInputDatepicker.prototype.onChange = function(event) {
        this.setCookie.call(this, this.getDate());
        var ts = new Date().getTime(); // timestamp for identifying event to several related listeners only, no relation to datepicker's date
        usn.travel.events.trigger("datepicker:valueChanged", {"input": this.input, "date": this.getDate(), "timestamp": ts });
    };

    DateInputDatepicker.prototype.onMinDatepickerChange = function(event) {
        var input = event.target;
        var date = usn.travel.stringToDate(input.value, this.visibleFormat);

        var options = {};
        options.minDate = date;
        this.setOptions.call(this, options);

        if (usn.travel.dateDiff(date, this.getDate.call(this), "days") > 0) {
           this.setDate.call(this, date);
        }
    };
    // end  - Native Datepicker class

    // begin  - jQuery UI Datepicker class
    function JQueryUIDatepicker(input, options) {
        options = options || {};

        Datepicker.call(this, input, options);

        this.numberOfMonths = options.numberOfMonths || null;

        var settings = {};
        settings.onSelect = this.onSelect.bind(this);
        settings.beforeShowDay = this.beforeShowDay.bind(this);
        settings.beforeShow = this.beforeShow.bind(this);
        settings.onClose = this.onClose.bind(this);

        if (this.$input.hasClass('begin-date')) {
            this.$beginDate = this.$input;
            if (this.changeFocusSelector) {
                this.$endDate = $(this.changeFocusSelector);
            }
        }
        else {
            this.$endDate = this.$input;
            this.$beginDate = this.$minDatepicker;
        }

        if (this.defaultDate) { settings.defaultDate = this.defaultDate; }
        if (this.numberOfMonths) { settings.numberOfMonths = this.numberOfMonths; }
        if (this.minDate) { settings.minDate = this.minDate; }

        this.$datepicker = this.$input.datepicker(settings);
        this.setDate.call(this, this.defaultDate);
        usn.travel.events.trigger("datepicker:valueSet", {"input": this.input, "date": this.getDate()});

        this.$widget = this.$input.datepicker("widget");
        this.$widget.attr('data-end-placeholder', this.$beginDate.attr('placeholder'));
        this.$widget.attr('data-begin-placeholder', this.$endDate.attr('placeholder'));

        this.$input.attr('autocomplete', 'off');

        if (this.$input.attr('type') == 'text') this.setupMobileState();

        if (options.openOnload) this.openOnLoad(options.openOnload);
    }

    JQueryUIDatepicker.prototype = new Datepicker();

    JQueryUIDatepicker.prototype.openOnLoad = function (loadSettings) {
        if (isNaN(loadSettings)) {
            //Dispatcher.whenALlAdsAreFinishedLoading or whatever they have.
        }
        else if (!isNaN(loadSettings)) {
            setTimeout(function() {this.$datepicker.datepicker('show')}.bind(this), Number(loadSettings));
        }
        else {
            this.$datepicker.datepicker('show');
        }
    };

    JQueryUIDatepicker.$overlay = $('<div></div>').html('<div class="datepicker-overlay"></div>').contents();

    JQueryUIDatepicker.prototype.setupMobileState = function() {

        $(window).on('resize', function() {
            this.$datepicker.datepicker('hide');
        }.bind(this));

        if (!(this.$widget.last().parent()).hasClass("datepicker-overlay")) {
            JQueryUIDatepicker.$overlay.height($(document).height());
            JQueryUIDatepicker.$overlay = this.$widget.wrap(JQueryUIDatepicker.$overlay).parent();
        }

        JQueryUIDatepicker.$overlay && JQueryUIDatepicker.$overlay.on('click', function(e) {
            ($(e.target).is(JQueryUIDatepicker.$overlay)) && this.$datepicker.datepicker('hide');
            return;
        }.bind(this));
        if (Modernizr && Modernizr.touch && Modernizr.mq('only all and (max-width: 1024px)')) {
            this.$datepicker.attr({
                readonly:'readonly',
                disabled: 'disabled'
            });
            this.$datepicker.on('touchend click', function () {
                $(this).datepicker('show');
                return false;
            });
        }
    };

    JQueryUIDatepicker.prototype.onClose = function() {
        JQueryUIDatepicker.$overlay.hide();
    };

    JQueryUIDatepicker.prototype.onSelect = function() {
        this.setCookie.call(this, this.getDate());
        var ts = new Date().getTime(); // timestamp for identifying event to several related listeners only, no relation to datepicker's date
        usn.travel.events.trigger("datepicker:valueChanged", {"input": this.input, "date": this.getDate(), "timestamp": ts });
        this.triggerFocus.call(this);
    };

    JQueryUIDatepicker.prototype.beforeShow = function(input, inst) {
        if ($(input).is(this.$beginDate)) {
            this.$widget.removeClass('end-date-widget');
            this.$widget.addClass('begin-date-widget');
        }
        else {
            this.$widget.removeClass('begin-date-widget');
            this.$widget.addClass('end-date-widget');
        }
        JQueryUIDatepicker.$overlay.show();
    };

    JQueryUIDatepicker.prototype.beforeShowDay = function(d) {
        var beginDate  = new Date(usn.travel.getDateCookie(this.$beginDate.attr('data-cookie-name'))).setHours(0, 0, 0, 0),
            endDate    = new Date(usn.travel.getDateCookie(this.$endDate.attr('data-cookie-name'))).setHours(0, 0, 0, 0),

            cssClass   = '',

            daysInRange= (d > beginDate) && (d < endDate);

        if (d.valueOf() == beginDate.valueOf()) {
            cssClass = 'begin-date';
        }
        else if (d.valueOf() == endDate.valueOf()) {
            cssClass = 'end-date';
        }
        else if (daysInRange) {
            cssClass = 'in-range';
        }

        return [true, cssClass];
    };
    JQueryUIDatepicker.prototype.getDate = function() {
        return this.$input.datepicker("getDate");
    };
    JQueryUIDatepicker.prototype.setDate = function(date, triggerValueChanged) {
        triggerValueChanged = triggerValueChanged===true;
        this.$input.datepicker("setDate", date);
        this.setCookie.call(this, date);
        if (triggerValueChanged) {
            var ts = new Date().getTime(); // timestamp for identifying event to several related listeners only, no relation to datepicker's date
            usn.travel.events.trigger("datepicker:valueChanged", {"input": this.input, "date": this.getDate(), "timestamp": ts });
        }
    };
    JQueryUIDatepicker.prototype.setOptions = function(options) {
        for (var prop in options) {
            this.$input.datepicker("option", prop, options[prop]);
        }
    };
    // end  - jQuery UI Datepicker class

    var DATEPICKER;

    window.usn = window.usn || {};
    usn.travel = usn.travel || {};
    usn.travel.datepicker = {
        /*
            Method: usn.travel.datepicker.init
            Description: Initializes a datepicker around a given input element.
            Arguments:
                targetSelector - String, the selector for the input element.
                options.visibleFormat - String, format in which the date will appear within the input element. Default is "MM/DD/YYYY".
                options.defaultDate - Date Object, default date to be used.
                options.minDate - Date Object, the default minimum date of the datepicker.
                options.numberOfMonths - Integer, the number of months to show for the datepicker.
                options.cookieName - String, Name of cookie to assign date value to on datepicker select event.
        */
        "init": function(targetSelector, options) {
            options = options || {};
            var type = options.type || _DEFAULT_DATEPICKER_LIBRARY;

            $(targetSelector).each(function() {
                //if force native switch is set
                if (this.getAttribute("data-force-native-mobile")) {
                    //if Modernizr check if handheld and has native abilities
                    if (Modernizr && Modernizr.touch && Modernizr.inputtypes.date) {
                        //force date input
                        this.type = 'date';
                    }
                }

                if ($(this).prop('type') === "date") { type = "dateInput"; }
                if (type === "dateInput" && !usn.travel.isDateSupported()) { type = "jQueryUI"; }

                switch(type) {
                    case "dateInput":
                        if ($(this).prop("type") === "text") { $(this).prop("type", "date"); }
                        DATEPICKER = new DateInputDatepicker(this, options);
                    break;
                    case "pikaday":
                        DATEPICKER = new PikadayDatepicker(this, options);
                    break;
                    case "pikadayResponsive":
                        if ($(this).prop("type") === "text") { $(this).prop("type", "date"); }
                        DATEPICKER = new PikadayResponsiveDatepicker(this, options);
                    break;
                    case "pickadate":
                        DATEPICKER = new PickadateDatepicker(this, options);
                    break;
                    default:
                        if ($(this).prop("type") === "date") { $(this).prop("type", "text"); }
                        DATEPICKER = new JQueryUIDatepicker(this, options);
                }
           });

            return DATEPICKER;
        },
        "setOptions": function(options) {
            DATEPICKER.setOptions.call(DATEPICKER, options);
        },
        "initOnLoad": function() {
             var input, $input, targetSelector, options, isUSNDatepicker;
            $(".usn-datepicker").each(function() {

                isUSNDatepicker = $(this).isUSNDatepicker || false;

               if (!isUSNDatepicker) {
                    input = this;
                    $input = $(input);
                    targetSelector = input.getAttribute("id");
                    if (!targetSelector) {
                        input.setAttribute("id", "usn-datepicker-" + parseInt(Math.random() * 10000000000000000));
                        targetSelector = "#" + input.getAttribute("id");
                    }

                    options = {};
                    if (!!$input.data("type")) { options.type = $input.data("type") }
                    if (!!$input.data("defaultDate")) { options.defaultDate = new Date(parseInt($input.data("defaultDate"))); }
                    if (!!$input.data("minDate")) { options.minDate = parseInt($input.data("minDate")); }
                    if (!!$input.data("numberOfMonths")) { options.numberOfMonths = parseInt($input.data("numberOfMonths")); }
                    if (!!$input.data("cookieName")) { options.cookieName = $input.data("cookieName"); }
                    if (!!$input.data("syncSelector")) { options.syncSelector = $input.data("syncSelector"); }
                    if (!!$input.data("defaultOffset")) { options.defaultOffset = $input.data("defaultOffset"); }
                    if (!!$input.data("defaultOffsetUnit")) { options.defaultOffsetUnit = $input.data("defaultOffsetUnit"); }
                    if (!!$input.data("minDatepickerSelector")) { options.minDatepickerSelector = $input.data("minDatepickerSelector"); }
                    if (!!$input.data("changeFocusSelector")) { options.changeFocusSelector = $input.data("changeFocusSelector"); }
                    if (!!$input.data("openOnload")) { options.openOnload = $input.data("openOnload"); }
                    if (!!$input.data("populateDates")) { options.populateDates = $input.data("populateDates"); }

                    usn.travel.datepicker.init(targetSelector, options);
               }
            });
        }
    };

    // init on main.js loaded
    _INIT_FUNCTIONS.push(function() {
        usn.travel.datepicker.initOnLoad();

       // make all calendar svg icons clickable
       $("svg.icon-calendar-box").on("click", function() { $(this).parent("label.input-calendar").click(); });
    });

    if (!document.getElementById('usn-js-main')) {
        usn.travel.events.on("mainScript:loaded", _ON_INIT);
    } else {
        _ON_INIT();
    }

}(jQuery, USN, usn));
