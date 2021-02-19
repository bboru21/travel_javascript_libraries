(function() {

    "use strict";

    var _INIT_FUNCTIONS = [];
    var _ON_INIT = function() {
        for (var i = 0, len = _INIT_FUNCTIONS.length; i < len; i++) {
            _INIT_FUNCTIONS[i].call();
        }
    };

    var _AD_MANAGER = null; // AdManager instance
    var _DISPATCHER = null; // Event Dispatcher instance
    _INIT_FUNCTIONS.push(function() {
        _AD_MANAGER = window.usn.ads.adManager.instance;
        _DISPATCHER = USN.EventDispatcher.instance.dispatcher;
    });

    // init all search sources
    _INIT_FUNCTIONS.push(function() {

        $("[data-js-search='destinations_hotels'], [data-js-search='destinations'], [data-js-search='hotels']").each(function() {
            var $input = $(this);
            var source = $input.data("jsSearch");
            var params = $input.data("jsSearchOptions") || {};
            params.submitOnSelect = params.submitOnSelect===false ? false : true;

            $input.autocomplete({
                source: source,
                templates: {
                    suggestion: function(data) {
                        return '<div>' + data.icon + data.label + '</div>';
                    }
                },
                action: function(element, data, event) {

                    usn.travel.events.trigger("search:resultSelected", { "element": element, "value": data.value });

                    // set action of parent form in case user clicks submit button while form is submitting
                    $(element).closest("form").attr("action", data.value);

                    if (params.submitOnSelect) { window.location.href = data.value; }
                },
                queryParams: params
            });
        });

    });

    window.usn = window.usn || {};
    usn.travel = usn.travel || {};

    // BEGIN search filters for ranking list pages

    var _DEFAULT_SEARCH_FILTER_SELECTOR = "*[data-js-id='usn-travel-search-filters']";

    function SearchFilters(options) {
        this.$form = typeof options.containerSelector === "undefined" ? $(_DEFAULT_SEARCH_FILTER_SELECTOR).find("form") : $(options.containerSelector).find("form");
        this.$checkboxes = this.$form.find("input[type='checkbox']");
        // this.$rangeSliders = this.$form.find(".range-slider");
        this.$contentRegion = $(".search-results-view div[data-js-id='items']");
        this.loadMoreButtonSelector = "*[data-js-id='load-more-button']";
        this.$filterButtonsContainer = $(".search-filter-buttons-container .search-filter-buttons-content");
        this.filterButtonCount = 0;

        this.clearInProgress = false;
        this.page = 1;
        this.pagesTotal = 1;
        this.itemsShowing = 0;
        this.itemsTotal = 0;
        this.cachedSearchParams = [{}];
        this.searchUrl = "";
        this.$heading = $("h1");
        this.defaultHeadingText = null;

        // initialize slider and bind events
        this.$rangeSliders = this.$form.find('.range-slider');
        this.setupRangeSliders.call(this);

        // bind event handlers
        this.$form.find(".search-filter-group-toggle").on("click", this.onToggleClick.bind(this));
        $("*[data-js-id='clear-all']").on("click", this.onClearAllClick.bind(this));
        this.$form.find("input[type='checkbox']").on("change", this.onCheckboxChange.bind(this));
        $(".search-application-main-column").on("click", this.loadMoreButtonSelector, this.onLoadMoreClick.bind(this));

        $(".search-filter-buttons-container .search-filter-buttons-content").on("click", ".button.search-filter", this.onFilterButtonClick.bind(this));
        this.setDefaultFilterButtons.call(this);
    };

    SearchFilters.prototype.setupRangeSliders = function() {

        var context = this, $slider;

        this.$rangeSliders.each(function() {
            $slider = $(this);

            // ensure it has an id, as we'll need that for onRangeSliderChange cache
            if (!$slider.attr("id")) {
                $slider.attr("id", "usn-range-slider-" + parseInt(Math.random() * 10000000000000000));
            }
            $slider.rangeSlider();
            $slider.on("change.rangeSlider", context.onRangeSliderChange.bind(context));
        });
    };

    SearchFilters.prototype.onToggleClick = function(event) {
        event.preventDefault();
        $(event.target).closest(".search-filter-group").toggleClass("is-collapsed");
        return false;
    }

    SearchFilters.prototype.setPaginationData = function() {/*...*/};

    SearchFilters.prototype.onSearchSuccess = function(html) {

        var $results = $(html).find(".search-results-view div[data-js-id='items']").contents();

        // clear content region and set default heading if not loading more
        if (this.page === 1) {
            this.$contentRegion.html("");
            if (!!this.defaultHeadingText) { this.$heading.text(this.defaultHeadingText); }
        }
        var contentPageId  = "content-region-page-" + this.page;

        this.$contentRegion.append('<span id="'+contentPageId+'"></span>');
        this.$contentRegion.find("#"+contentPageId).append( $results );

        var $adSlots = $("#"+contentPageId + " .ad.ad-rectangle"); // init all 300x250 ads in returned content
        _AD_MANAGER && _AD_MANAGER.init($adSlots);
        usn.travel.images.unveil("#"+contentPageId + " img.jquery-unveil"); // init lazy load images
        usn.travel.events.trigger("ui:images:visible", { "containerSelector": "#"+contentPageId }); // init progressive images
        usn.travel.hideLoader();
    }

    SearchFilters.prototype.onSearchError = function(data) {
        usn.travel.debug("search error", data);
        usn.travel.hideLoader();
    }

    SearchFilters.prototype.doSearch = function(infiniteScroll) {

        var params = this.$form.serializeArray();
        params.push({ "name": "page", "value": this.page });
        params.push({ "name": "xhr", "value": "1" });

        // if loading more, tell the view to load infinite scroll rectangle units and pass it the number of current units
        if (infiniteScroll===true) {
            params.push({ "name": "infinite_scroll", "value": 1 });
            params.push({"name": "ad_is_rectangle_count", "value": $("[data-ad-type='rect_IS-']").length });
        }

        usn.travel.showLoader();

        $.ajax({
            "method": "GET",
            "url": this.searchUrl,
            "data": params,
            "success": this.onSearchSuccess.bind(this),
            "error": this.onSearchError.bind(this),
            "dataType": "html"
        });
    };

    SearchFilters.prototype.getRangeSliderDefaultValues = function($element) {
        var min = $element.data("defaultMinValue") || null;
        var max = $element.data("defaultMaxValue") || null;
        return [min, max];
    };

    SearchFilters.prototype.resetRangeSlider = function(element) {
        var values = element.rangeSlider.get();
        var defaultValues = this.getRangeSliderDefaultValues.call(this, $(element));

        // only actually reset if values are different from default ones
        if (values[0] != defaultValues[0] || values[1] != defaultValues[1]) {
            element.rangeSlider.set(defaultValues);
        }
    };

    SearchFilters.prototype.onClearAllClick = function(event) {
        event.preventDefault();

        this.clearInProgress = true;
        this.page = 1;
        this.itemsShowing = 0;

        var context = this;

        // reset all checkboxes
        this.$checkboxes.each(function() {
            $(this).prop("checked", false);
            $(this).removeData("$filterButton");
        });

        // reset range sliders to default values
        this.$rangeSliders.each(function() {
            context.resetRangeSlider.call(context, this);
            $(this).removeData("$filterButton");
        });

        // remove all filter buttons
        this.$filterButtonsContainer.find(".button.search-filter").remove();
        this.filterButtonCount = 0;
        this.$filterButtonsContainer.fadeOut();

        this.doSearch.call(this);
        this.clearInProgress = false;

        return false;
    };

    SearchFilters.prototype.onCheckboxChange = function(event) {
        this.page = 1;
        this.itemsShowing = 0;
        this.doSearch.call(this);

        var $checkbox = $(event.target);
        if ($checkbox.is(":checked")) {
            this.addFilterButton.call(this, $checkbox);
        } else {
            this.removeFilterButton.call(this, $checkbox);
        }
    };

    SearchFilters.prototype.onRangeSliderChange = function(event, values) {
        event.preventDefault();

        this.onRangeSliderChange._cache = this.onRangeSliderChange._cache || {};

        // don't reload if form is being cleared
        // ensure values is an array - handler fires twice, first with values as an object
        if (!this.clearInProgress && $.isArray(values)) {

            var $rangeSlider = $(event.target),
            rangeSliderId = $rangeSlider.attr("id");

            // compare current with previous values to prevent unecessary searches
            if (!this.onRangeSliderChange._cache[rangeSliderId]) {
                this.onRangeSliderChange._cache[rangeSliderId] = [];
            } else if (usn.travel.arraysEqual( this.onRangeSliderChange._cache[rangeSliderId], values )) {
                return false;
            }
            this.onRangeSliderChange._cache[rangeSliderId] = values;

            var min = parseFloat(values[0]), max = parseFloat(values[1]);

            this.page = 1;
            this.itemsShowing = 0;

            $rangeSlider.find('input[data-js-id="min"]').val(min);
            $rangeSlider.find('input[data-js-id="max"]').val(max);

            this.doSearch.call(this);

            // add filter button if value actually changed
            var defaultValues = this.getRangeSliderDefaultValues.call(this, $rangeSlider);
            if (defaultValues[0] != min || defaultValues[1] != max) {
                this.addFilterButton.call(this, $rangeSlider);
            } else {
                this.removeFilterButton.call(this, $rangeSlider);
            }
        }

        return false;
    };

    SearchFilters.prototype.onLoadMoreClick = function(event) {
        event.preventDefault();

        // increment page value
        this.page++;

        if (this.page <= this.pagesTotal) {
            var infiniteScroll = true;
            this.doSearch.call(this, infiniteScroll);
        }

        // trigger event for analytics, etc.
        // usn.travel.events.trigger('usn.travel.hotels.event.loadMoreClick', {});

        return false;
    };

    SearchFilters.prototype.onResultsLoaded = function() {/*...*/};

    SearchFilters.prototype.getFilterButtonText = function($formElement) {
        var $label, text;
        $label = $formElement.closest(".search-filter-container").find("*[data-js-id='label']");
        if ($label.length == 0) {
            $label = $formElement.closest(".search-filter-container").find("label");
        }
        text = $label.text();
        return text;
    };
    SearchFilters.prototype.addFilterButton = function($formElement) {

        var text = this.getFilterButtonText.call(this, $formElement);

        if ($formElement.data("$filterButton")) {
            $formElement.data("$filterButton").find("span").text(text);
        } else {
            var $button = $('   <button class="button search-filter block-tight bar-tight tiny">\
                                    <span class="bar-tightest">'+text+'</span>'+usn.travel.tagSvgIcon("x-con", "small white")+'\
                                </button>');
            $button.data("$formElement", $formElement);
            $formElement.data("$filterButton", $button);
            this.$filterButtonsContainer.prepend($button);
            this.filterButtonCount++;
        }
        if (this.filterButtonCount === 1) { this.$filterButtonsContainer.fadeIn(); }
    };

    SearchFilters.prototype.removeFilterButton = function($formElement) {
        var $filterButton = $formElement.data("$filterButton");
        $filterButton.remove();
        $formElement.removeData("$filterButton");

        this.filterButtonCount--;
        if (this.filterButtonCount === 0) { this.$filterButtonsContainer.fadeOut(); }
    };

    SearchFilters.prototype.onFilterButtonClick = function(event) {
        event.preventDefault();
        var $filterButton = $(event.target).closest(".button.search-filter");
        var $formElement = $filterButton.data("$formElement");

        if ($formElement.attr("type") === "checkbox") {
            // checkbox
            $formElement.prop("checked", false).change();
        } else if ($formElement.hasClass("range-slider")) {
            // range slider
            this.resetRangeSlider.call(this, $formElement[0]);
        }
        return false;
    };

    SearchFilters.prototype.setDefaultFilterButtons = function() {

        var context = this, $element;

        // add buttons for checked checkboxes
        this.$checkboxes.each(function() {
            $element = $(this);
            if (!!$element.prop("checked")) {
                context.addFilterButton.call(context, $element);
            }
        });

        // add buttons for range slider
        var values, defaultValues;
        this.$rangeSliders.each(function() {
            $element = $(this);

            values = $element[0].rangeSlider.get();
            defaultValues = context.getRangeSliderDefaultValues.call(context, $element);

            if (values[0] != defaultValues[0] || values[1] != defaultValues[1]) {
                context.addFilterButton.call(context, $element);
            }
        });
    };

    function HotelSearchFilters() {/*...*/}

    function CruiseShipSearchFilters(options) {
        options = options || {};
        SearchFilters.call(this, options);

        this.searchUrl = options.searchUrl || "/cruises/best-cruise-ships/";
        this.defaultHeadingText = options.defaultHeadingText || "Best Cruise Ships for You";

        // event handlers
        USN.EventDispatcher.instance.dispatcher.on('cruise:ship:results:loaded', this.setPaginationData.bind(this));
    }
    CruiseShipSearchFilters.prototype = Object.create(SearchFilters.prototype);
    CruiseShipSearchFilters.prototype.constructor = CruiseShipSearchFilters;

    CruiseShipSearchFilters.prototype.setPaginationData = function(data) {

        this.itemsShowing = this.itemsShowing + data.itemsShowing;
        this.itemsTotal = data.itemsTotal;
        this.pagesTotal = data.pagesTotal;

        if (this.itemsTotal > 0) {
            $('.search-count-view > span').html('Showing <strong>'+this.itemsShowing+'</strong> of <strong>'+this.itemsTotal+'</strong> ships');
        } else {
            $('.search-count-view > span').html('Sorry, no results match your search criteria.');
        }
        $('*[data-js-id="total-items"]').html(this.itemsTotal);

        if (this.itemsShowing === this.itemsTotal || this.itemsTotal === 0) {
            $(this.loadMoreButtonSelector).css({"display": "none"});
        } else {
            $(this.loadMoreButtonSelector).css({"display": "inherit"});
        }
    };

    window.usn = window.usn || {};
    usn.travel = usn.travel || {};
    usn.travel.searchFilters = {
        "init": function(filterType, options) {
            options = options || {};
            if (filterType === "cruise-ships") {
                new CruiseShipSearchFilters(options);
            }
        }
    };

    // main.js ready
    _INIT_FUNCTIONS.push(function() {
        var $element, filterType, options;
        $(_DEFAULT_SEARCH_FILTER_SELECTOR).each(function() {
            options = {};

            $element = $(this);
            if (typeof $element.data("searchFilterType") !== "undefined") { filterType = $element.data("searchFilterType"); }

            usn.travel.searchFilters.init(filterType, options);
        });
    });
    // END search filters for ranking list pages

    if (!document.getElementById('usn-js-main')) {
        usn.travel.events.on("mainScript:loaded", _ON_INIT);
    } else {
        _ON_INIT();
    }

}());
