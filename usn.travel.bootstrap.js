(function(window, USN) {

    "use strict";

    // IE polyfill for CustomEvent constructor - https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent
    (function () {
      function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
       }

      CustomEvent.prototype = window.Event.prototype;

      window.CustomEvent = CustomEvent;
    })();

    // Custom Event "optimizedResize"
    (function() {
        var throttle = function(type, name, obj) {
            obj = obj || window;
            var running = false;
            var func = function() {
                if (running) { return; }
                running = true;
                 requestAnimationFrame(function() {
                    obj.dispatchEvent(new CustomEvent(name));
                    running = false;
                });
            };
            obj.addEventListener(type, func);
        };

        throttle("resize", "optimizedResize");
    })();

    // Custom Event "optimizedScroll"
    (function(window, CustomEvent) {
        var last_known_scroll_position = 0;
        var ticking = false;

        window.addEventListener('scroll', function(e) {
            last_known_scroll_position = window.scrollY;
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    window.dispatchEvent(new CustomEvent("optimizedScroll"));
                    ticking = false;
                });
            }
            ticking = true;
        });
    }(window, CustomEvent));

    window.usn = window.usn || {};
    usn.travel = usn.travel || {};

    usn.travel.setCookies = function (name, value, days) {
        var expires;
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        else {
            expires = "";
        }
        document.cookie = name + "=" + String(value) + expires + "; path=/";
    };

    usn.travel.CSSLoader = function(url) {
        var elHead = document.head,
                elStylesheet = document.createElement('link');
        elStylesheet.media = "all";
        elStylesheet.href = url;
        elStylesheet.rel = "stylesheet";
        return {
            init: (function () {
                document.addEventListener('DOMContentLoaded', function () {
                    elHead.appendChild(elStylesheet);
                });
                return this;
            }())
        }
    };

    usn.travel.debug = false;
    usn.travel.log = function() {
        if (!!this.debug) {
            try { console.log("LOG:", Array.prototype.slice.apply(arguments)); } catch (e) {}
        }
    };
    usn.travel.alert = function() {
        if (!!this.debug) {
            alert(arguments[0]);
        }
    };
    usn.travel.getParameterByName = function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    /* begin event wrappers */
    usn.travel.events = {
        "trigger": function(eventName, data) {
            data = data || {};
            var event = new CustomEvent(eventName, {"detail": data });
            window.dispatchEvent(event);

        },
        "on": function(eventName, callback, once) {
            once = once===true;

            var _callback = function(event) {
                if (once) { window.removeEventListener(eventName, _callback, false); }
                return callback(event.detail);
            };

            window.addEventListener(eventName, _callback, false);
        },
        "once": function(eventName, callback) {
            var once = true;
            this.on(eventName, callback, once);
        }
    };
    /* end event wrappers */

    usn.travel.pi = {
        "boundEventListener": null,
        "getCurrentBreakPoint": function() {

            var width = window.innerWidth;

            if (width <= 640) {
                return "small";
            } else if (width > 640 && width < 1024) {
                return "medium";
            } else {
                return "large";
            }
        },
        "inView": function(el) {
            var wT = window.pageYOffset, wB = wT + window.innerHeight, cRect, pT, pB;
            cRect = el.getBoundingClientRect();
            pT = wT + cRect.top;
            pB = pT + cRect.height;
            return (wT < pB && wB > pT);
        },
        "load": function(image, breakpoint) {
            var visibilityClass = breakpoint==="large" ? "show-for-large-up" : "show-for-"+breakpoint+"-only";
            var src = image.dataset[breakpoint+"Src"];

            if (src) {
                image.dataset.state = "loading";
                var imgLarge = new Image();
                imgLarge.src = src;
                imgLarge.alt = image.querySelector("img.placeholder").alt || "";
                imgLarge.onload = function() {
                    imgLarge.classList.add("loaded");
                    imgLarge.classList.add(visibilityClass);
                    image.classList.add(breakpoint+"-loaded");
                    image.dataset.state = "loaded";
                };
                image.appendChild(imgLarge);
            }
        },
        "evaluateImage": function(image, breakpoint) {
            breakpoint = breakpoint || usn.travel.pi.getCurrentBreakPoint();
            if (image.dataset.state != "loading" && usn.travel.pi.inView(image)) {
                usn.travel.pi.load(image, breakpoint);
            }
        },
        "evaluateImages": function(containerSelector) {
            containerSelector = containerSelector || "";
            var breakpoint = this.getCurrentBreakPoint(),
                images = document.querySelectorAll(containerSelector + " .progressive-image:not(."+breakpoint+"-loaded)"), // only evaluate non-loaded images
                image;

            // remove event listeners if no more images to load
            if (images.length===0) {
                this.removeEventListeners.call(this);
                return false;
            }

            for (var i=0, len=images.length; i<len; i++) {
                image = images[i];
                this.evaluateImage(image, breakpoint);
            }
        },
        "onPlaceholderLoaded": function(placeholder) {
            placeholder.classList.add('loaded');
            var image = placeholder.parentElement;
            this.evaluateImage(image);
        },
        "removeEventListeners": function() {
            document.removeEventListener("DOMContentLoaded", this.boundEventListener);
            window.removeEventListener("optimizedScroll", this.boundEventListener, {"passive": true});
            window.removeEventListener("optimizedResize", this.boundEventListener);
            window.removeEventListener("orientationchange", this.boundEventListener);
            this.boundEventListener = null;
        },
        "addEventListeners": function() {
            var containerSelector = null;

            // bind here so we can remove it later
            this.boundEventListener = this.evaluateImages.bind(this, containerSelector);

            document.addEventListener("DOMContentLoaded", this.boundEventListener);
            window.addEventListener("optimizedScroll", this.boundEventListener, {"passive": true});
            window.addEventListener("optimizedResize", this.boundEventListener);
            window.addEventListener("orientationchange", this.boundEventListener);
        },
        "init": function() {

            this.addEventListeners.call(this);

            // for asynchronously loaded content
            usn.travel.events.on("ui:images:visible", function(data) {
                this.evaluateImages.call(this, data.containerSelector);
                // re-add the event listeners if they've previously been removed
                if (!this.boundEventListener) { this.addEventListeners.call(this); }
            }.bind(this));
        }
    };

    usn.travel.pi.init();

    function _runQueue() {
        for (var i=0, len=usn.travel.ready._cache.queue.length; i < len; i++) {
            usn.travel.ready._cache.queue[i]();
        }

        usn.travel.ready._cache.queue = []; // reset the queue
    }


    /**
     * Wrapper function for inline JavaScript that depends on other ITS/Travel JavaScript libraries.
     * @param  {Function} fn Function to be run once all libraries have been loaded.
     */
    usn.travel.ready = function(fn) {

        fn = fn || function() {};

        usn.travel.ready._cache = usn.travel.ready._cache || { "travelReadyFired": false, "queue": [], "staticReadyFired": false };

        usn.travel.ready._cache.queue.push(fn);

        if (usn.travel.ready._cache.travelReadyFired && usn.travel.ready._cache.staticReadyFired) {
            _runQueue();
        }
    };

    USN.ready().then(function(){
        usn.travel.ready._cache.staticReadyFired = true;
        usn.travel.ready();
    });

    usn.travel.events.once("usn:travel:js:ready", function() {
        usn.travel.ready._cache.travelReadyFired = true;
        usn.travel.ready();
    });

    // Optimizely AB Testing Events
    window.optimizelyFireGoalEvent = function(eventName) {
        window['optimizely'] = window['optimizely'] || [];
        var event = {
            'type': 'event',
            'eventName': eventName,
        };
        window['optimizely'].push(event);
    };

}(window, USN));
