dojo.provide("dojox.widget.Calendar");
dojo.experimental("dojox.widget.Calendar");

dojo.require("dijit._Calendar");
dojo.require("dijit._Container");

dojo.declare("dojox.widget._CalendarBase", [dijit._Widget, dijit._Templated, dijit._Container], {
	// summary: The Root class for all _Calendar extensions

	// templatePath: URL
	//  the path to the template to be used to construct the widget.
	templatePath: dojo.moduleUrl("dojox.widget","Calendar/Calendar.html"),

	// _views: Array
	//  The list of mixin views available on this calendar.
	_views: null,

	// useFx: Boolean
	//  Specifies if visual effects should be applied to the widget.
	//  The default behavior of the widget does not contain any effects.
	//  The dojox.widget.CalendarFx package is needed for these.
	useFx: true,

	// widgetsInTemplate: Boolean
	//  This widget is a container of other widgets, so this is true.
	widgetsInTemplate: true,

	// value: Date
	// 	the currently selected Date
	value: null,

	// footerFormat: String
	//   The date format of the date displayed in the footer.  Can be
	//   'short', 'medium', and 'long'
	footerFormat: "medium",

	constructor: function(){
		// summary: constructor for the widget
		this._views = [];
		this.value = this.value || new Date();
	},

	postCreate: function(){
		// summary: Instantiates the mixin views
		this._height = dojo.style(this.containerNode, "height");
		this.displayMonth = new Date(this.value);

		var mixin = {
			parent: this,
			_getValueAttr: dojo.hitch(this, function(){return new Date(this.displayMonth);}),
			getLang: dojo.hitch(this, function(){return this.lang;}),
			isDisabledDate: dojo.hitch(this, this.isDisabledDate),
			getClassForDate: dojo.hitch(this, this.getClassForDate),
			addFx: this.useFx ? dojo.hitch(this, this.addFx) : function(){}
		};

		//Add the mixed in views.
		dojo.forEach(this._views, function(widgetType){
			var widget = new widgetType(mixin, dojo.create('div'));
			this.addChild(widget);

			var header = widget.getHeader();
			if (header) {
	  	//place the views's header node in the header of the main widget
				this.header.appendChild(header);

				//hide the header node of the widget
				dojo.style(header, "display", "none");
			}
			//Hide all views
			dojo.style(widget.domNode, "visibility", "hidden");

			//Listen for the values in a view to be selected
			dojo.connect(widget, "onValueSelected", this, "_onDateSelected");
			widget.attr("value", this.value);
		}, this);

		if(this._views.length < 2) {
			dojo.style(this.header, "cursor", "auto");
		}

		this.inherited(arguments);

		// Cache the list of children widgets.
		this._children = this.getChildren();

		this._currentChild = 0;

		//Populate the footer with today's date.
		var today = new Date();

		this.footer.innerHTML = "Today: " + dojo.date.locale.format(today,
				{formatLength:this.footerFormat,selector:'date', locale:this.lang});

		dojo.connect(this.footer, "onclick", this, "goToToday");

		var first = this._children[0];

		dojo.style(first.domNode, "top", "0px");
		dojo.style(first.domNode, "visibility", "visible");

		var header = first.getHeader();
		if (header) {
			dojo.style(first.getHeader(), "display", "");
		}
		
		dojo[first.useHeader ? "removeClass" : "addClass"](this.container, "no-header");

		first.onDisplay();

		var _this = this;

		var typematic = function(nodeProp, dateProp, adj){
			dijit.typematic.addMouseListener(_this[nodeProp], _this, function(count){
				if(count >= 0){	_this._adjustDisplay(dateProp, adj);}
			}, 0.8, 500);
		};
		typematic("incrementMonth", "month", 1);
		typematic("decrementMonth", "month", -1);
		this._updateTitleStyle();
	},

	addFx: function(query, fromNode) {
		// Stub function than can be overridden to add effects.
	},

	_setValueAttr: function(/*Date*/ value){
		// summary: set the current date and update the UI.  If the date is disabled, the selection will
		//	not change, but the display will change to the corresponding month.
		if(!this.value || dojo.date.compare(value, this.value)){
			value = new Date(value);
			this.displayMonth = new Date(value);
			if(!this.isDisabledDate(value, this.lang)){
				this.value = value;
				this.value.setHours(0,0,0,0);
				this.onChange(this.value);
			}
			this._children[this._currentChild].attr("value", this.value);
			return true;
		}
		return false;
	},

	isDisabledDate: function(/*Date*/dateObject, /*String?*/locale){
		// summary:
		//	May be overridden to disable certain dates in the calendar e.g. `isDisabledDate=dojo.date.locale.isWeekend`
/*=====
		return false; // Boolean
=====*/
	},

	onValueSelected: function(/*Date*/date){
		// summary: a date cell was selected.  It may be the same as the previous value.
	},

	_onDateSelected: function(date, formattedValue, force){
		this.displayMonth = date;
		this.attr("value", date)
		//Only change the selected value if it was chosen from the
		//first child.
		if (!this._transitionVert(-1)) {
			if (!formattedValue && formattedValue !== 0) {
				formattedValue = this.value;
			}
			this.onValueSelected(formattedValue);
		}

	},

	onChange: function(/*Date*/date){
		// summary: called only when the selected date has changed
	},

	onHeaderClick: function(e) {
		// summary: Transitions to the next view.
		this._transitionVert(1);
	},

	goToToday: function(){
		this.attr("value", new Date());
		this.onValueSelected(this.value);
	},

	_transitionVert: function(/*Number*/direction){
		// summary: Animates the views to show one and hide another, in a
		//   vertical direction.
		//   If 'direction' is 1, then the views slide upwards.
		//   If 'direction' is -1, the views slide downwards.
		var curWidget = this._children[this._currentChild];
		var nextWidget = this._children[this._currentChild + direction];
		if(!nextWidget){return false;}

		dojo.style(nextWidget.domNode, "visibility", "visible");

		var height = dojo.style(this.containerNode, "height");
		nextWidget.attr("value", this.displayMonth);

		if (curWidget.header) {
			dojo.style(curWidget.header, "display", "none");
		}
		if (nextWidget.header) {
			dojo.style(nextWidget.header, "display", "");
		}
		dojo.style(nextWidget.domNode, "top", (height * -1) + "px");
		dojo.style(nextWidget.domNode, "visibility", "visible");

		this._currentChild += direction;

		var height1 = height * direction;
		var height2 = 0;
		dojo.style(nextWidget.domNode, "top", (height1 * -1) + "px");

		// summary: Slides two nodes vertically.
		var anim1 = dojo.animateProperty({
			node: curWidget.domNode,
			properties: {top: height1},
			onEnd: function(){
				dojo.style(curWidget.domNode, "visibility", "hidden");
			}
		});
		var anim2 = dojo.animateProperty({
			node: nextWidget.domNode,
			properties: {top: height2},
			onEnd: function(){
				nextWidget.onDisplay();
			}
		});

		dojo[nextWidget.useHeader ? "removeClass" : "addClass"](this.container, "no-header");

		anim1.play();
		anim2.play();
		curWidget.onBeforeUnDisplay()
		nextWidget.onBeforeDisplay();

		this._updateTitleStyle();
		return true;
	},

	_updateTitleStyle: function(){
		dojo[this._currentChild < this._children.length -1 ? "addClass" : "removeClass"](this.header, "navToPanel");
	},

	_slideTable: function(/*String*/widget, /*Number*/direction, /*Function*/callback){
		// summary: Animates the horizontal sliding of a table.
		var table = widget.domNode;

		//Clone the existing table
		var newTable = table.cloneNode(true);
		var left = dojo.style(table, "width");

		table.parentNode.appendChild(newTable);

		//Place the existing node either to the left or the right of the new node,
		//depending on which direction it is to slide.
		dojo.style(table, "left", (left * direction) + "px");

		//Call the function that generally populates the new cloned node with new data.
		//It may also attach event listeners.
		callback();

		//Animate the two nodes.
		var anim1 = dojo.animateProperty({node: newTable, properties:{left: left * direction * -1}, duration: 500, onEnd: function(){
			newTable.parentNode.removeChild(newTable);
		}});
		var anim2 = dojo.animateProperty({node: table, properties:{left: 0}, duration: 500});

		anim1.play();
		anim2.play();
	},

	_addView: function(view) {
		//Insert the view at the start of the array.
		this._views.push(view);
	},

	getClassForDate: function(/*Date*/dateObject, /*String?*/locale){
		// summary:
		//  May be overridden to return CSS classes to associate with the date entry for the given dateObject,
		//  for example to indicate a holiday in specified locale.

/*=====
		return ""; // String
=====*/
	},

	_adjustDisplay: function(/*String*/part, /*int*/amount, noSlide){
		// summary: This function overrides the base function defined in dijit._Calendar.
		//   It changes the displayed years, months and days depending on the inputs.
		var child = this._children[this._currentChild];

		var month = this.displayMonth = child.adjustDate(this.displayMonth, amount);

		this._slideTable(child, amount, function(){
			child.attr("value", month);
		});
	}
});

