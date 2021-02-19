/*
 *    Namespace: usn.travel.base.js
 *    Description: JavaScript base library for U.S. News Autos Rankings and Reviews
 *    Dependancies:
 *	* Moment JS
 *  	* jQuery
 *  	* jQuery Cookie
 *	* svg4everybody.min.js
 *	* jQuery Unveil
 *    Notes:

 */

/* expected globals */
window.svg4everybody = window.svg4everybody || function() { /*...*/ };

var _INIT_FUNCTIONS = [];
var _ON_INIT = function() {
    for (var i = 0, len = _INIT_FUNCTIONS.length; i < len; i++) {
        _INIT_FUNCTIONS[i].call();
    }
};

/**
 * Used on some of the links from the CMS.
 *
 * @param {string} path to an external resource
 */
var oel = function(path) {
	window.open(path);
};

// show/hide fixed ad slots that conflict with Modals and Overlays
var _toggleFixedAdSlots = function(action) {
    _toggleFixedAdSlots._cache = _toggleFixedAdSlots._cache || { "previousClassList": {}};

    var $fixedSlots = $("#stitialtravel, #adh"), $fixedSlot, id, previousClassList;

    $fixedSlots.each(function() {
        $fixedSlot = $(this);
        id = $fixedSlot.attr("id");

        if (action==="show") {
            // restore the previous class list and show the ad
            previousClassList = _toggleFixedAdSlots._cache.previousClassList[id] || "";
            $fixedSlot.attr("class", previousClassList);
            $fixedSlot.css({ "display": "auto" });

        } else {
            // store the current display value
            _toggleFixedAdSlots._cache.previousClassList[id] = $fixedSlot.attr("class");

            // hide the ad
            $fixedSlot.css({"display": "none"});
            $fixedSlot.attr("class", "");
        }
    });
};

window.usn = window.usn || {};
usn.travel = usn.travel || {};
usn.travel.getRandomString = function() {
    var chars = "abcdefghiklmnopqrstuvwxyz";
    var string_length = 4;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
};
usn.travel.getCVal = function(type, default_value) {
    var l_hash = window.location.hash.replace("#", "");
    if (l_hash != "" && this.getCookie(l_hash) != null) {
        var data = this.getCookie(l_hash).split("&");
        var ddata = {};
        for (var i in data) {
            var entry = data[i].split("=");
            ddata[entry[0]] = entry[1];
        }
        if (type in ddata) return ddata[type];
    }
    return default_value;
};
/*  Method: usn.travel.convertToBoolean
 *  Description: Converts any intelligable number or string to it's Boolean form, or returns false.
 *  Examples:
 *      convertToBoolean(1); // returns true
 *      convertToBoolean("0"); // returns false
 *      convertToBoolean("true"); // returns true
 *
 */
