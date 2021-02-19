/*
	Namespace: usn.travel.maps
	Description: Library for universally interfacing with various map modules
	Dependancies:
 		* jQuery
 		* gmaps.js
 		* usn.travel.base.js
 */

(function($) {

	"use strict";

	/* expose the global namespace */
	window.usn = window.usn || {};
	usn.travel = usn.travel || {};
	usn.travel.maps = {};

	/* current version of jQuery can't add/remove classes on path elements, so use helper functions here */
	function _addClass(element, name) {
		var c = element.getAttribute("class") || "";
		var newClassNames = c.split(" ");
		newClassNames.push(name);
		element.setAttribute("class", newClassNames.join(" "));
	}

	function _removeClass(element, name) {
		var c = element.getAttribute("class") || "";
		var newClassNames = [];

		var arr = c.split(" ");
		for (var i = 0, len = arr.length; i < len; i++) {
			if (arr[i] !== name) {
				newClassNames.push(arr[i]);
			}
		}
		element.setAttribute("class", newClassNames.join(" "));
	}

	function _hasClass(element, name) {
		var c = element.getAttribute("class") || "";
		var arr = c.split(" ");
		return (arr.indexOf(name) > -1);
	}

	function Map(targetSelector, options) {
		this.$target = $(targetSelector);

		this.svgWidth = 620;
		this.svgHeight = 300;

		this.width = this.$target.width();
		this.height = this.$target.height();
		this.fill = "#CCCCCC";
		this.hoverFill = "#888888";
		this.backgroundFill = "#FFFFFF";
	};

	function RaphaelWorldMap(targetSelector, options) {
		Map.call(this, targetSelector, options);

		this.id = this.$target.attr("id") || "raphael-world-map-" + new Date().getTime();
		this.width = options.width || this.width;
		this.height = options.height || this.height;
		this.fill = options.fill || this.fill;
		this.hoverFill = options.hoverFill || this.hoverFill;
		this.backgroundFill = options.backgroundFill || this.backgroundFill;

		// initialize only if visible
		// if (this.$target.css("display") !== "none") {
			this.paper = this.initialize.call(this);
			this.bindEvents.call(this);
		// }
	};
	RaphaelWorldMap.prototype = Object.create(Map.prototype);
	RaphaelWorldMap.prototype.constructor = RaphaelWorldMap;

	RaphaelWorldMap.prototype.initialize = function() {

		var paper = Raphael(this.id, this.width+"", this.height+"");
		var g_sets = [];
		paper.setStart();

		var obj;
		var s1 = paper.set();
		var region;

		var regions = usn.travel.maps.svgRegions.regions || [];

		for (var i=0, len = regions.length; i < len; i++) {
			region = regions[i];

			obj = paper.path(region.path);
			obj.attr({"fill": this.fill, "stroke": "none"});
			//$(obj.node).data("regionId", regionName); // TODO figure out best way to store this
			obj.id = region.id;
			obj.url = region.url;
			obj.defaultRankingListURL = region.defaultRankingListURL;
			if (!region.interactive) { obj.show_flag = false; }
			s1.push(obj);
		}
		var st = paper.setFinish();

		// transform the paper
		var x = this.width / this.svgWidth;
		var y = this.height / this.svgHeight;
		paper.forEach(function(obj) {
			obj.transform("s"+x+","+y+",0,0");
		});

		// add background with border
		var c22 = paper.rect(0, 0, this.width, this.height);
		c22.toBack();
		c22.attr({'fill':this.backgroundFill,'stroke':'1','stroke-width':'1','stroke-opacity':0.2});
		c22.show_flag = false;

		return paper;
	};

	RaphaelWorldMap.prototype.bindEvents = function() {
		this.paper.forEach(function (obj) {
			if (undefined == obj.show_flag && !obj.show_flag) {
				obj.hover( this.onRegionHoverIn.bind(this, obj), this.onRegionHoverOut.bind(this, obj));
				obj.click(this.onRegionClick.bind(this, obj));
			}
		}.bind(this));
	};

	RaphaelWorldMap.prototype.onRegionHoverIn = function(obj) {
		// deselect other elements
		this.$target.find("path.selected-region").each(function(i, path) {
			_removeClass(path, "selected-region");
			this.lowlightRegion.call(this, $(path));
		}.bind(this));

		this.highlightRegion.call(this, obj);
	};
	RaphaelWorldMap.prototype.onRegionHoverOut = function(obj) {
		this.lowlightRegion.call(this, $(obj.node));
	};


	RaphaelWorldMap.prototype.onRegionClick = function(obj, e) {
		this.selectRegion.call(this, obj.url, obj);
		usn.travel.events.trigger("map:region:click", {"url": obj.url, "id": obj.id, "defaultRankingListURL": obj.defaultRankingListURL });
	};

	RaphaelWorldMap.prototype.highlightRegion = function(obj) {
		obj.attr({cursor:'pointer'});
		var $path = $(obj.node);
		$path.css({ "fill": this.hoverFill, "transition": "0.2s" })
		_addClass($path[0], "highlighted");
	};

	RaphaelWorldMap.prototype.lowlightRegion = function($path) {
		if (!_hasClass($path[0],"selected-region")) {
			$path.css({ "fill": this.fill, "transition": "0.2s" });
			_removeClass($path[0], "highlighted");
		}
	};

	RaphaelWorldMap.prototype.selectRegion = function(url, obj) {

		if (url === "Worldwide") {
			this.selectAllRegions.call(this);
			return false;
		}

		if (typeof obj === "undefined") {
			this.paper.forEach(function(o) {
				if (o.url == url) {
					obj = o;
				}
			});
		}

		if (!!obj) {

			// deselect other elements
			this.$target.find("path.selected-region").each(function(i, path) {
				_removeClass(path, "selected-region");
				this.lowlightRegion.call(this, $(path));
			}.bind(this));

			// highlight current element
			var $path = $(obj.node);
			_addClass($path[0], "selected-region");
			this.highlightRegion.call(this, obj);
		}
	};

	RaphaelWorldMap.prototype.selectAllRegions = function() {

		var $path;
		this.paper.forEach(function (obj) {
			if (undefined == obj.show_flag && !obj.show_flag) {
				$path = $(obj.node);

				this.highlightRegion.call(this, obj);
				_addClass($path[0], "selected-region");

			}
		}.bind(this));
	};


	/*
	 * TODO - make this into class based library, so can initialize all different types of maps here
	 *
	 * Method Namespace: usn.travel.maps.init
	 *
	 * Parameters:
	 *     mapType - Type of map to embed, can be "slide-down", "normal".
	 *     options.libraryType - Type of library to use to embed the map. Currently only "gmaps".
	 *     options.mainLocation - Main location object.
	 *     options.locations - Array of location objects.
	 */
	 var MAP;

	usn.travel.maps.init = function(mapType, options) {

		options = options || {};

		if (mapType === "raphael-world-map") {
			var targetSelector = options.targetSelector;
			MAP = new RaphaelWorldMap(targetSelector, options);
		}

		return MAP;
	};

})(jQuery);

