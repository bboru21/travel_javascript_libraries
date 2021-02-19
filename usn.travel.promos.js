/**
 * @description JavaScript library for powering third-party promotions.
 */

(function(window, $) {
    "use strict";

    window.usn = window.usn || {};
    usn.travel = usn.travel || {};

    /*
    Method: TripAdvisorIframe
    Description: Loads Trip Advisor's "Price Finder" within an iframe element.
    Arguments:   hotelId - Integer
                       checkin - JavaScript Date
                       checkout - JavaScript Date
                       options.width - Integer, desired width of the iframe
                       options.height - Integer, desired height of the iframe
    */
    function TripAdvisorIframe(hotelId, checkin, checkout, options) {

        options = options || {};

        this.url = "//www.tripadvisor.com/WidgetEmbed-cdshotelmeta";
        this.width = options.width || 300;
        this.height = options.height || 280;
        this.hotelId = hotelId || null;
        this.key = options.key || "1BC939997ADF43248096C8FF7D34EA0B";

        this.params = [];
        this.params.push("display=true");
        this.params.push("locationId=" + this.hotelId);
        this.params.push("partnerId="+this.key);
        this.params.push("width=" + this.width);
        this.params.push("height=" + this.height);
        this.params.push("checkin=" + usn.travel.dateToString(checkin, "YYYY-MM-DD"));
        this.params.push("checkout=" + usn.travel.dateToString(checkout, "YYYY-MM-DD"));

        this.element = document.createElement("iframe");
        this.element.setAttribute("scrolling", "no");
        this.element.setAttribute("frameborder", "0");
        this.element.setAttribute("src", this.url + "?" + this.params.join("&"));
        this.element.setAttribute("height", this.height);
        this.element.setAttribute("width", this.width);
    }


    /**
     * Initializes an AirfarePromo super-class.
     *
     * @constructor
     * @param {object} options
     * @param {string} options.arrivalInputSelector [description]
     * @param {string} options.departureInputSelector [description]
     * @param {string} options.submitButtonSelector [description]
     */
    function AirfarePromo(options) {

        this.destinationId = null;
        this.destinationAirportCode = null;
        this.destinationAirportName = null;
        this.analyticsAction = options.analyticsAction || null;
        this.partner = options.partner;
        this.placement = null;
        this.mobile = window.matchMedia && window.matchMedia('(max-width: 500px)').matches;

        this.$container = $(options.containerSelector);

        this.$departureDateInput = this.$container.find(".departure-date");
        this.$returnDateInput = this.$container.find(".return-date");

        this.departureInputSelector = options.departureInputSelector || ".depart";
        this.$departureInput = $(this.departureInputSelector);
        this.$departureHiddenInput = $('<input type="hidden" name="departure_city" />');
        this.$departureInput.after(this.$departureHiddenInput);
        options.departureCode && this.$departureHiddenInput.val(options.departureCode);

        this.arrivalInputSelector = options.arrivalInputSelector || ".arrive";
        this.$arrivalInput = $(this.arrivalInputSelector);
        this.$arrivalHiddenInput = $('<input type="hidden" name="arrival_city" />');
        this.$arrivalInput.after(this.$arrivalHiddenInput);
        options.arrivalCode && this.$arrivalHiddenInput.val(options.arrivalCode);

        this.$submitButton = $(options.submitButtonSelector);
        this.$form = this.$submitButton.closest("form");

        // autocomplete inputs
        this.setupAutocomplete.call(this);

        // bind events
        this.$form.on("submit", this.onFormSubmit.bind(this));

        usn.travel.events.on("datepicker:valueChanged", this.onDatepickerSelect.bind(this));
    };

    /**
     * Sets up autocomplete airport inputs using ITS's jQuery.autocomplete plugin.
     *
     * @this {AirfarePromo}
     */
    AirfarePromo.prototype.setupAutocomplete = function() {

        var context = this;

        $(this.departureInputSelector + ', ' + this.arrivalInputSelector).autocomplete({
            source: 'airports',
            templates: {
                suggestion: function(data) {
                    return '<div>'+data.label+'</div>';
                }
            },
            action: function(element, data, event) {
                if ($(element).is(context.$departureInput)) { context.$departureHiddenInput.val(data.value); }
                else if ($(element).is(context.$arrivalInput)) { context.$arrivalHiddenInput.val(data.value); }
            }
        });

        // 11/21/2016 - if we ever need to prompt autocomplete on the front end, this should do it - BEH
        // if (!!value) {
        //     $('.typeahead')
        //         .bind('typeahead:render', function() {
        //             if (arguments.length > 1) {
        //                 $(this).typeahead("val", arguments[1].label);
        //             }
        //         })
        //         .typeahead('val', value);
        // }
    };

    /**
     * Fire an event on form submit.
     *
     * @this {AirfarePromo}
     * @param  {object} event JavaScript click event object.
     * @return {boolean}
     */
    AirfarePromo.prototype.onFormSubmit = function(event) {
        var url, params = [];

        /* form markup was initialy created for Booking Buddy only, so we have to parse it for other partners here */
        if (this.partner === "mediaalpha") {

            url = "http://travel.mediaalpha.com/hosted/form.html?";

            var mobile = window.matchMedia && window.matchMedia('(max-width: 500px)').matches;

            params.push("placement_id=" + (mobile ? "zJ3fOFeI7cuX3vjCD5FYsSqREGyYaw" : "tIROamcapxdfZp8g-lz1SXbtNFDdjA"));
            params.push("type=ad_unit");

            // departure flight
            var departureDate = this.$form.find('[name="departure_date"]').val();
            params.push("data.flights[0].date=" + moment(departureDate, "MM/DD/YYYY").format("YYYY-MM-DD"));
            params.push("data.flights[0].origin=" + this.$form.find('[name="departure_city"]').val());
            params.push("data.flights[0].destination=" + this.$form.find('[name="arrival_city"]').val());

            // return flight
            var returnDate = this.$form.find('[name="return_date"]').val();
            params.push("data.flights[1].date=" + moment(returnDate, "MM/DD/YYYY").format("YYYY-MM-DD"));
            params.push("data.flights[1].origin=" + this.$form.find('[name="arrival_city"]').val());
            params.push("data.flights[1].destination=" + this.$form.find('[name="departure_city"]').val());

            params.push("data.num_adults=" + this.$form.find('[name="num_travelers"]').val());
            params.push("sub_1=USNews");
            params.push("sub_2=" + window.utag_data.site_zone);
            params.push("sub_3=");
            params.push("bg=0");
            params.push("title=FFFFFF");
            params.push("w=1000");

            url = url + params.join("&");

        } else { // booking buddy
            url = "https://rd.bookingbuddy.com/src/?s=31570";
        }

        this.$form.attr("action", url)

        usn.travel.events.trigger("promos:airfare:submit", {"partner": this.partner, "placement": this.placement, "action": "submit"});
        return true;
    };

    /**
     * Handle all datepicker:valueChanged events, and fire event for analytics listeners.
     *
     * @this {AirfarePromo}
     * @param {object} data
     * @param {object} data.input Input element whose value was changed.
     */
    AirfarePromo.prototype.onDatepickerSelect = function(data) {
        if (!!$(data.input).is(this.$returnDateInput)) {
            usn.travel.events.trigger("promos:airfare:returnDateSelected", { "analyticsAction": this.analyticsAction });
        }
    };

    /**
     * Initializes an AirfarePromoPopup sub-class, extends the AirfarePromo super-class, binds events.
     *
     * @constructor
     * @this {AirfarePromoPopup}
     * @param {object} options
     * @param {string} options.arrivalInputSelector [description]
     * @param {string} options.departureInputSelector [description]
     * @param {string} options.submitButtonSelector [description]
     * @param {string} options.triggerSelector [description]
     */
    function AirfarePromoPopup(options) {
        AirfarePromo.call(this, options);
        this.placement = options.placement || "popup";

        // apply handler via docuemnt in case triggers are loaded asynchronously
        $(document).on("click", options.triggerSelector, this.onPopupTriggerClick.bind(this));
    }

    // Create a AirfarePromoPopup.prototype object that inherits from AirfarePromo.prototype.
    AirfarePromoPopup.prototype = Object.create(AirfarePromo.prototype);
    // Set the "constructor" property to refer to AirfarePromoPopup
    AirfarePromoPopup.prototype.constructor = AirfarePromoPopup;

    /**
     * Handles popup opener's click event, reads options from data attributes and sets values of corresponding hidden inputs.
     *
     * @this {AirfarePromoPopup}
     * @param  {object} event JavaScript event object.
     * @return {boolean}
     */
    AirfarePromoPopup.prototype.onPopupTriggerClick = function(event) {
        event.preventDefault();

        this.destinationId = $(event.target).data("destinationId") || this.destinationId;
        this.destinationAirportName = $(event.target).data("destinationAirportName") || this.destinationAirportName;
        this.$arrivalInput.val(this.destinationAirportName).trigger("input");
        this.destinationAirportCode = $(event.target).data("destinationAirportCode") || this.destinationAirportCode;
        this.$arrivalHiddenInput.val(this.destinationAirportCode);
        this.analyticsAction = $(event.target).data("promosAnalyticsAction");

        return false;
    };

    /**
     * Initializes an AirfarePromoOverlay sub-class, extends the AirfarePromo super-class, binds events.
     *
     * @constructor
     * @this {AirfarePromoOverlay}
     * @param {[type]} options [description]
     * @param {string} options.arrivalInputSelector [description]
     * @param {string} options.departureInputSelector [description]
     * @param {string} options.submitButtonSelector [description]
     * @param {string} options.triggerSelector [description]
     */
    function AirfarePromoOverlay(options) {
        AirfarePromo.call(this, options);
        this.placement = options.placement || "overlay";
        // bind events
        this.$trigger = $(options.triggerSelector);

        // apply handler via docuemnt in case triggers are loaded asynchronously
        $(document).on("click", options.triggerSelector, this.onOverlayTriggerClick.bind(this));
    }

    // Create a AirfarePromoOverlay.prototype object that inherits from AirfarePromo.prototype.
    AirfarePromoOverlay.prototype = Object.create(AirfarePromo.prototype);
    // Set the "constructor" property to refer to AirfarePromoOverlay
    AirfarePromoOverlay.prototype.constructor = AirfarePromoOverlay;

    /**
     * Handles overlay opener's click event, reads values from data attributes and sets values of corresponding hidden input elements.
     *
     * @this {AirfarePromoOverlay}
     * @param  {object} event JavaScript click event object.
     * @return {boolean}
     */
    AirfarePromoOverlay.prototype.onOverlayTriggerClick = function(event) {
        event.preventDefault();

        this.destinationId = $(event.target).data("destinationId") || this.destinationId;
        this.destinationAirportName = $(event.target).data("destinationAirportName") || this.destinationAirportName;
        this.$arrivalInput.val(this.destinationAirportName).trigger("input");
        this.destinationAirportCode = $(event.target).data("destinationAirportCode") || this.destinationAirportCode;
        this.$arrivalHiddenInput.val(this.destinationAirportCode);
        this.analyticsAction = $(event.target).data("promosAnalyticsAction");

        return false;
    };

    /**
     * Initializes an AirfarePromoInline sub-class, extends the AirfarePromo super-class.
     *
     * @constructor
     * @this {AirfarePromoInline}
     * @param {[type]} options [description]
     */
    function AirfarePromoInline(options) {
        AirfarePromo.call(this, options);
        this.placement = options.placement || "inline";
    }

    // Create a AirfarePromoInline.prototype object that inherits from AirfarePromo.prototype.
    AirfarePromoInline.prototype = Object.create(AirfarePromo.prototype);
    // Set the "constructor" property to refer to AirfarePromoInline
    AirfarePromoInline.prototype.constructor = AirfarePromoInline;


    /**
     * Initializes a HotelPriceFinderPromo super-class.
     *
     * @constructor
     * @this {HotelPriceFinderPromo}
     * @param {object} options
     * @param {string} options.hotelId [description]
     * @param {string} options.hotelName [description]
     * @param {string} options.containerSelector [description]
     * @param {string} options.hotelNameHeadingSelector [description]
     */
    function HotelPriceFinderPromo(options) {
        this.partner = "tripadvisor";
        this.placement = null;
        this.hotelId = options.hotelId || null;
        this.hotelTaId = options.hotelTaId || null;
        this.hotelName = options.hotelName || null;
        this.analyticsAction = options.analyticsAction || null;
        this.options = options;

        this.$container = $(options.containerSelector);
        if (!this.$container.attr("id")) { this.$container.attr("id", "hotel-pricefinder-promo-" + parseInt(Math.random() * 10000000000000000)) }

        this.$hotelNameHeading = $(options.hotelNameHeadingSelector);

        this.$submitButton = (typeof options.submitButtonSelector === "undefined") ? this.$container.find(".action.button") : $(options.submitButtonSelector);
        this.$iframeContainer = this.$container.find(".iframe-container");
        this.$checkinInput = (typeof options.checkinInputSelector==="undefined") ? this.$container.find(".checkin-date") : $(options.checkinInputSelector);
        this.$checkoutInput = (typeof options.checkoutInputSelector==="undefined") ? this.$container.find(".checkout-date") : $(options.checkoutInputSelector);

        // bind events
        this.$submitButton.on("click", this.onSubmitButtonClick.bind(this));
        usn.travel.events.on('datepicker:valueChanged', this.onDatepickerSelect.bind(this));
    }

    /**
     * Handles the promo submit button click, calls findPrices.
     *
     * @this {HotelPriceFinderPromo}
     * @param  {object} event JavaScript click event.
     * @return {boolean}
     */
    HotelPriceFinderPromo.prototype.onSubmitButtonClick = function(event) {
        event.preventDefault();

        var userInitiated = true;

        // get updated hotel info from target's data if exists
        var $target = $(event.target);
        this.hotelId = $target.data("hotelId") || this.hotelId;
        this.hotelTaId = $target.data("hotelTaId") || this.hotelTaId;
        this.hotelName = $target.data("hotelName") || this.hotelName;

        this.findPrices.call(this, userInitiated);

        return false;
    };

    /**
     * Handles all datepicker select events, checks if datepicker belongs to this object and calls findPrices accordingly.
     *
     * @this {HotelPriceFinderPromo}
     * @param  {object} data
     * @param {object} data.input The datepicker's input element.
     */
    HotelPriceFinderPromo.prototype.onDatepickerSelect = function(data) {
        if (!!$(data.input).is(this.$checkoutInput)) {

            usn.travel.events.trigger("promos:pricefinder:checkoutDateSelected", {
                "analyticsAction": this.analyticsAction,
                "input": data.input,
                "placement": this.placement
            });

            var userInitiated = true;
            this.findPrices.call(this, userInitiated);
        }
    };

    /**
     * Checks for cookied checkin/checkout dates, fires event, initiates Trip Advisor API object, injects the object's iframe element into the DOM, invokes callback.
     *
     * @this {HotelPriceFinderPromo}
     * @param  {boolean} userInitiated Determines whether the invocation was initiated by a user, passed to callback.
     */
    HotelPriceFinderPromo.prototype.findPrices = function(userInitiated) {

        userInitiated = userInitiated===true ? userInitiated : false;

        var tripAdvisorIframe = null;

        if (usn.travel.hasCookies("checkin_date", "checkout_date")) {

            usn.travel.events.trigger('usn.travel.hotels.event.priceFinderFindingPrices', {firedOn: this.$container});

            var checkin = usn.travel.getDateCookie("checkin_date");
            var checkout = usn.travel.getDateCookie("checkout_date");
            var options = {
                "width": this.options.width ? this.options.width : 300,
                "height": this.options.height ? this.options.height : 260,
                "key": this.options.key ? this.options.key : "1BC939997ADF43248096C8FF7D34EA0B",
                "hotelId": this.hotelId,
                "hotelTaId": this.hotelTaId,
                "checkIn": checkin,
                "checkOut": checkout,
                "placement": this.placement,
                "partner": this.partner,
                "limitUnpremium": true
            };

            var selector = '#'+this.$container.attr("id")+' [data-js-handle="ta-price-finder-api-sink"]';
            var element = document.querySelector(selector);
            tripAdvisorIframe = {
                element: element
            };
            var that = this;
            USN.dispatcher.trigger('summon:travel:components', function(module) {
                var taModel = module.initHotelPrices(selector, options);
                if (taModel) {
                    that.onFindPricesComplete(tripAdvisorIframe, userInitiated);
                    element.dispatchEvent(new Event('load'));
                }
            });
            if (window.__VWO_TEST_ID && window.__VWO_TEST_CUSTOM_GOAL) {
                window.usn.travel.events.on('promos:pricefinder:linkClicked', function() {
                    window._vis_opt_queue = window._vis_opt_queue || [];
                    window._vis_opt_queue.push(function() {
                        _vis_opt_register_conversion(
                            window.__VWO_TEST_CUSTOM_GOAL,
                            window.__VWO_TEST_ID
                        );
                    });
                });
            }
            //this.$container.find('.ta-price-finder').addClass('ta-price-finder-api');
            this.loadIframes(tripAdvisorIframe);

            if (userInitiated) {
                // TODO see if we can combine all init events into this one
                usn.travel.events.trigger("promos:pricefinder:userInitiated", {
                    "partner": this.partner,
                    "placement": this.placement,
                    "action": "submit",
                    "containerId": this.$container.attr("id")
                });
            }
        }
        // invoke callback with iframe and whether was user initiated
        this.onFindPricesComplete.call(this, tripAdvisorIframe, userInitiated);
    };

    HotelPriceFinderPromo.prototype.loadIframes = function(tripAdvisorIframe) {
        /*
         *  Loads visible Iframes on call, Loads hidden Iframes on window resize;
         */
            var emptyContainers = [],
                MOBILE_WIDTH = 768,
                DEBOUNCE_TIME = 400;

            this.$iframeContainer.each(function() {
                var $this = $(this),
                    isMobileContainer = $this.data('screen') == 'mobile',
                    isMobileSize = $(window).width() < MOBILE_WIDTH,
                    hasDataScreen = Boolean($this.data('screen'));

                //only add iframe contents to 'visible' container, limit check only for data-screen iframe containers
                if (hasDataScreen && (isMobileContainer && !isMobileSize || !isMobileContainer && isMobileSize)) {
                    emptyContainers.push($this);
                    return;
                }
                $this.html(tripAdvisorIframe.element);
            });

            // if we have empty iframe parents
            if (emptyContainers.length) {
                var iframeLoader = function() {
                    for (var i = 0, j = emptyContainers.length; i < j; i++) {
                        var isMobileContainer = emptyContainers[i].data('screen') == 'mobile',
                            isMobileSize = $(window).width() < MOBILE_WIDTH;
                        if (isMobileContainer && isMobileSize || !isMobileContainer && !isMobileSize) {
                            //show iframe
                            var clone = $.clone(tripAdvisorIframe.element);
                            emptyContainers[i].html(clone);
                            //remove from empty
                            emptyContainers.splice(i, 1);
                        }
                    }
                    // at this point we might be done with all of the iframes, so no need to listen to resize anymore
                    if (!emptyContainers.length) $(window).off('resize', lazyIframeLoader);
                };
                var lazyIframeLoader = window._.debounce(iframeLoader, DEBOUNCE_TIME);
                $(window).on('resize', lazyIframeLoader);
            }
    };

    /**
     * Callback for findPrices method, invoked after Trip Advisor API has been queried.
     *
     * @this {HotelPriceFinderPromo}
     * @param  {object} tripAdvisorIframe TripAdvisorIframe object.
     * @param  {boolean} userInitiated Whether nor not the request for prices was initiated by a user.
     */
    HotelPriceFinderPromo.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {/*...*/};

    /* Hotel Price Finder Popup subclass */
    function HotelPriceFinderPromoPopup(options) {
        HotelPriceFinderPromo.call(this, options);

        this.placement = options.placement || "popup";

        // apply handler via docuemnt in case triggers are loaded asynchronously
        $(document).on("click", options.triggerSelector, this.onPopupTriggerClick.bind(this));

        // TODO determine if we still need this for maps, apparently the above handler works fine now
        // usn.travel.events.on("map:popup:clicked", function(data) {
        //     var $element = $(data.event.target);
        //     if ($element.is($(options.triggerSelector))) {
        //         this.onPopupTriggerClick.call(this, data.event);
        //     }
        // }.bind(this));
    }
    HotelPriceFinderPromoPopup.prototype = Object.create(HotelPriceFinderPromo.prototype);
    HotelPriceFinderPromoPopup.prototype.constructor = HotelPriceFinderPromoPopup;

    HotelPriceFinderPromoPopup.prototype.onPopupTriggerClick = function(event) {
        event.preventDefault();

        this.hotelId = $(event.target).data("hotelId");
        this.hotelTaId = $(event.target).data("hotelTaId");
        this.hotelName = $(event.target).data("hotelName");
        this.$hotelNameHeading.html(this.hotelName);
        this.analyticsAction = $(event.target).data("promosAnalyticsAction");

        // determine to show/hide the datepickers
        var display = $(event.target).data("showDatepickers")===false ? "none" : "flex";
        this.$container.find(".datepicker-container").css({"display": display});

        var userInitiated = true;
        this.findPrices.call(this, userInitiated);

        return false;
    };

    HotelPriceFinderPromoPopup.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {
        if (userInitiated) {
            usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPopupPriceFinder', {});
        }
    };

    /* Hotel Price Finder Overlay subclass */
    function HotelPriceFinderPromoOverlay(options) {
        HotelPriceFinderPromo.call(this, options);

        this.placement = options.placement || "overlay";

        // bind events
        $(document).on("click", options.triggerSelector, this.onOverlayTriggerClick.bind(this));

        usn.travel.events.on("map:popup:clicked", function(data) {
            var $element = $(data.event.target);
            if ($element.is($(options.triggerSelector))) {
                this.onOverlayTriggerClick.call(this, data.event);
            }
        }.bind(this));
    }

    HotelPriceFinderPromoOverlay.prototype = Object.create(HotelPriceFinderPromo.prototype);
    HotelPriceFinderPromoOverlay.prototype.constructor = HotelPriceFinderPromoOverlay;
    HotelPriceFinderPromoOverlay.pristine = true;

    HotelPriceFinderPromoOverlay.prototype.onOverlayTriggerClick = function(event) {
        event.preventDefault();

        usn.travel.events.trigger("promos:priceFinder:overlayTriggerClicked");

        this.hotelId = $(event.target).data("hotelId");
        this.hotelTaId = $(event.target).data("hotelTaId");
        this.hotelName = $(event.target).data("hotelName");
        this.$hotelNameHeading.html(this.hotelName);
        this.analyticsAction = $(event.target).data("promosAnalyticsAction");

        var userInitiated = false;
        this.findPrices.call(this, userInitiated);

        return false;
    };

    HotelPriceFinderPromoOverlay.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {
        this.$iframeContainer.fadeIn(500);

        var elContainer       = this.$container,
            elDates           = elContainer.find('.hide-on-dates-select'),
            elSwitchDates     = elContainer.find('.switch-dates'),
            elChangeDate      = elSwitchDates.find('a'),
            elTripadvisorLogo = elContainer.find('.powered-by'),
            elShowPrices      = elContainer.find('.show-prices');

        if (tripAdvisorIframe) {

            tripAdvisorIframe.element.addEventListener('load', function() {

                elTripadvisorLogo.slideDown();

                elContainer.addClass("iframe-loaded");

                var startDate = new Date(Number($.cookie('checkin_date'))),
                    endDate   = new Date(Number($.cookie('checkout_date')));

                if (startDate && endDate) {
                    elDates.slideUp();
                    elSwitchDates.slideDown(500, function () {
                        elSwitchDates.find('.inject-start-date')
                            .text(startDate.getMonth()+1+'/'+startDate.getDate()+'/'+startDate.getFullYear());

                        elSwitchDates.find('.inject-end-date')
                            .text(endDate.getMonth()+1+'/'+endDate.getDate()+'/'+endDate.getFullYear());
                    });

                    elChangeDate.on('click touchend', function (e) {
                        elSwitchDates.slideUp();
                        elDates.not(".keep-hidden").slideDown();
                        elTripadvisorLogo.slideUp();
                        e.preventDefault();
                    });

                    HotelPriceFinderPromoOverlay.pristine = false;

                }

                usn.travel.events.trigger('usn.travel.hotels.event.priceFinderDatesSelected', {});
                if (userInitiated) {
                    usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPriceFinder', {});
                }

            });

            usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPopupPriceFinder', {});
        }
    };

    function HotelPriceFinderPromoHero(options) {
        HotelPriceFinderPromo.call(this, options);

        this.placement = options.placement || "right_rail";

        $(".change-dates").on("click", function(e) {
            e.preventDefault();
            this.$container.attr("data-promo-state", "showing-datepickers");
            return false;
        }.bind(this));

        var userInitiated = false;
        this.findPrices.call(this, userInitiated);
    }

    // Create a HotelPriceFinderPromoHero.prototype object that inherits from HotelPriceFinderPromo.prototype.
    HotelPriceFinderPromoHero.prototype = Object.create(HotelPriceFinderPromo.prototype);
    // Set the "constructor" property to refer to HotelPriceFinderPromoHero
    HotelPriceFinderPromoHero.prototype.constructor = HotelPriceFinderPromoHero;

    HotelPriceFinderPromoHero.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {
        if (!!tripAdvisorIframe) {

            // write date text and data to element
            this.$container.find(".checkin-date-display")
                .data("checkin-date", usn.travel.getCookie("checkin_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkin_date")));
            this.$container.find(".checkout-date-display")
                .data("checkout-date", usn.travel.getCookie("checkout_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkout_date")));

            this.$container.attr("data-promo-state", "showing-prices");

            usn.travel.events.trigger('usn.travel.hotels.event.priceFinderDatesSelected', {});

            if (!!userInitiated) {
                usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPriceFinder', {});
            }
        } else if (userInitiated) {
            this.$container.attr("data-promo-state", "showing-datepickers");
            this.$container.find(".checkin-date").focus();
        }
    };

    function HotelPriceFinderPromoInline(options) {
        HotelPriceFinderPromo.call(this, options);

        this.placement = options.placement || "inline";

        var userInitiated = false;
        this.findPrices.call(this, userInitiated);
    }

    // Inherits HotelPriceFinderPromoHero
    HotelPriceFinderPromoInline.prototype = Object.create(HotelPriceFinderPromoHero.prototype);
    HotelPriceFinderPromoInline.prototype.constructor = HotelPriceFinderPromoHero;
    HotelPriceFinderPromo.pristine = true;

    // Overrides onFindPricesComplete
    HotelPriceFinderPromoInline.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {

        if (!!tripAdvisorIframe) {

            var elContainer = this.$container,
                elDates       = elContainer.find('.hide-on-dates-select'),
                elSwitchDates = elContainer.find('.switch-dates'),
                elChangeDate  = elSwitchDates.find('a'),
                isMobile      = Modernizr.touch;

            if (isMobile && !HotelPriceFinderPromo.pristine) {
                elDates.find(".keep-hidden-for-mobile-only").addClass('keep-hidden');
                elContainer.addClass("mobile-override");
            }

            tripAdvisorIframe.element.addEventListener('load', function() {

                if (HotelPriceFinderPromo.pristine) elContainer.addClass("iframe-loaded");

                // TODO replace $.cookie calls with vanilla JavaScript -IIG
                var startDate = new Date(Number($.cookie('checkin_date'))),
                    endDate   = new Date(Number($.cookie('checkout_date')));

                if (startDate && endDate) {
                    elDates.slideUp();
                    elSwitchDates.slideDown(500, function () {
                        elSwitchDates.find('.inject-start-date')
                            .text(startDate.getMonth()+1+'/'+startDate.getDate()+'/'+startDate.getFullYear());

                        elSwitchDates.find('.inject-end-date')
                            .text(endDate.getMonth()+1+'/'+endDate.getDate()+'/'+endDate.getFullYear());
                    });

                    elChangeDate.on('click touchend', function (e) {

                        elSwitchDates.slideUp();
                        elDates.not(".keep-hidden").slideDown();
                        e.preventDefault();
                    });

                    HotelPriceFinderPromo.pristine = false;

                }

                usn.travel.events.trigger('usn.travel.hotels.event.priceFinderDatesSelected', {});
                if (!!userInitiated) {
                    usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPriceFinder', {});
                }

            });

        }
    };

    function HotelPriceFinderPromoListingItem(options) {

        options.submitButtonSelector = []; // disable submit button
        HotelPriceFinderPromo.call(this, options);

        this.placement = options.placement || "listing";

        this.iframeContainerMaxHeight = "280px"; // max height of the iframe to show
        this.iframeContainerMinHeight = "65px"; // min height of the iframe to show
        this.animationInProgress = false; // used to prevent rapid mouseover/mouseout bug
        this.storedMouseEvents = []; // used to prevent rapid mouseover/mouseout bug

        var mouseEventSelector = ".ta-price-finder .iframe-container iframe, .ta-price-finder .iframe-container .ta-price-finder-api";
        this.$container.on("mouseenter", mouseEventSelector, this.onMouseenter.bind(this));
        this.$container.on("mouseleave", mouseEventSelector, this.onMouseleave.bind(this));

        this.onListingItemInView();

        // listing button click for analytics
        var containerIdSelector = "#"+this.$container.attr("id");
        $(document).on("click", containerIdSelector+" .show-for-large-up .action.button, "+containerIdSelector+" .show-for-large-up a.change-dates", function() {
            usn.travel.events.trigger('promos:pricefinder:listingButtonClicked', {});
        });
    }

    // Create a HotelPriceFinderPromoListingItem.prototype object that inherits from HotelPriceFinderPromo.prototype.
    HotelPriceFinderPromoListingItem.prototype = Object.create(HotelPriceFinderPromo.prototype);
    // Set the "constructor" property to refer to HotelPriceFinderPromoListingItem
    HotelPriceFinderPromoListingItem.prototype.constructor = HotelPriceFinderPromoListingItem;

    HotelPriceFinderPromoListingItem.prototype.onListingItemInView = function() {
        var inDate = this.$container.find(".checkin-date").data("checkin-date");
        var outDate = this.$container.find(".checkout-date").data("checkout-date");

        var that=this;
        setTimeout(function() {
            if (usn.travel.getCookie("checkin_date") != inDate || usn.travel.getCookie("checkout_date") != outDate) {
                var userInitiated = false;
                that.findPrices.call(that, userInitiated);
            }
        }, 1);

    };

    HotelPriceFinderPromoListingItem.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {
        if (!!tripAdvisorIframe) {

            var that = this;
            tripAdvisorIframe.element.addEventListener('load', function() {
                that.$container.addClass("iframe-loaded");
                usn.travel.events.trigger('usn.travel.hotels.event.taPriceFinderIframeLoaded', {firedOn: that.$container});
            });

            // write date text and data to element
            this.$container.find(".checkin-date")
                .data("checkin-date", usn.travel.getCookie("checkin_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkin_date")));
            this.$container.find(".checkout-date")
                .data("checkout-date", usn.travel.getCookie("checkout_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkout_date")));

            // TODO should probably clean these two items up a little bit
            this.$container.find(".show-for-large-up .action.button").hide();
            this.$container.find(".ta-price-finder").show();

            if (!!userInitiated) {
                usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPriceFinder', {});
            }

            // assume each search result has an iframe, add class to parent for styling purposes
            $(".search-content").addClass("showing-prices");
        } else {
            // don't have prices
            $(".search-content").removeClass("showing-prices");
        }
    };

    HotelPriceFinderPromoListingItem.prototype.onDatepickerSelect = function(data) {
        if ($(data.input).is(this.$checkoutInput)) {
            // compare timestamps to prevent multiple unwanted analytics pings from going out from multiple listeners
            if (data.timestamp !== usn.travel.promos.datepickerTimestamp) {
                usn.travel.promos.datepickerTimestamp = data.timestamp;
                usn.travel.events.trigger("promos:pricefinder:checkoutDateSelected", {
                    "analyticsAction": this.analyticsAction,
                    "input": data.input,
                    "placement": this.placement
                });
            }

            var userInitiated = true;
            this.findPrices(userInitiated);
            this.closeDatepickerPopup();
        }
    };

    HotelPriceFinderPromoListingItem.prototype.closeDatepickerPopup = function() {
        $(this.$checkoutInput.closest(".usn-popup").data("hideTrigger")).click();
    };

    HotelPriceFinderPromoListingItem.prototype.onMouseenter = function(event) {
        this.storedMouseEvents.push("mouseenter");

        if (!this.animationInProgress) {
            this.animationInProgress = true;
            var context = this;

            $(event.target).closest(".search-result").find(".iframe-container").animate({ "height": this.iframeContainerMaxHeight }, 400, "swing", function() {

                $(event.target).closest(".ta-price-finder").addClass("block-loosest").removeClass("block-tight");

                context.animationInProgress = false;
                if (context.storedMouseEvents[context.storedMouseEvents.length-1] === "mouseleave") {
                    // trigger last event
                    $(event.target).mouseleave();
                }
            });
        }
    };

    HotelPriceFinderPromoListingItem.prototype.onMouseleave = function(event) {
        this.storedMouseEvents.push("mouseleave");

        if (!this.animationInProgress) {
            this.animationInProgress = true;

            $(event.target)
                .closest(".ta-price-finder")
                .addClass("block-tight")
                .removeClass("block-loosest");

            var context = this;
            $(event.target)
                .closest(".search-result")
                .find(".iframe-container")
                .animate({ "height": this.iframeContainerMinHeight }, 400, "swing", function() {
                context.animationInProgress = false;
                if (context.storedMouseEvents[context.storedMouseEvents.length-1] === "mouseenter") {
                    // trigger last event
                    $(event.target).mouseenter();
                }
            });
        }
    };

    function HotelPriceFinderPromoInterstitial(options) {
        HotelPriceFinderPromo.call(this, options);

        this.placement = options.placement || "interstitial";
        this.isCurrentSlide = false;

        // event listeners
        usn.travel.events.on("usn.travel.event.slideshowChanged", this.onSlideshowChanged.bind(this));

        var userInitiated = false;
        this.findPrices.call(this, userInitiated);
    }
    // Create a HotelPriceFinderPromoInterstitial.prototype object that inherits from HotelPriceFinderPromo.prototype.
    HotelPriceFinderPromoInterstitial.prototype = Object.create(HotelPriceFinderPromo.prototype);
    // Set the "constructor" property to refer to HotelPriceFinderPromoInterstitial
    HotelPriceFinderPromoInterstitial.prototype.constructor = HotelPriceFinderPromoInterstitial;

    HotelPriceFinderPromoInterstitial.prototype.onSlideshowChanged = function(data) {/* TODO: figure out way to hide floating button when Price Finder Insterstial is shown */};

    HotelPriceFinderPromoInterstitial.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {
        if (!tripAdvisorIframe && userInitiated) {
            // trigger calendar open if no dates and user clicked "Show Prices" button
            this.$checkinInput.focus();
        }
    };

    function HotelPriceFinderPromoRightRail(options) {
        HotelPriceFinderPromo.call(this, options);

        this.placement = options.placement || "right_rail";

        $(".change-dates").on("click", function(e) {
            e.preventDefault();
            this.$container.attr("data-promo-state", "showing-datepickers");
            return false;
        }.bind(this));
        var userInitiated = false;
        this.findPrices.call(this, userInitiated);

        // listen for other price finder initiations
        usn.travel.events.on("promos:pricefinder:userInitiated", this.onUserInitiatedFindPrices.bind(this));
    }
    // Create a HotelPriceFinderPromoRightRail.prototype object that inherits from HotelPriceFinderPromo.prototype.
    HotelPriceFinderPromoRightRail.prototype = Object.create(HotelPriceFinderPromo.prototype);
    // Set the "constructor" property to refer to HotelPriceFinderPromoRightRail
    HotelPriceFinderPromoRightRail.prototype.constructor = HotelPriceFinderPromoRightRail;

    HotelPriceFinderPromoRightRail.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {
        if (!!tripAdvisorIframe) {

            // write date text and data to element
            this.$container.find(".checkin-date-display")
                .data("checkin-date", usn.travel.getCookie("checkin_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkin_date")));
            this.$container.find(".checkout-date-display")
                .data("checkout-date", usn.travel.getCookie("checkout_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkout_date")));


            this.$container.attr("data-promo-state", "showing-prices");
            // this.$container.find(".show-prices-section").fadeOut();
            // this.$container.find(".ta-prices, .change-dates-section").fadeIn(500, function() {usn.travel.offsetRightRail(20);});

            // usn.travel.events.trigger('usn.travel.hotels.event.priceFinderDatesSelected', {});

            // if (!!userInitiated) {
            //     usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPriceFinder', {});
            // }
        } else if (userInitiated) {
            this.$container.attr("data-promo-state", "showing-datepickers");
            // this.$container.find(".show-prices-section .checkin-date").focus();
        }
    };

    /**
     * Handler for "promos:pricefinder:userInitiated" event, fires findPrices if (1) event was not initiated by this price finder and (2) dates have changed
     *
     * @this {HotelPriceFinderPromoRightRail}
     * @param  {object} data Custom event data object.
     */
    HotelPriceFinderPromoRightRail.prototype.onUserInitiatedFindPrices = function(data) {
        var inDate = this.$container.find(".checkin-date-display").data("checkinDate");
        var outDate = this.$container.find(".checkout-date-display").data("checkoutDate");

        // ensure event was not fired by this price finder itself
        if (data.containerId !== this.$container.attr("id")) {
            // compare dates to prevent redundant requests
            if (usn.travel.getCookie("checkin_date") != inDate || usn.travel.getCookie("checkout_date") != outDate) {
                var userInitiated = false; // consider this request non-user initiated (because it was initiated by another price finder)
                this.findPrices.call(this, userInitiated);
            }
        }
    };

    function HotelPriceFinderPromoILM(options) {
        HotelPriceFinderPromo.call(this, options);

        $(options.containerSelector + " .change-dates").on("click", function(e) {
            e.preventDefault();
            this.$container.attr("data-promo-state", "showing-datepickers");
            return false;
        }.bind(this));

        usn.travel.events.on("maps:ilm:locationSlideready", function(data) {
            if (data.locationType === "hotel") {

                this.hotelId = data.id;
                this.hotelTaId = data.taId;

                var userInitiated = true;
                this.findPrices(this, userInitiated);
            }
        }.bind(this));
    }
    // Create a HotelPriceFinderPromoILM.prototype object that inherits from HotelPriceFinderPromo.prototype.
    HotelPriceFinderPromoILM.prototype = Object.create(HotelPriceFinderPromo.prototype);
    // Set the "constructor" property to refer to HotelPriceFinderPromoILM
    HotelPriceFinderPromoILM.prototype.constructor = HotelPriceFinderPromoILM;

    HotelPriceFinderPromoILM.prototype.onFindPricesComplete = function(tripAdvisorIframe, userInitiated) {
        if (!!tripAdvisorIframe) {

            // write date text and data to element
            this.$container.find(".checkin-date-display")
                .data("checkin-date", usn.travel.getCookie("checkin_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkin_date")));
            this.$container.find(".checkout-date-display")
                .data("checkout-date", usn.travel.getCookie("checkout_date"))
                .text(usn.travel.dateToString(usn.travel.getDateCookie("checkout_date")));

            this.$container.attr("data-promo-state", "showing-prices");

            usn.travel.events.trigger('usn.travel.hotels.event.priceFinderDatesSelected', {});

            if (!!userInitiated) {
                usn.travel.events.trigger('usn.travel.hotels.event.userInitiatedPriceFinder', {});
            }
        } else if (userInitiated) {
            this.$container.attr("data-promo-state", "showing-datepickers");
            this.$container.find(".checkin-date").focus();
        }
    };

    function HotelSearchPromo(options) {
        this.$container = $(options.containerSelector);
        this.$form = this.$container.find("form");
        this.$submitButton = this.$form.find(".action.button");
        this.$checkoutDateInput = this.$form.find(".checkout-date");
        this.analyticsAction = options.analyticsAction || null;

        // bind events
        usn.travel.events.on("datepicker:valueChanged", this.onDatepickerSelect.bind(this));
        usn.travel.events.on("search:resultSelected", this.onSearchResultSelected.bind(this));
    }

    HotelSearchPromo.prototype.onDatepickerSelect = function(data) {
        if (!!$(data.input).is(this.$checkoutDateInput)) {
            usn.travel.events.trigger("promos:hotelsearch:checkoutDateSelected", {"analyticsAction": this.analyticsAction});
            this.$submitButton.focus();
        }
    };

    HotelSearchPromo.prototype.onSearchResultSelected = function(data) {
        if (!!$(data.element).closest("form").is(this.$form)) {
            if ((this.$form.find(".usn-datepicker").length > 0) && !usn.travel.hasCookies("checkin_date", "checkout_date")) {
                this.$form.find(".usn-datepicker.checkin-date").focus();
            } else {
                this.$submitButton.focus();
            }
        }
    };

    function CruiseFinderPromo(options) {
        this.partner = "cruiseline";
        this.placement = null;
        this.cruises = [];
        this.cruiseLineId = options.cruiseLineId || "";
        this.cruiseShipId = options.cruiseShipId || "";
        this.defaultRegion = options.defaultRegion || "";
        this.defaultDeparturePort = options.defaultDeparturePort || "";
        this.nextPage = null;
        this.containerSelector = options.containerSelector;
        this.$container = $(this.containerSelector);
        this.$heading = this.$container.find("h3");
        this.$contentContainer = this.$container.find(".cruise-finder-promo-content");
        this.$filtersContainer = this.$container.find(".cruise-finder-promo-filters");
        this.$cruisesContainer = this.$container.find(".cruise-items");
        this.$scrollableContent = typeof options.scrollableContentSelector === "string" ? $(options.scrollableContentSelector) : this.$cruisesContainer;
        this.busyIndicatorSelector = options.busyIndicatorSelector || "img[data-js-id='primary-busy-indicator']";
        this.$openTrigger = $("");
        this.parentSelector = "";
        if (!this.$container.attr("id")) { this.$container.attr("id", "cruise-finder-promo-" + parseInt(Math.random() * 10000000000000000)); }

        // setutp filter/sort select onchange event handlers
        this.$contentContainer.on("change", 'select, input[type="radio"]', this.refineSearch.bind(this));
        this.$scrollableContent.on("scroll", this.onCruisesScroll.bind(this));
        this.$container.on("click", ".cruise-items a.cruise-item", this.onCruiseItemClicked.bind(this));
    }

    CruiseFinderPromo.prototype.afterGetDataSuccess = function(searchParams) { /*...*/ };

    CruiseFinderPromo.prototype.onGetDataSuccess = function(searchParams, data) {
        usn.travel.hideLoader(this.busyIndicatorSelector, ".cruise-finder-promo");

        this.nextPage = data["next_page"];

        // heading/title
        var title = data["title"];
        this.$heading.find("small").text(" on " + title);

        // clear result area if user has refined their search
        if (searchParams.refine_search === 1) {
            this.clearResults.call(this);
        }
        // if cruies returned
        var cruises = data["cruises"], cruise;
        if (cruises.length > 0) {

            // output filters
            this.clearFilters.call(this);
            var selected;
            var sail_dates = data["sail_dates"], sail_date;
            for (var i = 0, len = sail_dates.length; i < len; i++) {
                sail_date = sail_dates[i];
                selected = searchParams.sail_month===sail_date.value ? ' selected="selected"' : '';
                this.$filtersContainer.find('select[name="sail_month"]').append('<option value="'+sail_date.value+'"'+selected+'>'+sail_date.display+'</option>');
            }

            var departurePorts = data["departure_ports"], departurePort, selectedDeparturePort;
            for (var i = 0, len=departurePorts.length; i < len; i++) {
                departurePort = departurePorts[i];
                selectedDeparturePort = searchParams.departure_port || data["selected_departure_port"];
                selected = selectedDeparturePort===departurePort.value ? ' selected="selected"' : '';
                this.$filtersContainer.find('select[name="departure_port"]').append('<option value="'+departurePort.value+'"'+selected+'>From '+departurePort.display+'</option>');
            }

            var regions = data["regions"], region, selectedRegion;
            for (var i = 0, len = regions.length; i < len; i++) {
                region = regions[i];
                selectedRegion = searchParams.region || data["selected_region"];
                selected = selectedRegion===region.value ? ' selected="selected"' : '';
                this.$filtersContainer.find('select[name="region"]').append('<option value="'+region.value+'"'+selected+'>'+region.display+'</option>');
            }

            var lengths = data["lengths"],  length;
            for (var i = 0, len = lengths.length; i < len; i++) {
                length = lengths[i];
                selected = searchParams.length===length.value ? ' selected="selected"' : '';
                this.$filtersContainer.find('select[name="length"]').append('<option value="'+length.value+'"'+selected+'>'+length.display+'</option>');
            }

            // output itineraries
            this.cruises = this.cruises.concat(cruises);
            for (var i = 0, len = cruises.length; i < len; i++) {
                cruise = cruises[i];

                this.$cruisesContainer.append('\
                    <a href="'+cruise.get_url+'" class="cruise-item border text-black" content="nofollow" target="_blank" data-cruise-name="'+cruise.name+'">\
                        <div class="item-section">\
                            <div class="text-small" title="'+cruise.name+'">'+cruise.name+'</div>\
                            <time class="text-smaller">'+usn.travel.dateToString(cruise.sail_date, "MMM DD, YYYY")+'</time>\
                        </div>\
                        <div class="item-section text-muted text-normal">$'+usn.travel.intComma(cruise.get_lowest_price)+'</div>\
                        <div class="item-section text-white">View</div>\
                    </a>\
                ');
            }
        } else {
            this.$cruisesContainer.html('<div class="block-tight text-small pad-left-normal">'+data["response_message"]+'</div>');
        }

        this.afterGetDataSuccess.call(this, searchParams);
    };

    CruiseFinderPromo.prototype.onGetDataError = function(jqXHR, textStatus, errorThrown) {
        usn.travel.hideLoader(this.busyIndicatorSelector, ".cruise-finder-promo");

        if (this.cruises.length === 0) {
            // show error if no cruises shown
            this.$cruisesContainer.html('<div class="block-tight text-small pad-left-normal">We&rsquo;re sorry, an error has occured. Please try resetting your filters to see results.</div>');
        }

        usn.travel.log(jqXHR, textStatus, errorThrown);
    };

    CruiseFinderPromo.prototype.getFilterParams = function() {
        var params = {}, key, value;
        this.$filtersContainer.find("select, input[type='radio']:checked").each(function() {
            key = $(this).attr("name");
            value = $(this).val();
            if (value.length > 0) {
                params[key] = value;
            }
        });
        return params;
    };

    CruiseFinderPromo.prototype.getData = function(params) {

        params = params || {};
        params["default_region"] = this.defaultRegion;
        params["default_departure_port"] = this.defaultDeparturePort;
        params = $.extend({}, params, this.getFilterParams.call(this));

        // don't show loader when loading subsequent pages
        if (!params.page) {
            usn.travel.showLoader(this.busyIndicatorSelector, ".cruise-finder-promo");
        }

        $.ajax({
            "url": "/ajax/get_cruise_data/?cruise_line_id="+this.cruiseLineId+"&cruise_ship_id="+this.cruiseShipId,
            "data": params,
            "success": this.onGetDataSuccess.bind(this, params),
            "error": this.onGetDataError.bind(this),
            "dataType": "json"
        });

        return false;
    };

    CruiseFinderPromo.prototype.refineSearch = function(event) {

        event.preventDefault();

        this.getData.call(this, { "refine_search": 1 });

        return false;
    };

    CruiseFinderPromo.prototype.onOpenTriggerClick = function(event) {
        event.preventDefault();

        this.clearFilters.call(this);
        this.clearResults.call(this);

        this.$openTrigger = $(event.target);
        this.parentSelector = "#"+this.$openTrigger.closest(".search-result").attr("id");
        this.cruiseShipId = this.$openTrigger.data("cruiseShipId") || "";
        this.cruiseLineId = this.$openTrigger.data("cruiseLineId") || "";
        this.defaultRegion = this.$openTrigger.data("defaultRegion") || "";
        this.defaultDeparturePort = this.$openTrigger.data("defaultDeparturePort") || "";
        this.getData.call(this);

        // console.log( this.parentSelector, $(this.parentSelector));

        return false;
    };

    CruiseFinderPromo.prototype.onCruisesScroll = function(event) {
        if ((this.$scrollableContent.innerHeight() + this.$scrollableContent.scrollTop()) >= (this.$scrollableContent[0].scrollHeight - 120)) {
            if (!!this.nextPage) {
                this.getData.call(this, {"page": this.nextPage});
                this.nextPage = null;
            }
        }
    };

    CruiseFinderPromo.prototype.clearFilters = function() {
        this.$filtersContainer.find("select:not(#sort-by)").each(function() {
            $(this).find("option:not(:first)").remove();
        });
    };

    CruiseFinderPromo.prototype.clearResults = function() {
        this.cruises = [];
        this.$cruisesContainer.empty();
    };

    CruiseFinderPromo.prototype.onCruiseItemClicked = function(event) {

        var $el = $(event.target);
        var cruiseName = !!$el.hasClass("cruise-item") ? $el.data("cruiseName") : $el.closest("a.cruise-item").data("cruiseName");
        usn.travel.events.trigger("promos:cruisefinder:cruiseClicked", {
            "cruiseName": cruiseName,
            "partner": this.partner,
            "placement": this.placement,
            "action": "click"
        });
        return true;
    };

    CruiseFinderPromo.prototype.disableTargetButton = function() {
        this.$openTrigger.blur();
        $(this.parentSelector).find(".action.button").addClass("disabled"); // disable buttons for all breakpoints for this cruise item
    };

    function CruiseFinderPromoModal(options) {
        CruiseFinderPromo.call(this, options);

        this.placement = options.placement || "modal";
        this.modal = usn.travel.modal.init("#" + this.$container.attr("id"));
        this.openTriggerSelector = options.openTriggerSelector+":not(.disabled)";

        $(document).on("click", this.openTriggerSelector, this.onOpenTriggerClick.bind(this));
        $(document).on("click", options.closeTriggerSelector, this.onCloseTriggerClick.bind(this));
    }
    // Create a CruiseFinderPromoModal.prototype object that inherits from CruiseFinderPromo.prototype.
    CruiseFinderPromoModal.prototype = Object.create(CruiseFinderPromo.prototype);
    // Set the "constructor" property to refer to CruiseFinderPromoModal
    CruiseFinderPromoModal.prototype.constructor = CruiseFinderPromoModal;

    CruiseFinderPromoModal.prototype.afterGetDataSuccess = function(searchParams) {

        if (this.cruises.length === 0 && searchParams.refine_search != 1) {
            this.disableTargetButton.call(this);
            return false;
        }

        if (!this.modal.$window.is(":visible")) {
            this.modal.open();
        }
    };

    CruiseFinderPromoModal.prototype.onCloseTriggerClick = function(event) {
        event.preventDefault();
        this.modal.close();
        return false;
    };

    function CruiseFinderPromoInline(options) {
        CruiseFinderPromo.call(this, options);

        this.placement = options.placement || "inline";

        // load data on init
        this.getData.call(this);

        // hide the "Show More" link and enable standard behavior
        $("[data-js-id='cruises_list_show_more']").on("click", function() {
            this.$container.removeClass("limited");
        }.bind(this));
    }
    // Create a CruiseFinderPromoInline.prototype object that inherits from CruiseFinderPromo.prototype.
    CruiseFinderPromoInline.prototype = Object.create(CruiseFinderPromo.prototype);
    // Set the "constructor" property to refer to CruiseFinderPromoInline
    CruiseFinderPromoInline.prototype.constructor = CruiseFinderPromoInline;

    CruiseFinderPromoInline.prototype.afterGetDataSuccess = function(searchParams) {
        // fade out inline widget if no cruises found and user wasn't refining their search
        if (this.cruises.length === 0 && searchParams.refine_search != 1) {
            this.$container
                .removeClass("show-for-large-up")
                .fadeOut();
        }
    };

    function CruiseFinderPromoOverlay(options) {
        CruiseFinderPromo.call(this, options);

        this.placement = "overlay";

        this.overlay = usn.travel.overlay.init($(options.containerSelector));
        this.openTriggerSelector = options.openTriggerSelector+":not(.disabled)";

        $(document).on("click", this.openTriggerSelector, this.onOpenTriggerClick.bind(this));
        $(document).on("click", options.closeTriggerSelector, this.onCloseTriggerClick.bind(this));
    }
    // Create a CruiseFinderPromoOverlay.prototype object that inherits from CruiseFinderPromo.prototype.
    CruiseFinderPromoOverlay.prototype = Object.create(CruiseFinderPromo.prototype);
    // Set the "constructor" property to refer to CruiseFinderPromoOverlay
    CruiseFinderPromoOverlay.prototype.constructor = CruiseFinderPromoOverlay;

    CruiseFinderPromoOverlay.prototype.afterGetDataSuccess = function(searchParams) {

        if (this.cruises.length === 0 && searchParams.refine_search != 1) {
            this.disableTargetButton.call(this);
            return false;
        }

        if (!this.overlay.$element.is(":visible")) {
            this.overlay.show();
        }
    };

    CruiseFinderPromoOverlay.prototype.onCloseTriggerClick = function(event) {
        event.preventDefault();
        this.overlay.hide();
        return false;
    };

    function RentalCarPromo(options) {

        this.destinationAirportCode = options.destinationAirportCode || null;
        this.destinationName = options.destinationName || null;
        this.analyticsAction = options.analyticsAction || null;
        this.$container = $(options.containerSelector);
        this.$pickupDateInput = this.$container.find(".pickup-date");
        this.$dropoffDateInput = this.$container.find(".dropoff-date");
        this.$submitButton = $(options.submitButtonSelector);
        this.$form = this.$submitButton.closest("form");
        this.$form.attr("action", "http://rd.bookingbuddy.com/src/?s=66895")

        // bind events
        this.$submitButton.on("click", this.onSubmitButtonClick.bind(this));
        usn.travel.events.on("datepicker:valueChanged", this.onDatepickerSelect.bind(this));
    }

    RentalCarPromo.prototype.onSubmitButtonClick = function(option) {
        event.preventDefault();
        this.$form.submit();
        return false;
    };

    RentalCarPromo.prototype.onDatepickerSelect = function(data) {
        if (!!$(data.input).is(this.$dropoffDateInput)) {
            usn.travel.events.trigger("promos:rentalCar:dropoffDateSelected", { "analyticsAction": this.analyticsAction });
        }
    };

    function RentalCarPromoInline(options) {
        RentalCarPromo.call(this, options);
    }


    // Create a RentalCarPromoInline.prototype object that inherits from RentalCarPromo.prototype.
    RentalCarPromoInline.prototype = Object.create(RentalCarPromo.prototype);
    // Set the "constructor" property to refer to RentalCarPromoInline
    RentalCarPromoInline.prototype.constructor = RentalCarPromoInline;

    function RentalCarPromoPopup(options) {
        RentalCarPromo.call(this, options);

        this.$pickupCityHiddenInput = $('<input type="hidden" name="pickup_city" />');
        this.$pickupCityInput = $(options.pickupCityInputSelector)
            .after(this.$pickupCityHiddenInput);

        // apply handler via docuemnt in case triggers are loaded asynchronously
        $(document).on("click", options.triggerSelector, this.onPopupTriggerClick.bind(this));
    }

    // Create a RentalCarPromoPopup.prototype object that inherits from RentalCarPromo.prototype.
    RentalCarPromoPopup.prototype = Object.create(RentalCarPromo.prototype);
    // Set the "constructor" property to refer to RentalCarPromoPopup
    RentalCarPromoPopup.prototype.constructor = RentalCarPromoPopup;

    RentalCarPromoPopup.prototype.onPopupTriggerClick = function(event) {
        event.preventDefault();

        this.destinationAirportCode = $(event.target).data("destinationAirportCode") || this.destinationAirportCode;
        this.$pickupCityHiddenInput.val(this.destinationAirportCode);

        this.destinationName = $(event.target).data("destinationName") || this.destinationName;
        this.$pickupCityInput.val(this.destinationName);

        this.analyticsAction = $(event.target).data("promosAnalyticsAction");

        return false;
    };

    function RentalCarPromoOverlay(options) {
        RentalCarPromo.call(this, options);

        this.$pickupCityHiddenInput = $('<input type="hidden" name="pickup_city" />');
        this.$pickupCityInput = $(options.pickupCityInputSelector)
            .after(this.$pickupCityHiddenInput);

        // bind events
        this.$trigger = $(options.triggerSelector);

        // apply handler via docuemnt in case triggers are loaded asynchronously
        $(document).on("click", options.triggerSelector, this.onOverlayTriggerClick.bind(this));
    }

    // Create a RentalCarPromoOverlay.prototype object that inherits from RentalCarPromo.prototype.
    RentalCarPromoOverlay.prototype = Object.create(RentalCarPromo.prototype);
    // Set the "constructor" property to refer to RentalCarPromoOverlay
    RentalCarPromoOverlay.prototype.constructor = RentalCarPromoOverlay;

    RentalCarPromoOverlay.prototype.onOverlayTriggerClick = function(event) {
        event.preventDefault();

        this.destinationAirportCode = $(event.target).data("destinationAirportCode") || this.destinationAirportCode;
        this.$pickupCityHiddenInput.val(this.destinationAirportCode);

        this.destinationName = $(event.target).data("destinationName") || this.destinationName;
        this.$pickupCityInput.val(this.destinationName);

        this.analyticsAction = $(event.target).data("promosAnalyticsAction");

        return false;
    };

    /**
     * Global method that detemrmines which promotion to initiate.
     *
     * @type {Object}
     * @param {string} promoType [description]
     * @param {object} options [description]
     * @return {object} The initiated promotion object.
     */
    usn.travel.promos = {
        "init": function(promoType, options) {
            promoType = promoType;
            options = options || {};

            switch(promoType) {
                case "airfare-popup":
                    return new AirfarePromoPopup(options);
                break;
                case "airfare-overlay":
                    return new AirfarePromoOverlay(options);
                break;
                case "airfare-inline":
                    return new AirfarePromoInline(options);
                break;
                case "hotel-pricefinder-popup":
                    return new HotelPriceFinderPromoPopup(options);
                break;
                case "hotel-pricefinder-overlay":
                    return new HotelPriceFinderPromoOverlay(options);
                break;
                case "hotel-pricefinder-hero":
                    return new HotelPriceFinderPromoHero(options);
                break;
                case "hotel-pricefinder-inline":
                    return new HotelPriceFinderPromoInline(options);
                break;
                case "hotel-pricefinder-listingItem":
                    return new HotelPriceFinderPromoListingItem(options);
                break;
                case "hotel-pricefinder-interstitial":
                    return new HotelPriceFinderPromoInterstitial(options);
                break;
                case "hotel-pricefinder-right-rail":
                    return new HotelPriceFinderPromoRightRail(options);
                break;
                case "hotel-pricefinder-ilm":
                    return new HotelPriceFinderPromoILM(options);
                break;
                case "hotel-search":
                    return new HotelSearchPromo(options);
                break;
                case "cruise-finder-modal":
                    return new CruiseFinderPromoModal(options);
                break;
                case "cruise-finder-inline":
                    return new CruiseFinderPromoInline(options);
                break;
                case "cruise-finder-overlay":
                    return new CruiseFinderPromoOverlay(options);
                break;
                case "rental-car-inline":
                    return new RentalCarPromoInline(options);
                break;
                case "rental-car-popup":
                    return new RentalCarPromoPopup(options);
                break;
                case "rental-car-overlay":
                    return new RentalCarPromoOverlay(options);
                break;
            }
        }
    };

    usn.travel.promos.datepickerTimestamp = null; // global promos variable to prevent datepicker listeners from firing too many analytics events

}(window, jQuery));