usn.travel.convertToBoolean = function(val) {
    var type = typeof val;

    if (type !== "boolean") {
        if (type === "string" && isNaN(val)) {
            val = (val.toLowerCase() === "true");
        } else {
            val = parseInt(val);
            val = (val === 1);
        }
    }

    return val;
};
usn.travel.getCookie = function(name) {
    var c = $.cookie(name);
    if (typeof c === "undefined") {
        return null; }
    c = /^".*"$/.test(c) ? JSON.parse(c) : c; // JSON.parse if surrounded by double quotes
    return c;
};
usn.travel.getDateCookie = function(name) {
    var cookie = this.getCookie(name);
    if (!!cookie) {
        date = new Date(parseInt(cookie));
        if (moment(date).isValid()) {
            return date;
        }
    }
    return null;
};
usn.travel.getTimestamp = function() {
    return new Date().getTime();
};
/*
    Method: usn.travel.cleanArray
    Description: Removes any blank, null or undefined values from an array.
    Arguments:
        actual - Array. The array to be cleaned.
*/
usn.travel.cleanArray = function(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) { newArray.push(actual[i]); }
    }
    return newArray;
};
usn.travel.setCookie = function(name, value, options) {
    options = options || {};

    var path = options.path || "/";
    var expires = options.expires || null;

    options = {};
    options.path = path;
    if (expires !== null) { options.expires = expires; }

    $.cookie(name, value, options);
};
usn.travel.setDateCookie = function(name, date, options) {
    date = moment(date);
    if (date.isValid()) {
        this.setCookie(name, date.format("x"), options);
        return true;
    }
    return false;
};
usn.travel.hasCookies = function() {
    for (var i = 0, len = arguments.length; i < len; i++) {
        if (this.getCookie(arguments[i]) === null) {
            return false; }
    }
    return true;
};
usn.travel.dateToString = function(date, format) {
    format = format || "MM/DD/YYYY";
    var m = moment(date);
    if (m.isValid()) {
        return m.format(format);
    }
    return date;
};
usn.travel.stringToDate = function(str, format) {
    format = format || "MM/DD/YYYY";
    var m = moment(str, format, true);
    if (m.isValid()) { return m.toDate(); }
    return null;
};
usn.travel.isDateValid = function(date) {
    return moment(date).isValid();
};
usn.travel.isPast = function(date) {
    return moment(date).diff(moment(), 'days') < 0;
};
usn.travel.isFuture = function(date) {
    return moment(date).diff(moment(), 'days') > 0;
};
usn.travel.prependToArray = function(value, arr) {
    arr.reverse().push(value);
    return arr.reverse();
};
usn.travel.isPlaceholderSupported = function() {
    return ('placeholder' in document.createElement('input'));
};
usn.travel.isDateSupported = function() {
    var i = document.createElement("input");
    i.setAttribute("type", "date");
    return i.type !== "text";
};
usn.travel.placeholderFix = function() {
    if (!this.isPlaceholderSupported()) {
        $('[placeholder]').each(function() {
            $(this).val($(this).attr('placeholder'));
        }).focus(function() {
            if ($(this).val() == $(this).attr('placeholder')) {
                $(this).val('');
            }
        }).blur(function() {
            if ($(this).val() == '') {
                $(this).val($(this).attr('placeholder'));
            }
        });
    }
};
/*
    Method: usn.travel.addURLParam
    Description: Adds or replaces any key value pair onto any URL string.
    Arguments:
        key - String, the parameter key to add/replace.
        value - String, the parameter value to add/replace.
        str - String, the URL string.
*/
usn.travel.addURLParam = function(key, value, str) {
    var arr = str.split("?");
    var params = [key + "=" + value];

    if (arr.length > 1) {
        var search = arr[1].split("&"),
            pair;
        for (var i = 0, len = search.length; i < len; i++) {
            pair = search[i].split("=");
            if (pair[0] !== key) {
                params.push(search[i]);
            }
        }
        params = this.cleanArray(params);

        return arr[0] + "?" + params.join("&");
    } else {
        params = this.cleanArray(params);
        return str + "?" + params.join("&");
    }
};
/*
    Method: usn.travel.getURLParam
    Description: Returns any given URL paramter from the window.location.search string.
    Arguments:
        paramName - String, the name of the requested parameter.
*/
usn.travel.getURLParam = function(paramName) {
    var search = decodeURIComponent(window.location.search.substr(1)).split("&");
    var pair;

    for (var i = 0, len = search.length; i < len; i++) {
        pair = search[i].split("=");
        if (pair[0] === paramName && typeof pair[1] !== "undefined") {
            return pair[1]; }
    }
    return null;
};
usn.travel.dateAdd = function(date, amount, unit) {
    return moment(date).add(amount, unit).toDate();
};
usn.travel.dateSubtract = function(date, amount, unit) {
    return moment(date).subtract(amount, unit).toDate();
};
usn.travel.dateIsValid = function(date) {
    return moment(date).isValid();
};
usn.travel.dateDiff = function(date1, date2, unit) {
    return moment(date1).diff(moment(date2), unit);
};
usn.travel.toggleLoader = function(loaderSelector, contentSelector) {

    loaderSelector = loaderSelector || ".busy-indicator";
    contentSelector = contentSelector || ".busy-content";

    if ($(loaderSelector).hasClass("is-hidden")) {
        this.showLoader(loaderSelector, contentSelector);
    } else {
        this.hideLoader(loaderSelector, contentSelector);
    }
};
usn.travel.showLoader = function(loaderSelector, contentSelector) {
    loaderSelector = loaderSelector || ".busy-indicator";
    contentSelector = contentSelector || ".busy-content";

    $(contentSelector).addClass("is-busy").css({"opacity": "0.7" });
    $(loaderSelector).removeClass("is-hidden").css({ "display": "inline-block" });
    $("body").css({ "cursor": "default" });
};
usn.travel.hideLoader = function(loaderSelector, contentSelector) {
    loaderSelector = loaderSelector || ".busy-indicator";
    contentSelector = contentSelector || ".busy-content";

    $(contentSelector).removeClass("is-busy").css({ "opacity": "1.0" });
    $(loaderSelector).addClass("is-hidden");
    $("body").css({ "cursor": "" });
};
usn.travel.intComma = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
usn.travel.inView = function(id, callback) { // custom inview library for now
    callback = typeof callback === "undefined" ? function() {} : callback;

    var $element = $("#"+id);
    if ($element.length > 0) {
        var top = new Waypoint({
            "element": $element[0],
            "offset": -$("#"+id).height(),
            "handler": function(direction) {
                $(this.element).toggleClass("in-view")
                callback.call(this, $(this.element), direction);
            }
        });

        var bottom = new Waypoint({
            "element": $element[0],
            "offset": "100%",
            "handler": function(direction) {
                $(this.element).toggleClass("in-view");
                callback.call(this, $(this.element), direction);
            }
        });
    }
};
usn.travel.offsetRightRail = function(paddingTop) {
    var $heroPromoContainer = $(".right-rail-promo");
    var $rightRailContentWrapper = $(".right-rail-content-wrapper");
    var $window = $(window);

    if ($heroPromoContainer.length > 0 && $rightRailContentWrapper.length > 0) {
        var heroWidgetTop = $heroPromoContainer.offset().top;
        var rightRailTop = $rightRailContentWrapper.offset().top;
        var heroWidgetHeight = $heroPromoContainer.height();
        var paddingTop = paddingTop || 20;

        var marginTop = Math.abs(heroWidgetTop+heroWidgetHeight+paddingTop-rightRailTop);

        if (marginTop > 0 && $window.width() >= 1024) {
            $rightRailContentWrapper.css({"margin-top": marginTop });
        }
    }
};
usn.travel.arraysEqual = function(array1, array2) {
    return (array1.length == array2.length) && array1.every(function(element, index) { return element === array2[index]; });
};
usn.travel.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};
usn.travel.truncateString = function(string, limit) {
    if (string.length > limit) {
        return string.substring(0,limit-1) + "...";
    }
    return string;
};
usn.travel.hasScrollbar = function() {

    // store the return value on the function so we don't have to calculate everytime
    if (usn.travel.hasScrollbar._cache) {
        return usn.travel.hasScrollbar._cache.hasScrollbar;
    }
    usn.travel.hasScrollbar._cache = {};

    // The Modern solution
    if (typeof window.innerWidth === 'number')
    return usn.travel.hasScrollbar._cache.hasScrollbar = (window.innerWidth > document.documentElement.clientWidth);

    // rootElem for quirksmode
    var rootElem = document.documentElement || document.body

    // Check overflow style property on body for fauxscrollbars
    var overflowStyle

    if (typeof rootElem.currentStyle !== 'undefined')
    overflowStyle = rootElem.currentStyle.overflow

    overflowStyle = overflowStyle || window.getComputedStyle(rootElem, '').overflow

    // Also need to check the Y axis overflow
    var overflowYStyle

    if (typeof rootElem.currentStyle !== 'undefined')
    overflowYStyle = rootElem.currentStyle.overflowY

    overflowYStyle = overflowYStyle || window.getComputedStyle(rootElem, '').overflowY

    var contentOverflows = rootElem.scrollHeight > rootElem.clientHeight
    var overflowShown    = /^(visible|auto)$/.test(overflowStyle) || /^(visible|auto)$/.test(overflowYStyle)
    var alwaysShowScroll = overflowStyle === 'scroll' || overflowYStyle === 'scroll'

    return usn.travel.hasScrollbar._cache.hasScrollbar = (contentOverflows && overflowShown) || (alwaysShowScroll);
};
usn.travel.getScrollbarWidth = function() {

    // store the return value on the function so we don't have to calculate everytime
    if (!!usn.travel.getScrollbarWidth._cache) {
        return usn.travel.getScrollbarWidth._cache.width;
    }
    usn.travel.getScrollbarWidth._cache = {};

    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return usn.travel.getScrollbarWidth._cache.width = (widthNoScroll - widthWithScroll);
};