function MapLocation(location) {
    this.next = null;
    this.location = location;
    this.icon = L.divIcon(
    {
        iconSize: new L.Point(location.iconWidth, location.iconHeight),
        iconAnchor: null,
        className: location.name_hash,
        html: location.iconHTML
    });
    this.latLong = new L.LatLng(location.lat, location.lng);
    this.marker = new L.marker(this.latLong, { icon: this.icon, title: location.name });

    this.addPopup();

}
MapLocation.prototype.addPopup = function() {
    if (this.location.infoWindow && this.marker) {
        this.marker.bindPopup(this.location.infoWindow);
    }
};

// Holds all our locations, depends on map
function MapLocationList(map) {
    this.map = map;
    this.head = null;
    this.tail = null;
    this.itinBounds = [[]];
    this.markers = [];
    this.attractionMarkers = [];
    this.hotelMarkers = [];
    this.isZoomedIn = false;
}
// one display day to rule them all
MapLocationList.displayedDay = null;
// cached polyline
MapLocationList.cachedPolyline = null;

MapLocationList.prototype.add = function(l) {
    if (!this.head) {
        this.head = l;
        this.tail = this.head;
        // if head location is part of a day itin set display date
        if (this.head.location.day) {
            MapLocationList.displayedDay = this.head.location.day;
            MapLocationList.cachedPolyline = new L.polyline(new L.LatLng(0, 0), {className: "day-"+MapLocationList.displayedDay});
        }
    }
    else if (!this.tail){
        this.tail = l;
        this.head.next = this.tail;
    }
    else {
        var buffer = this.tail;
        this.tail = l;
        buffer.next = this.tail;
    }
};
MapLocationList.prototype.addEdge = function(maplocation) {
    var cursor = MapLocationList.displayedDay-1;
    if (maplocation.location.day != MapLocationList.displayedDay) {
        MapLocationList.displayedDay = maplocation.location.day;
        MapLocationList.cachedPolyline = new L.polyline(new L.LatLng(0, 0), {className: "day-"+MapLocationList.displayedDay});
        cursor = MapLocationList.displayedDay-1;
        this.itinBounds[cursor] = [];
    }
    MapLocationList.cachedPolyline.addLatLng(maplocation.latLong).addTo(this.map);
    this.itinBounds[cursor].push(maplocation.marker);
};
MapLocationList.prototype.addToMap = function() {
    var navigator = this.head;
    while (navigator) {
        navigator.marker.addTo(this.map);
        if (MapLocationList.displayedDay) {
            this.addEdge(navigator);
        }
        this.markers.push(navigator.marker);
        if (navigator.location.type === "hotel") { this.hotelMarkers.push(navigator.marker); }
        if (navigator.location.type === "attraction") { this.attractionMarkers.push(navigator.marker); }
        navigator = navigator.next;
    }
    this.onLocationsAdded();
};
MapLocationList.prototype.zoomIn = function(opts) {

    var latLong, cursor;

    if (!!opts.marker) {
        latLong = opts.marker.getLatLng();
    } else {
        if (opts.index && opts.index instanceof Array) {
            var marker_group = [],
                that = this;
            opts.index.forEach(function(entry_id) {
                var cursor = Number(entry_id);
                typeof that.markers[cursor] != "undefined" && marker_group.push(that.markers[cursor]);
            });
            this.map.fitBounds(new L.featureGroup(marker_group).getBounds(), {maxZoom: opts.zoom});
            return;
        }
        else {
            cursor = Number(opts.index) - 1,
            latLong = this.markers[cursor].getLatLng();
        }
    }
    this.map.setView([latLong.lat, latLong.lng], opts.zoom);
};
MapLocationList.prototype.zoomOnItinList = function(day, zoomLevel) {
    this.map.fitBounds(new L.featureGroup(this.itinBounds[day]).getBounds(), {maxZoom: zoomLevel});
    this.isZoomedIn = true;
};
MapLocationList.prototype.onLocationsAdded = function() {
    this.centerMap();
    usn.travel.ready(function() {
        usn.travel.events.trigger('travel:map:locations:added');
    });
};
MapLocationList.prototype.centerMap = function(opts) {
    opts = opts || {};

    var markers = this.markers;
    if (opts.markerType === "hotel") { markers = this.hotelMarkers; }
    if (opts.markerType === "attraction") { markers = this.attractionMarkers; }

    this.map.fitBounds(new L.featureGroup(markers).getBounds(), opts);
    this.isZoomedIn = false;
};
