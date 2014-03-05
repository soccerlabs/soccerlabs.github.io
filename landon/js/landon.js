var yearWidth = 730,
    yearHeight = 95,
    cellSize = 13; // cell size

var day = d3.time.format("%w"),
    week = d3.time.format("%U"),
    percent = d3.format(".1%"),
    format = d3.time.format("%Y-%m-%d");

var color = function(d) {
  if (!d) return '';
  return d.Team.replace(' ', '');
};

d3.csv("LandonGoals.csv", function(error, csvData) {
  var data = d3.nest()
    .key(function(d) { 
      return d.Date; 
    })
    .rollup(function(d) { 
      return +d[0].Goals; 
    })
    .map(csvData);
  var dataMap = {};
  csvData.forEach(function (d) { 
    dataMap[d.Date] = d; 
  });

  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-8, 0])
    .html(function (d) {
      if (!dataMap[d]) return '';
      return d + "<br/>" + 
        dataMap[d].Team + " vs. " + dataMap[d].Opponent + "<br/>" +
        dataMap[d].Competition + "<br/>" + 
        dataMap[d].Result + "<br/>" + 
        data[d] + (data[d] === 1 ? ' goal' : ' goals');
    });

  var svg = d3.select("#container").style('max-width', yearWidth +'px')
      .selectAll("svg")
      .data(d3.range(1999, 2014))
    .enter().append("svg")
      .attr("width", yearWidth)
      .attr("height", yearHeight)
      .attr("class", "RdYlGn")
    .append("g")
      .attr("transform", "translate(" + ((yearWidth - cellSize * 53) / 2) + "," + (yearHeight - cellSize * 7 - 1) + ")");

  svg.append("text")
      .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
      .style("text-anchor", "middle")
      .text(function(d) { return d; });

  svg.call(tip);

  var rect = svg.selectAll(".day")
      .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("svg")
      .attr("x", function(d) { return week(d) * cellSize; })
      .attr("y", function(d) { return day(d) * cellSize; })
      .attr("width", cellSize)
      .attr("height", cellSize)
      .datum(format);

  var dayrect = rect.append('rect')
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('class', function(d) { 
      return "day " + color(dataMap[d]); 
    });
    
  rect.filter(function(d) { return d in data; })
      .on('mouseover', function (d) { tip.show(d, this); })
      .on('mouseout', tip.hide)
      .selectAll('rect')
      .data(function (d) { return _.range(-1, dataMap[d].Goals); })
    .enter().append('rect')
      .attr('width', 4)
      .attr('height', 4)
      .attr('x', function (d) { return ((d % 2) * 5)+2; })
      .attr('y', function (d) { return (Math.floor(d / 2) * 5)+2; })
      .attr('class', 'q4-11')
      ;

  svg.selectAll(".month")
      .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("path")
      .attr("class", "month")
      .attr("d", monthPath);

  var weekData = d3.nest()
    .key(function (d) { return d3.time.weekOfYear(new Date(d.Date + ' 12:00:00 GMT-0500 (EST)')); })
    .rollup(function (d) { return d3.sum(d, function (x) { return +x.Goals; }); })
    .map(csvData);

  var histData = [];
  for (var weekVal in weekData) {
    for (var i=0; i < weekData[weekVal]; i++) histData.push(weekVal);
  }

  var appHist = [];
  csvData.forEach(function (d) {
    appHist.push(d3.time.weekOfYear(new Date(d.Date+ ' 12:00:00 GMT-0500 (EST)')));
  });

  displayGoalDist(histData, 'Goals');
  displayGoalDist(appHist, 'Appearances');
});

function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}

d3.select('body').style("height", "2910px");

function displayGoalDist(weekData, label) {

// A formatter for counts.
var formatCount = d3.format(",.0f");

var margin = {top: 10, right: 30, bottom: 30, left: 20},
    width = cellSize * 53,
    height = 200 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([0, 53])
    .range([0, width]);

var data = d3.layout.histogram()
    .bins(x.ticks(54))
    (weekData);

var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) { return d.y; })])
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(13)
    .tickFormat(function (d) { return d+1; })
    .orient("bottom");

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-8, 0])
  .html(function (d) {
    return d.y + ' ' + label + ' in Week ' + (d.x+1);
  });

var svg = d3.select("#container").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.call(tip);

var bar = svg.selectAll(".bar")
    .data(data)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

bar.append("rect")
    .attr("x", 1)
    .attr("width", x(data[0].dx) - 1)
    .attr("height", function(d) { return height - y(d.y); })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    ;

bar.append("text")
    .attr("dy", ".75em")
    .attr("y", 3)
    .attr("x", x(data[0].dx) / 2)
    .attr("text-anchor", "middle")
    .attr('class', 'bar-label')
    .text(function(d) { return formatCount(d.y); });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);
}