/**
 * Output the desired SVG sprite markup (JavaScript version of existing Django template tag.
 *
 * @param {String} icon Hashmark fragment id of the sprite icon to be shown.
 * @param {String} classString Space delimited string of css class names (other than "icon") to be applied to the svg element.
 * @param {String} styleString Semi-colon delimited string of styles to be applied to the svg element.
 *
 */
usn.travel.tagSvgIcon = function(icon, classString, styleString) {
    classString = classString || "";
    styleString = styleString || "";

    if (!icon) { return ""; }

    var classList = classString.split(" ");
    classList.push("icon");

    var fileName = usn.travel.spriteSymbolVersion;
    return '<svg class="'+classList.join(" ")+'" style="'+styleString+'"><use xlink:href="'+usn.travel.staticCDN+'/sprites/svg/'+fileName+'#'+icon+'"></use></svg>';
};

usn.travel.scroll = {
    "scrollTo": function(e) {

        e.preventDefault();

        var el = e.target;
        var elementSelector = $(el).data("scrollToElement") || null;
        var offsetElementSelector = $(el).data("scrollToOffsetElement") || null;
        var speed = $(el).data("scrollToSpeed") || 500;

        if (!!elementSelector) {
            var scrollTop = !!offsetElementSelector ? $(elementSelector).offset().top - $(offsetElementSelector).outerHeight() : $(elementSelector).offset().top;
            $('html, body').animate({ "scrollTop": scrollTop }, speed);
        }

        return true;
    },
    "init": function() {
        $(".usn-scroll-to-trigger").on("click", this.scrollTo.bind(this));
    }
};

