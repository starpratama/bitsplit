var CHART = (function()
{
  var arc, pie, svg, circle;

  var chartData                          = [];
  var display_other_players_in_aggregate = false;
  var highlightFirstSegment              = false;
  var my_view                            = 0;

  var VIEWS = {
    WIN_CHANCE           : 0,
    PERCENT_CONTRIBUTION : 1,
    COMBINED             : 2
  };

  var innerRadius_min, outerRadius_normal, outerRadius_max;
  var width                         = 450;
  var height                        = width;
  // var outerRadiusInnerRadiusRatio   = 0.5;
  // var innerCirclePercentageOfScreen = 0.4;

  function resize() {
    // innerRadius_min    =
    //   Math.ceil((height/2)*innerCirclePercentageOfScreen);
    // outerRadius_normal =
    //   innerRadius_min+Math.ceil(innerRadius_min*outerRadiusInnerRadiusRatio);
    // outerRadius_max    =
    //   (Math.min(width, height) / 2) - innerRadius_min;

    innerRadius_min    = 125;
    outerRadius_max    = 200;
    outerRadius_normal = 200;
  }

  function sqr(x) { return x*x; }

  function get_class(d, i) {
    // return i === 0 && highlightFirstSegment ? "arc current-player" : "arc";
    return "arc current-player";
  }

  function init(selector) {
    arc = d3.svg.arc();
    pie = d3.layout.pie()
      .sort(null);

    if(typeof selector !== "string") {
      selector = "body";
    }
    console.log("Chart selector:", selector);

    svg = d3.select(selector).append("svg")
      .attr("width", width)
      .attr("height", height);
  }

   // chartData: [{contribution: 3, win_chance: 9} ...]
  function arcs(chartData)
  {
    // Make a copy
    var data = chartData.slice();

    var max_win_chance_out_of_1 = 0;
    var win_chance_total        = 0;
    data.forEach(function(item, i) {
      win_chance_total += item.win_chance;
    });

    data.forEach(function(item, i) {
      var wc_1 = item.win_chance / win_chance_total;

      item.win_chance_out_of_1 = wc_1;

      // Find the arc with the maximum chance of winning
      if(wc_1 > max_win_chance_out_of_1) {
        max_win_chance_out_of_1 = wc_1;
      }
    });

    var arc_len_attr = "contribution";
    if(my_view === VIEWS.WIN_CHANCE) {
      arc_len_attr = "win_chance";
    }
    var arc_lens = [];
    data.forEach(function(item, i) {
      // TODO: Pie should be limited depending on if 
      arc_lens.push(item[arc_len_attr]);
    });

    var arcs0 = pie(arc_lens);
    var i     = -1;
    var arc;

    var max_arc_out_of_1 = 0;
    arcs0.forEach(function(d, i) {
      d.angle_length          = d.endAngle - d.startAngle;
      d.angle_length_out_of_1 = d.angle_length/(2*Math.PI);

      if(d.angle_length_out_of_1 > max_arc_out_of_1) {
        max_arc_out_of_1 = d.angle_length_out_of_1;
      }
      if(d.angle_length_out_of_1 > max_arc_out_of_1) {
        max_arc_out_of_1 = d.angle_length_out_of_1;
      }
    });

    var max_win_chance = max_win_chance_out_of_1;

    var maxOuterRadius, minInnerRadius;
    var innerRadius_fn, outerRadius_fn;

    if(my_view === VIEWS.COMBINED) {
      maxOuterRadius = outerRadius_max;
      minInnerRadius = innerRadius_min;

      innerRadius_fn = function() { return innerRadius_min; };
      outerRadius_fn = getOuterRadius;
    }
    else if(my_view === VIEWS.PERCENT_CONTRIBUTION ||
            my_view === VIEWS.WIN_CHANCE)
    {
      maxOuterRadius = outerRadius_normal;
      minInnerRadius = innerRadius_min;

      innerRadius_fn = function() { return innerRadius_min; };
      outerRadius_fn = function() { return outerRadius_normal; };
    }

    var circle_area    = Math.PI*(sqr(maxOuterRadius) - sqr(minInnerRadius));
    var section_area   = circle_area*max_arc_out_of_1;
    var density        = max_win_chance/section_area;

    function getOuterRadius(arc_out_of_1, win_chance)
    {
      var arc_len = arc_out_of_1*maxOuterRadius;

      if(arc_out_of_1 === 0) {
        return minInnerRadius;
      }

      var radius = sqr(minInnerRadius) +
        (win_chance / (Math.PI*arc_out_of_1*density));
      radius = Math.ceil(Math.sqrt(radius));

      return radius;
    }

    for(var ii=0; ii< arcs0.length;ii++) {
      arc = arcs0[ii];
      arc.innerRadius = innerRadius_fn(arc.angle_length_out_of_1,
                          sqr(arc.angle_length_out_of_1));

      arc.outerRadius = outerRadius_fn(arc.angle_length_out_of_1,
         data[ii].win_chance_out_of_1); // TODO: This reference is far away

    }
    return arcs0;
  }

  function transition() {
    var my_data = get_my_data();
    var arcs    =
      svg.selectAll(".arc")
        .data(my_data);

    arcs
      .enter().append("g")
        .attr("class", "arc")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        .append("path")
        .attr("d", arc)
        // store the initial angles
        // Not necessary to do each time, most likely
        .each(function(d, i) { this._current = d; });
    arcs
      .exit().remove();

    // Should really be done with .enter???
    if(highlightFirstSegment) {
      $(".arc:eq(0)").attr("class", "arc current-player")
    }
    else {
      $(".arc:eq(0)").attr("class", "arc");
    }


    var path = d3.selectAll(".arc > path")
        .data(my_data);

    path.transition().duration(750).attrTween("d", arcTween);
  }

  // http://bl.ocks.org/mbostock/1346410
  //
  // Store the displayed angles in _current.
  // Then, interpolate from _current to the new angles.
  // During the transition, _current is updated in-place by d3.interpolate.
  function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return arc(i(t));
    };
  }

  // [{contribution: 3, win_chance: 9} ...]
  function get_my_data()
  {
    var modified_data = [];

    // Chart all, or chart only current user vs others?
    if(display_other_players_in_aggregate) {
      var chartData_copy = chartData.slice(0);
      var currentPlayer  = chartData_copy.shift();
      var otherPlayers   = {contribution: 0, win_chance: 0};

      chartData_copy.forEach(function(item) {
        otherPlayers.contribution        += item.contribution;
        otherPlayers.win_chance          += item.win_chance; 
      });
      modified_data[0] = currentPlayer;
      modified_data[1] = otherPlayers;
    }
    else {
      modified_data = chartData;
    }

    var my_data = arcs(modified_data);

    return my_data;
  }

  function setHighlightFirstSegment(should_highlight) {
    highlightFirstSegment = should_highlight;
  }

  // Initialize
  resize();

  return {
    init : init,
    setView : function(viewCode) {
      my_view = viewCode;
      this.refresh();
    },
    setDisplayOtherPlayersInAggregate : function(dopia) {
      display_other_players_in_aggregate = dopia;
      this.refresh();
    },
    setHighlightFirstSegment: setHighlightFirstSegment,
    setData : function(data) {
      chartData = data;
    },
    refresh : function() {
      transition();
    },
    VIEWS : VIEWS
  };
})();