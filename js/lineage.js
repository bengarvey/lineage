function Lineage() {

  function lin() {
    console.log("Initializing");
    initNightMode();
  }

  console.time('init');

  var svg = d3.select("svg");
      width = window.innerWidth,
      height = window.innerHeight,
      color = d3.scaleOrdinal(d3.schemeCategory20);

  var canvas = document.querySelector("canvas"),
      context = canvas.getContext("2d")

  var canvas = d3.select('canvas')
                  .attr('width', width)
                  .attr('height', height)
                  .node();
  var context = canvas.getContext('2d');
  var nightMode = false;

  var nodes = [],
      links = [],
      data = {},
      originalData = {};

  var canvas = d3.select("canvas")
      .attr("id", "screen")
      .attr("width", width)
      .attr("height", height);

  var startYear = 1800;
  var year = startYear;
  var speed = 100;
  var yearIncrement = 0;
  var filters = $('#search').val();
  var searchRadius = 40;
  var simulation = null;
  var g = null;
  var users = [];

  initializeNav();

  d3.json("data/converted.json", go);

  function go(error, response) {
    if (error) throw error;

    data = response;
    originalData = jQuery.extend({}, response);

    users = d3.nest()
      .key(function(d) { return d.id; })
      .entries(nodes);

    data = prepareData(data, filters);

    //simulation = getSimulation(nodes, links);
    canvas
      .on("mousemove", mousemoved)
      .call(d3.drag()
        .container(document.querySelector("canvas"))
          .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody(1))
      .force("centering", d3.forceCenter(0,0))
      .force("link", d3.forceLink(links))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(1)
      .on("tick", ticked);

    d3.interval(loop, speed, d3.now());

    function dragsubject() {
      console.log("started");
      return simulation.find(d3.event.x - width / 2, d3.event.y - height / 2, searchRadius);
    }

    function mousemoved() {
      var a = this.parentNode, m = d3.mouse(this), d = simulation.find(m[0] - width / 2, m[1] - height / 2, searchRadius);
      if (!d) return a.removeAttribute("href"), a.removeAttribute("title");
      a.setAttribute("href", "http://bl.ocks.org/" + (d.user ? d.user + "/" : "") + d.id);
      a.setAttribute("title", d.id + (d.user ? " by " + d.user : "") + (d.description ? "\n" + d.description : ""));
    }
    /*
    g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
        link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
        node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");
    */
    node = canvas.selectAll(".node");
    link = canvas.selectAll(".link");
    restart();
    console.timeEnd('init');

  }

  function loop() {
    console.time("loop 10");
    year = advanceYear(year);

    console.time("loop 20");
    data.nodes.forEach(addRemoveNode);

    console.time("loop 30");
    data.links.forEach(addRemoveLink);

    console.time("loop 40");
    restart();

    console.timeEnd("loop 10");
    console.timeEnd("loop 20");
    console.timeEnd("loop 30");
    console.timeEnd("loop 40");
    console.log("--------");
  }

  function advanceYear(year) {
    return year + yearIncrement;
  }

  function addRemoveNode(n) {
    if (n.birthDate != null) {
      var nodeYear = n.birthDate.substring(0,4);
      if (nodes.indexOf(n) == -1 && nodeYear <= year) {
        nodes.push(n);
      }
      else if (nodes.indexOf(n) != -1 && (nodeYear > year)) {
        nodes.splice(nodes.indexOf(n), 1);
      }
    }
  }

  function addRemoveLink(l) {
    if (links.indexOf(l) == -1 && nodes.indexOf(l.source) > -1 && nodes.indexOf(l.target) > -1) {
      links.push(l);
    }
    else if (links.indexOf(l) > -1 && (nodes.indexOf(l.source) == -1 || nodes.indexOf(l.target) == -1)) {
      links.splice(links.indexOf(l), 1);
    }
  }

  function prepareData(data, filters) {
    filterItems = filters.split(" ");
    for(var i=0; i<data.nodes.length; i++) {
      if (!inFilter(data.nodes[i], filterItems)) {
        data.nodes.splice(i,1);
        i--;
      }
    }

    // link directly instead of using indices
    data.links.forEach( function(link, index) {
      link.source = getNodeById(data.nodes, link.source);
      link.target = getNodeById(data.nodes, link.target);
    });

    return data;
  }

  function getSimulation(nodes, links) {
    canvas
      .on("mousemove", mousemoved)
      .call(d3.drag()
        .container(canvas)
          .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    var simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody(1))
      .force("centering", d3.forceCenter(0,0))
      .force("link", d3.forceLink(links))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(1)
      .on("tick", ticked);
    return simulation;

  function dragsubject() {
    console.log("started");
    return simulation.find(d3.event.x - width / 2, d3.event.y - height / 2, searchRadius);
  }

  function mousemoved() {
    var a = this.parentNode, m = d3.mouse(this), d = simulation.find(m[0] - width / 2, m[1] - height / 2, searchRadius);
    if (!d) return a.removeAttribute("href"), a.removeAttribute("title");
    a.setAttribute("href", "http://bl.ocks.org/" + (d.user ? d.user + "/" : "") + d.id);
    a.setAttribute("title", d.id + (d.user ? " by " + d.user : "") + (d.description ? "\n" + d.description : ""));
  }
}


  function updateYear(year) {
    $('#year').html(year)
      .css('left', width/2 - 105)
      .css('top', height - 140);
  }

  function resizeScreen() {
    height = window.innerHeight;
    width = window.innerWidth;
    canvas.attr("height", height)
      .attr("width", width);
    console.log(width/2, height/2);
  }

  function updateFilter() {
    if ($('#search').val() != filters) {
      filters = $('#search').val();
      data.nodes.length = 0;
      filterItems = filters.split(" ");
      for (var i=0; i<originalData.nodes.length; i++) {
        if (inFilter(originalData.nodes[i], filterItems)) {
          data.nodes.push(originalData.nodes[i]);
        }
      }
    }
  }

  function restart() {
    updateYear(year);
    //updateFilter();
    // Apply the general update pattern to the nodes.
    /*
    node = node.data(nodes, function(d) { return d.id;});
    node.enter().merge(node);
    node.exit().attr('opacity', 1).transition().duration(500).attr('opacity', 0).remove();

    // Apply the general update pattern to the links.
    link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
    link.enter().merge(link);
    link.exit().transition().attr("stroke-opacity", 0).remove();
    */

    users = d3.nest()
      .key(function(d) { return d.id; })
      .entries(nodes);

    // Update and restart the simulation.
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
  }

  function ticked() {

    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);

    links.forEach(drawLink);

    users.forEach(function(user) {
      context.beginPath();
      user.values.forEach(drawNode);
      context.fillStyle = color(user.values[0].lastName);
      context.fill();
    });

    context.restore();

    /*
    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    */
  }

  function inFilter(node, filterItems) {
    if (filterItems.length == 0) {
      return true;
    }
    var regex = null;
    for(i=0; i<filterItems.length; i++) {
      regex = new RegExp(filterItems[i], 'ig');
      if (node.name.match(regex)) {
        return true;
      }
    }
    return false;
  }


  function dragstarted() {
    console.log("started");
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  function dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }

  function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }

  function initializeNav() {
    d3.select('#timeNavigation')
      .on('mouseover', function(d) {
        d3.select('#timeNavigation')
          .style("left", 0);
      })
      .on('mouseout', function(d) {
        d3.select('#timeNavigation')
          .style("left", -890);
      });
  }

  function getNodeById(nodes, id) {
    for(i=0; i<nodes.length; i++) {
      if (nodes[i].id === id) {
        return nodes[i];
      }
    }
    return -1;
  }

  function drawLink(d) {
    context.beginPath();
    context.moveTo(d.source.x, d.source.y);
    context.lineWidth = 1;
    context.strokeStyle = d.color;
    context.lineTo(d.target.x, d.target.y);
    context.stroke();
  }

  function drawNode(d) {
    context.moveTo(d.x + 3, d.y);
    context.arc(d.x, d.y, 5, 0, 2 * Math.PI);
  }

  function initNightMode() {
    $('#nightModeOn').on("change", function(event) {
        nightMode = !nightMode;
        body = d3.select('body');

        if (nightMode) {
          body.transition().duration(1000).style('background-color', '#000').style('color', '#EEE');
          d3.select('#year').style('color', '#EEE');
        }
        else {
          body.transition().duration(1000).style('background-color', '#FFF').style('color', '#333');
          d3.select('#year').style('color', '#222');
        }
    });
  }


  lin.setYear = function(value) {
    year = value;
  }

  lin.moveYear = function(value) {
    year += value
  }

  lin.setYearIncrement = function(value) {
    yearIncrement = value;
  }

  return lin;
}