usn.travel.images = {
    "unveil": function(selector) {
        selector = selector || "img.jquery-unveil";
        $(selector).unveil(600, function() {
            $(this).addClass('shown');
            $(this).load(function() {
                $(this).lazyInterchange();
                this.style.opacity = 1;
            });
        });
    },
    "unveilBackground": function(selector) {
        selector = selector || ".jquery-unveil-bg";
        if (typeof $(selector).unveilBackground === "undefined") { return; }

        $(selector).unveilBackground(600, function() {
            $(this).addClass('shown');
            $(this).load(function() {
                $(this).lazyInterchange();
                this.style.opacity = 1;
            });
        });
    }
};

// BEGIN overlay section
/**
 * Initializes an Overlay.
 *
 * @constructor
 * @this {Overlay}
 * @param {object} $element Overlay element as a jQuery object.
 * @param {object} options
 * @param {string} options.hideTrigger The selector string for the element responsible for closing the overlay.
 * @param {string} options.showTrigger The selector string for the element responsible for opening the overlay.
 * @param {boolean} options.disableBackgroundScroll Apply CSS class "no-scroll" to page background to prevent background from scrolling, defaults to true.
 */
function Overlay($element, options) {
    this.$element = $element;

    // store default viewport info
    this.viewportContent = $('meta[name="viewport"]').attr("content");

    this.$background = $(".off-canvas-wrap"); // formerly "body" but position:fixed was causing issues
    this.scrollbarOffset = !!usn.travel.hasScrollbar() ? -(usn.travel.getScrollbarWidth()/2) : "auto"; // account for scrollbar disappearing when background is fixed
    this.scrollTop = null;
    this.disableBackgroundScroll = options.disableBackgroundScroll===false ? false : true; // default to true

    // assign event handlers
    if (options.showTrigger) {

        // apply handler via docuemnt in case triggers are loaded asynchronously
        $(document).on("click", options.showTrigger, this.onShowTriggerClick.bind(this));
        if (options.hideTrigger) { $(document).on("click", options.hideTrigger, this.onHideTriggerClick.bind(this)); }

        // listen to custom event for maps to get at click event
        usn.travel.events.on("map:popup:clicked", function(data) {
            var $element = $(data.event.target);
            if ($element.is($(options.showTrigger))) {
                this.onShowTriggerClick.call(this, data.event);
            }
        }.bind(this));
    }
}