dojo.declare("dojox.widget._CalendarView", dijit._Widget, {
	// summary: Base implementation for all view mixins.
	//   All calendar views should extend this widget.
	headerClass: "",

	useHeader: true,

	cloneClass: function(clazz, n, before){
		// summary: Clones all nodes with the class 'clazz' in a widget
		var template = dojo.query(clazz, this.domNode)[0];
		if (!before) {
			for (var i = 0; i < n; i++) {
				template.parentNode.appendChild(template.cloneNode(true));
			}
		} else {
			var bNode = dojo.query(clazz, this.domNode)[0];
			for (var i = 0; i < n; i++) {
				template.parentNode.insertBefore(template.cloneNode(true), bNode);
			}
		}
	},

	_setText: function(node, text){
		// summary: sets the text inside a node
		while(node.firstChild){
			node.removeChild(node.firstChild);
		}
		node.appendChild(dojo.doc.createTextNode(text));
	},

	getHeader: function(){
		// summary: Returns the header node of a view. If none exists,
		//   an empty DIV is created and returned.
		return this.header || (this.header = this.header = dojo.create("span", { "class":this.headerClass }));
	},

	onValueSelected: function(date){
		//Stub function called when a date is selected
	},

	adjustDate: function(date, amount){
		// summary: Adds or subtracts values from a date.
		//   The unit, e.g. "day", "month" or "year", is
		//   specified in the "datePart" property of the
		//   calendar view mixin.
		return dojo.date.add(date, this.datePart, amount);
	},

	onDisplay: function(){
		// summary: Stub function that can be used to tell a view when it is shown.
	},

	onBeforeDisplay: function(){
		// summary: Stub function that can be used to tell a view it is about to be shown.
	},

	onBeforeUnDisplay: function(){
		// summary: Stub function that can be used to tell
		// a view when it is no longer shown.
	}
});