/**
 * Shows/opens the overlay, overrides the viewport content value to prevent zooming.
 *
 * @this {Overlay}
 */
Overlay.prototype.show = function() {
    // prevent zoom on input focus
    $('meta[name="viewport"]').attr("content", "width=device-width, user-scalable=no");

    // store current scrolltop and apply top/left styles to prevent position:fixed background from "moving"
    if (this.disableBackgroundScroll) {
        this.scrollTop = $(window).scrollTop();
        this.$background
            .addClass("no-scroll")
            .css({ "top": -this.scrollTop, "left": this.scrollbarOffset });
    }

    _toggleFixedAdSlots("hide");

    this.$element.fadeIn(400, function() {
        usn.travel.events.trigger("overlay:shown", { "$element": this.$element });
    }.bind(this));
};

/**
 * Hides/closes the overlay, restores original viewport content value.
 *
 * @this {Overlay}
 */
Overlay.prototype.hide = function() {

    // restore default
    $('meta[name="viewport"]').attr("content", this.viewportContent);

    // restore original background styles
    if (this.disableBackgroundScroll) {
        this.$background
            .removeClass("no-scroll")
            .css({"top": "auto", "left": "auto"});
        $(window).scrollTop(this.scrollTop); // scroll back to initial part of page
    }

    this.$element.fadeOut(400, function() {
        _toggleFixedAdSlots("show");
        usn.travel.events.trigger("overlay:hidden", { "obj": this });
    }.bind(this));
};

/**
 * Handles the click event on overlay opener element.
 *
 * @this {Overlay}
 * @param  {object} Javascript event object.
 * @return {boolean}
 */
Overlay.prototype.onShowTriggerClick = function(event) {
    event.preventDefault();
    this.show.call(this);
    return false;
};

/**
 * Handles the click event on overlay closer element.
 *
 * @param  {object} Javascript event object.
 * @return {boolean}
 */
Overlay.prototype.onHideTriggerClick = function(event) {
    event.preventDefault();
    this.hide.call(this);
    return false;
};

/**
 * Default selector for all overlay elements.
 *
 * @type {String}
 */
var _DEFAULT_OVERLAY_SELECTOR = "*[data-js-id='usn-overlay']";

usn.travel.overlay = {
    "init": function($element, options) {
        options = options || {};
        return new Overlay($element, options);
    }
};

/**
 * Select all overlay elements on document.ready event, and initialize Overlay object for each using their data-* attributes.
 *
 * @param {string} data-show-trigger The selector string for the element responsible for closing the overlay.
 * @param {string} data-hide-trigger The selector string for the element responsible for opening the overlay.
 */
_INIT_FUNCTIONS.push(function() {
    var $element, options;

    $(_DEFAULT_OVERLAY_SELECTOR).each(function() {

        $element = $(this);
        options = {};

        if ($element.data("showTrigger")) { options.showTrigger = $element.data("showTrigger"); }
        if ($element.data("hideTrigger")) { options.hideTrigger = $element.data("hideTrigger"); }

        usn.travel.overlay.init($element, options);
    });
});
// END overlay section