dojo.declare("dojox.widget._CalendarDay", null, {
	// summary: Mixin for the dojox.widget.Calendar which provides
	//  the standard day-view. A single month is shown at a time.
	parent: null,

	constructor: function(){
		this._addView(dojox.widget._CalendarDayView);
	}
});

dojo.declare("dojox.widget._CalendarDayView", [dojox.widget._CalendarView, dijit._Templated], {
	// summary: View class for the dojox.widget.Calendar.
	//   Adds a view showing every day of a single month to the calendar.
	//   This should not be mixed in directly with dojox.widget._CalendarBase.
	//   Instead, use dojox.widget._CalendarDay

	// templatePath: URL
	//  the path to the template to be used to construct the widget.
	templatePath: dojo.moduleUrl("dojox.widget","Calendar/CalendarDay.html"),

	// datePart: String
	//  Specifies how much to increment the displayed date when the user
	//  clicks the array button to increment of decrement the view.
	datePart: "month",

	// dayWidth: String
	//  Specifies the type of day name to display.  "narrow" causes just one letter to be shown.
	dayWidth: "narrow",

	postCreate: function(){
		// summary: Constructs the calendar view.
		this.cloneClass(".dijitCalendarDayLabelTemplate", 6);
		this.cloneClass(".dijitCalendarDateTemplate", 6);

		// now make 6 week rows
		this.cloneClass(".dijitCalendarWeekTemplate", 5);

		// insert localized day names in the header
		var dayNames = dojo.date.locale.getNames('days', this.dayWidth, 'standAlone', this.getLang());
		var dayOffset = dojo.cldr.supplemental.getFirstDayOfWeek(this.getLang());

		// Set the text of the day labels.
		dojo.query(".dijitCalendarDayLabel", this.domNode).forEach(function(label, i){
			this._setText(label, dayNames[(i + dayOffset) % 7]);
		}, this);

	},

	onDisplay: function(){
		if(!this._addedFx) {
		// Add visual effects to the view, if any has been specified.
			this._addedFx = true;
			this.addFx(".dijitCalendarDateTemplate div", this.domNode);
		}
	},

	_onDayClick: function(e) {
		// summary: executed when a day value is clicked.
		var date = this.attr("value");
		var p = e.target.parentNode;
		var c = "dijitCalendar";
		var d = dojo.hasClass(p, c + "PreviousMonth") ? -1 :
							(dojo.hasClass(p, c + "NextMonth") ? 1 : 0);
		if (d){date = dojo.date.add(date, "month", d)}
		date.setDate(e.target._date);
		this.value = date;
		this.parent._onDateSelected(date);
	},

	_setValueAttr: function(value) {
		//Change the day values
		this._populateDays();
	},

	_populateDays: function() {
		// summary: Fills the days of the current month.
		var month = this.attr("value");
		month.setDate(1);
		var firstDay = month.getDay();
		var daysInMonth = dojo.date.getDaysInMonth(month);
		var daysInPreviousMonth = dojo.date.getDaysInMonth(dojo.date.add(month, "month", -1));
		var today = new Date();
		var selected = this.value;

		var dayOffset = dojo.cldr.supplemental.getFirstDayOfWeek(this.getLang());
		if(dayOffset > firstDay){ dayOffset -= 7; }

		// Iterate through dates in the calendar and fill in date numbers and style info
		dojo.query(".dijitCalendarDateTemplate", this.domNode).forEach(function(template, i){
			i += dayOffset;
			var date = new Date(month);
			var number, clazz = "dijitCalendar", adj = 0;

			if(i < firstDay){
				number = daysInPreviousMonth - firstDay + i + 1;
				adj = -1;
				clazz += "Previous";
			}else if(i >= (firstDay + daysInMonth)){
				number = i - firstDay - daysInMonth + 1;
				adj = 1;
				clazz += "Next";
			}else{
				number = i - firstDay + 1;
				clazz += "Current";
			}

			if(adj){
				date = dojo.date.add(date, "month", adj);
			}
			date.setDate(number);

			if(!dojo.date.compare(date, today, "date")){
				clazz = "dijitCalendarCurrentDate " + clazz;
			}

			if(!dojo.date.compare(date, selected, "date")){
				clazz = "dijitCalendarSelectedDate " + clazz;
			}

			if(this.isDisabledDate(date, this.getLang())){
				clazz = " dijitCalendarDisabledDate " + clazz;
			}

			var clazz2 = this.getClassForDate(date, this.getLang());
			if(clazz2){
				clazz += clazz2 + " " + clazz;
			}

			template.className =  clazz + "Month dijitCalendarDateTemplate";
			template.dijitDateValue = date.valueOf();
			var label = dojo.query(".dijitCalendarDateLabel", template)[0];
			this._setText(label, date.getDate());
			label._date = label.parentNode._date = date.getDate();
		}, this);

		// Fill in localized month name
		var monthNames = dojo.date.locale.getNames('months', 'wide', 'standAlone', this.getLang());
		this._setText(this.monthLabelNode, monthNames[month.getMonth()]);
		this._setText(this.yearLabelNode, month.getFullYear());
	}
});