// BEGIN popup section
/**
 * Initializes a Popup.
 *
 * @constructor
 * @this {Popup}
 * @param {object} $element Popup element as a jQuery object.
 * @param {object} options
 * @param {string} options.alignment Location where the popup will appear, relative to the opener element. Can be "top", "right", "bottom", "left"
 * @param {string} options.hideTrigger The selector string for the element responsible for closing the popup.
 * @param {number} options.horizontalOffset Number of pixels by which to offset the popup horizontally from the trigger element.
 * @param {string} options.showTrigger The selector string for the element responsible for opening the popup.
 * @param {string} options.tip Selector for the element to be used as the popup tip.
 * @param {number} options.verticalOffset Number of pixels by which to offset the popup vertically from the trigger element.
 */
function Popup($element, options) {

    this.$element = $element;
    this.width = this.$element.width();
    this.height = this.$element.height();

    // setup alignment
    this.alignment = options.alignment || "right";
    this.verticalOffset = options.verticalOffset || 0;
    this.horizontalOffset = options.horizontalOffset || 0;
    this.$hideTrigger = $(options.hideTrigger);
    this.$tip = $(options.tip);
    this.hideOnScroll = options.hideOnScroll===true;
    this.isShown = false;

    // assign event handlers
    if (options.showTrigger) {

        // apply handler via docuemnt in case triggers are loaded asynchronously
        $(document).on("click", options.showTrigger, this.onShowTriggerClick.bind(this));

        // listen to custom event for maps to get at click event
        usn.travel.events.on("map:popup:clicked", function(data) {
            var $element = $(data.event.target);
            if ($element.is($(options.showTrigger))) {
                this.onShowTriggerClick.call(this, data.event);
            }
        }.bind(this));
    }
    if (this.$hideTrigger) { this.$hideTrigger.on("click", this.onHideTriggerClick.bind(this)); }

    $(window).on("scroll", this.onWindowScroll.bind(this));
}

/**
 * Position the element absolutely based on options passed in, size of popup and trigger elements.
 * @param  {object} event JavaScript event object that triggered the alignment.
 */
Popup.prototype.align = function(event) {

    var triggerWidth = $(event.target).width();
    var triggerHeight = $(event.target).height();
    var triggerTop = $(event.target).offset().top;
    var triggerLeft = $(event.target).offset().left;
    var popupWidth = this.$element.width();
    var popupHeight = this.$element.height();

    // TODO alignment for top

    if (this.alignment === "right") {
        //account for offsets in case the popup has a positioned ancestor element other than the document body.
        var parentTopOffset = this.$element.offsetParent().offset().top
        var parentLeftOffset = this.$element.offsetParent().offset().left

        var top = $(event.target).offset().top - (this.$element.height() / 2) + this.verticalOffset - parentTopOffset; // button's top offset minus half popup's height
        var left = ($(event.target).offset().left + $(event.target).width()) + this.horizontalOffset - parentLeftOffset; // to appear on right, button's left offset plus it's width plus 10px offset
        this.$element.css({ "top": top, "left": left });

        if (this.$tip) {
            var tipTop = (this.$element.height() / 2);
            var tipLeft = - (this.$tip.width()/2);
            this.$tip.css({ "top": tipTop, "left": tipLeft });
        }
    }

    if (this.alignment === "bottom") {
        var top = triggerTop + triggerHeight + this.verticalOffset;
        var left = ((triggerLeft + triggerWidth/2) - (popupWidth/2)) +  this.horizontalOffset;

        this.$element.css({ "top": top, "left": left });

        if (this.$tip) {
            var tipTop = - (this.$tip.width()/2);
            var tipLeft = (this.$element.width()/2);
            this.$tip.css({"top": tipTop, "left": tipLeft });
        }
    }

    if (this.alignment === "left") {
        var top = ($(event.target).offset().top + ($(event.target).height()/2)) - (this.$element.height() / 2) + this.verticalOffset; // button's top offset, plus half it's height, minus half popup's height
        var left = ($(event.target).offset().left - this.$element.width()) - this.horizontalOffset;
        this.$element.css({ "top": top, "left": left });


        if (this.$tip) {
            var tipTop = (this.$element.height() / 2);
            var tipLeft = this.$element.width()  - (this.$tip.width()/2);
            this.$tip.css({ "top": tipTop, "left": tipLeft });
        }
    }
};

/**
 * Show the popup element, and trigger "popup:shown" event.
 *
 * @this {Popup}
 */
Popup.prototype.show = function() {
    this.isShown = true;
    this.$element.fadeIn(400, function() {
        usn.travel.events.trigger("popup:shown", { "$element": this.$element });
    }.bind(this));
};

/**
 * Hide the popup element, and trigger the "popup:hidden" event.
 *
 * @this {Popup}
 */
Popup.prototype.hide = function() {
    this.isShown = false;
    this.$element.fadeOut(400, function() {
        usn.travel.events.trigger("popup:hidden", { "obj": this });
    }.bind(this));
};

/**
 * Handles the click event on popup opener element, reads data-* attributes of opener element, and calls align and show.
 *
 * @this {Popup}
 * @param  {object} Javascript event object.
 * @return {boolean}
 */
Popup.prototype.onShowTriggerClick = function(event) {
    event.preventDefault();
    var $element = $(event.target);

    this.alignment = (typeof $element.data("alignment")==="undefined") ? this.alignment : $element.data("alignment");
    this.horizontalOffset = (typeof $element.data("horizontalOffset")==="undefined") ? this.horizontalOffset : $element.data("horizontalOffset");
    this.verticalOffset = (typeof $element.data("verticalOffset")==="undefined") ? this.verticalOffset : $element.data("verticalOffset");
    this.hideOnScroll = (typeof $element.data("popupHideOnScroll")==="undefined") ? this.hideOnScroll : $element.data("popupHideOnScroll");
    if (typeof $element.data("tipColor") !=="undefined") { this.$tip.css({"background-color": $element.data("tipColor") }); }

    this.align.call(this, event);
    this.show.call(this);
    return false;
};

/**
 * Handles the click event on popup closer element.
 *
 * @this {Popup}
 * @param  {object} Javascript event object.
 * @return {boolean}
 */
Popup.prototype.onHideTriggerClick = function(event) {
    event.preventDefault();
    this.hide.call(this);
    return false;
};

/**
 * Listens to window.scroll event, and hides popup element if the hideOnScroll option is true and the element is shown.
 *
 * @this {Popup}
 * @param  {object} event Javascript event object.
 */
Popup.prototype.onWindowScroll = function(event) {
    if (this.hideOnScroll && this.isShown) {
        this.hide.call(this);
    }
};

/**
 * Default selector for all popup elements.
 *
 * @type {String}
 */
var _DEFAULT_POPUP_SELECTOR = ".usn-popup";

/**
 * Select all popup elements on document.ready event, and initialize Popup object for each using their data-* attributes.
 *
 * @param {string} data-show-trigger The selector string for the element responsible for closing the overlay.
 * @param {string} data-hide-trigger The selector string for the element responsible for opening the overlay.
 * @param {string} data-tip Selector for the element to be used as the popup tip.
 * @param {string} data-alignment Location where the popup will appear, relative to the opener element. Can be "top", "right", "bottom", "left"
 * @param {number} data-horizontal-offset Number of pixels by which to offset the popup horizontally from the trigger element.
 * @param {number} data-vertical-offset Number of pixels by which to offset the popup vertically from the trigger element.
 * @param {boolean} data-popup-hide-on-scroll Whether or not to hide the popup element on window.scoll event. Default is false.
 */