dojo.declare("dojox.widget._CalendarMonthYear", null, {
	// summary: Mixin class for adding a view listing all 12 months of the year to the
	//   dojox.widget._CalendarBase

	constructor: function(){
		// summary: Adds a dojox.widget._CalendarMonthView view to the calendar widget.
		this._addView(dojox.widget._CalendarMonthYearView);
	}
});

dojo.declare("dojox.widget._CalendarMonthYearView", [dojox.widget._CalendarView, dijit._Templated], {
	// summary: A Calendar view listing the 12 months of the year

	// templatePath: URL
	//  the path to the template to be used to construct the widget.
	templatePath: dojo.moduleUrl("dojox.widget","Calendar/CalendarMonthYear.html"),

	// datePart: String
	//  Specifies how much to increment the displayed date when the user
	//  clicks the array button to increment of decrement the view.
	datePart: "year",

	displayedYears: 10,

	useHeader: false,

	postCreate: function(){
		// summary: Constructs the view
		this.cloneClass(".dojoxCal-MY-G-Template", 5, ".dojoxCal-MY-btns");
		this.monthContainer = this.yearContainer = this.myContainer;

		var yClass = "dojoxCalendarYearLabel";

		dojo.query("." + yClass, this.myContainer).forEach(function(node, idx){
			var clazz = "dojoxCalendarIncrease";
			switch (idx) {
				case 0:
				  clazz = "dojoxCalendarDecrease";
				case 1:
				  dojo.removeClass(node, yClass);
				  dojo.addClass(node, clazz);
					break;
			}
		});
		dojo.query(".dojoxCal-MY-M-Template", this.domNode)
		  .filter(function(item){
				return item.cellIndex == 1;
			})
			.addClass("dojoxCal-MY-M-last");

		dojo.connect(this, "onBeforeDisplay", dojo.hitch(this, function(){
			this._cachedDate = new Date(this.attr("value").getTime());
			this._populateYears(this._cachedDate.getFullYear());
			this._updateSelectedMonth();
		}));

		dojo.connect(this, "_populateYears", dojo.hitch(this, function(){
			this._updateSelectedYear();
		}));

		this._cachedDate = this.attr("value");

		this._populateMonths();
		this._populateYears();

		// Add visual effects to the view, if any have been mixed in
		this.addFx(".dojoxCalendarMonthLabel,.dojoxCalendarYearLabel ", this.myContainer);
	},

	_setValueAttr: function(value){
		this._populateYears(value.getFullYear());
	},

	getHeader: function(){
		return null;
	},

	_getMonthNames: function(format) {
		// summary: Returns localized month names
		this._monthNames  = this._monthNames || dojo.date.locale.getNames('months', format, 'standAlone', this.getLang());
		return this._monthNames;
	},

	_populateMonths: function() {
		// summary: Populate the month names using the localized values.
		var monthNames = this._getMonthNames('abbr');
		dojo.query(".dojoxCalendarMonthLabel", this.monthContainer).forEach(dojo.hitch(this, function(node, cnt){
			this._setText(node, monthNames[cnt]);
		}));
		var h = this.getHeader();
		if (h) {
			this._setText(this.getHeader(), this.attr("value").getFullYear());
		}
	},

  _populateYears: function(year) {
		// summary: Fills the list of years with a range of 12 numbers, with the current year
		//   being the 6th number.
		var dispYear = year || this.attr("value").getFullYear();
		var firstYear = dispYear - Math.floor(this.displayedYears/2);

		// summary: Writes the years to display to the view
		if(this._displayedYear && year) {
			var oldFirstYear =  this._displayedYear - Math.floor(this.displayedYears/2);
			if (year >= oldFirstYear && year <= oldFirstYear + this.displayedYears - 1) {
		  	return;
		  }
		}
		this._displayedYear = dispYear;

		dojo.query(".dojoxCalendarYearLabel", this.yearContainer).forEach(dojo.hitch(this, function(node, cnt){
			this._setText(node, firstYear + cnt);
		}));
		var h = this.getHeader();
		if (h) {
			this._setText(this.getHeader(), firstYear + " - " + (firstYear + 11));
		}
	},

	_updateSelectedYear: function(){
		var year = String((this._cachedDate || this.attr("value")).getFullYear());
    this._updateSelectedNode(".dojoxCalendarYearLabel", function(node, idx){
			return year !== null && node.innerHTML == year;
		});
	},

	_updateSelectedMonth: function(){
		var month = (this._cachedDate || this.attr("value")).getMonth();
		this._updateSelectedNode(".dojoxCalendarMonthLabel", function(node, idx){
			return idx == month;
		});
	},

	_updateSelectedNode: function(query, filter){
		var sel = "dijitCalendarSelectedDate";
		dojo.query(query, this.domNode)
			.forEach(function(node, idx, array) {
				dojo[filter(node, idx, array) ? "addClass" : "removeClass"](node.parentNode, sel);
		});
	},

	onClick: function(evt) {
		var clazz;
		var _this = this;
		var sel = "dijitCalendarSelectedDate";
		function hc(c) {
			return dojo.hasClass(evt.target, c);
		}

		// summary: Handles clicks on month names
		if(hc("dojoxCalendarMonthLabel")){
			clazz = "dojoxCal-MY-M-Template";
		  var month = evt.target.parentNode.cellIndex + (evt.target.parentNode.parentNode.rowIndex * 2);
			this._cachedDate.setMonth(month);
		} else if (hc( "dojoxCalendarYearLabel")) {
			clazz = "dojoxCal-MY-Y-Template";
			var year = Number(evt.target.innerHTML);
			this._cachedDate.setYear(year);
		} else if(hc("dojoxCalendarDecrease")) {
		  this._populateYears(this._displayedYear - 10);
			return
		} else if(hc("dojoxCalendarIncrease")) {
		  this._populateYears(this._displayedYear + 10);
			return
		}
		else {
			return true;
		}
		dojo.query("." + sel, this.domNode)
		  .filter(function(item){
				return dojo.hasClass(item, clazz);
			}).removeClass(sel);
		dojo.addClass(evt.target.parentNode, sel);
		dojo.stopEvent(evt);
		return false;
	},

	onOk: function(evt){
		this.onValueSelected(this._cachedDate);
		return false;
	},

	onCancel: function(evt){
		dojo.stopEvent(evt);
		this.onValueSelected(this.attr("value"));
		return false;
	}
});

dojo.declare("dojox.widget.Calendar2Pane",
	[dojox.widget._CalendarBase,
	 dojox.widget._CalendarDay,
	 dojox.widget._CalendarMonthYear], {
	 	// summary: A Calendar with two panes, the second one
		//     containing both month and year
	 }
);

dojo.declare("dojox.widget.Calendar",
	[dojox.widget._CalendarBase,
	 dojox.widget._CalendarDay,
	 dojox.widget._CalendarMonthYear], {
	 	// summary: The standard Calendar. It includes day and month/year views.
		//  No visual effects are included.
	 }
);

dojo.declare("dojox.widget.DailyCalendar",
	[dojox.widget._CalendarBase,
	 dojox.widget._CalendarDay], {
	 	// summary: A calendar with only a daily view.
	 }
);

dojo.declare("dojox.widget.MonthAndYearlyCalendar",
	[dojox.widget._CalendarBase,
	 dojox.widget._CalendarMonthYear], {
	 	// summary: A calendar with only a daily view.
	 }
);