_INIT_FUNCTIONS.push(function() {
    var $element, options;
    $(_DEFAULT_POPUP_SELECTOR).each(function() {

        $element = $(this);
        options = {};

        if ($element.data("showTrigger")) { options.showTrigger = $element.data("showTrigger"); }
        if ($element.data("hideTrigger")) { options.hideTrigger = $element.data("hideTrigger"); }
        if ($element.data("tip")) { options.tip = $element.data("tip"); }
        if ($element.data("alignment")) { options.alignment = $element.data("alignment"); }
        if ($element.data("horizontalOffset")) { options.horizontalOffset = $element.data("horizontalOffset"); }
        if ($element.data("verticalOffset")) { options.verticalOffset = $element.data("verticalOffset"); }
        if ($element.data("popupHideOnScroll")) { options.hideOnScroll = $element.data("popupHideOnScroll"); }

        new Popup($element, options);
    });
});
// END popup section

// BEGIN modal section
/**
 * Javascript object for modal window overlay standardization.
 * @param {[type]} modalSelector [description]
 * @param {data-attribute} modalOptions Variable settings for the modal window, options include:
 *                                      disableBackgroundScroll - Boolean, whether to disable background scroll via application of "no-scroll" css class name to body tag. Default is true.
 */
function Modal(modalSelector) {
    this.$window = $(modalSelector);
    this.$background = $(".off-canvas-wrap"); // formerly "body" but position:fixed was causing issues
    this.scrollbarOffset = !!usn.travel.hasScrollbar() ? -(usn.travel.getScrollbarWidth()/2) : "auto"; // account for scrollbar disappearing when background is fixed

    if (!this.$window.attr("id")) { this.$window.attr("id", "usn-modal-" + parseInt(Math.random() * 10000000000000000)); }

    var options = this.$window.data("modalOptions") || {};
    this.scrollTop = null;
    this.disableBackgroundScroll = options.disableBackgroundScroll===false ? false : true; // default to true

    this.$openTrigger = $('<a rel="leanModal" href="#'+this.$window.attr("id")+'" style="display: none;"></a>');
    this.$openTrigger.leanModal(options);
    this.$window.before( this.$openTrigger );

    $(document).on("click", "#lean_overlay", function() {
        this.close.call(this);
    }.bind(this));
}

Modal.prototype.open = function() {
    // store current scrolltop and apply top/left styles to prevent position:fixed background from "moving"
    if (this.disableBackgroundScroll) {
        this.scrollTop = $(window).scrollTop();
        this.$background
            .addClass("no-scroll")
            .css({ "top": -this.scrollTop, "left": this.scrollbarOffset });
    }
    _toggleFixedAdSlots("hide");
    this.$openTrigger.click();
    usn.travel.events.trigger("ui:modal:open", {"modal": this});
};

Modal.prototype.close = function() {
    // restore original background styles
    if (this.disableBackgroundScroll) {
        this.$background
            .removeClass("no-scroll")
            .css({"top": "auto", "left": "auto"});
        $(window).scrollTop(this.scrollTop); // scroll back to initial part of page
    }
    $('#lean_overlay').fadeOut(400, function() {
        $(this).remove();
    });
    this.$window.fadeOut();
    _toggleFixedAdSlots("show");
    usn.travel.events.trigger("ui:modal:close", {"modal": this});
};

usn.travel.modal = {
    "init": function(modalSelector) {
        return new Modal(modalSelector);
    }
};
// END modal section


/* legacy namespaces */
window.getRandomString = usn.travel.getRandomString;
window.getCVal = usn.travel.getCVal;

/* on document ready */
_INIT_FUNCTIONS.push(function() {
    usn.travel.placeholderFix();

    // scroll elements
    usn.travel.scroll.init();

    // lazy load images
    usn.travel.images.unveil();
    usn.travel.images.unveilBackground();

});

if (!document.getElementById('usn-js-main')) {
    usn.travel.events.on("mainScript:loaded", _ON_INIT);
} else {
    _ON_INIT();
}
