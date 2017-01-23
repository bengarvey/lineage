function start() {

  console.time('init');

  var svg = d3.select("svg");
      width = window.innerWidth,
      height = window.innerHeight,
      color = d3.scaleOrdinal(d3.schemeCategory20);

  var nodes = [],
      links = [],
      data = {},
      originalData = {};

  var svg = d3.select("svg")
      .attr("id", "screen")
      .attr("width", width)
      .attr("height", height);

  var startYear = 1950;
  var year = startYear;
  var speed = 1000;
  var filters = $('#search').val();

  initializeNav();

  d3.json("data/converted.json", function(error, response) {
    if (error) throw error;

    // Filter out nodes we don't need to look at for now
    data = response;
    originalData = jQuery.extend({}, response);

    data = prepareData(data, filters);
    nodes = []; //data.nodes;
    links = []; // data.links;

    var simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody(1))
      .force("centering", d3.forceCenter(0,0))
      .force("link", d3.forceLink(links))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(1)
      .on("tick", ticked);

    var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
        link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
        node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");

    restart();
    console.timeEnd('init');
    var cancel = null;

    cancel = d3.interval(function() {
      console.time("loop 10");
      year += 1;

      console.time("loop 20");
      // push any new ones we need
      data.nodes.forEach( function(n) {
        if (n.birthDate != null) {
          var nodeYear = n.birthDate.substring(0,4);
          if (nodes.indexOf(n) == -1 && nodeYear <= year) {
            nodes.push(n);
          }
          else if (nodes.indexOf(n) > -1 && (nodeYear > year)) {
            nodes.splice(nodes.indexOf(n), 1);
          }
        }
      });

      console.time("loop 25");
      // pop off any ones we don't
      visibleNodeMap = nodes.map(function(node) { return node.id });

      console.time("loop 30");
      // Only show links with both source and target
      data.links.forEach( function(l) {
        if (links.indexOf(l) == -1 && nodes.indexOf(l.source) > -1 && nodes.indexOf(l.target) > -1) {
          links.push(l);
        }
        else if (links.indexOf(l) > -1 && (nodes.indexOf(l.source) == -1 || nodes.indexOf(l.target) == -1)) {
          links.splice(links.indexOf(l), 1);
        }
      });

      console.time("loop 40");
      restart();
      //clearInterval(cancel);
      console.timeEnd("loop 10");
      console.timeEnd("loop 20");
      console.timeEnd("loop 25");
      console.timeEnd("loop 30");
      console.timeEnd("loop 40");
      console.log("--------");
    }, speed, d3.now());

    function prepareData(data, filters) {
      data.nodes = data.nodes.filter( function(n) {
        filterItems = filters.split(" ");
        return inFilter(n, filterItems);
      });

      // link directly instead of using indices
      data.links.forEach( function(link, index) {
        link.source = getNodeById(data.nodes, link.source);
        link.target = getNodeById(data.nodes, link.target);
      });

      return data;
    }

    function updateYear(year) {
      $('#year').html(year)
        .css('left', width/2 - 105)
        .css('top', height - 140);
    }

    function resizeScreen() {
      height = window.innerHeight;
      width = window.innerWidth;
      svg.attr("height", height)
        .attr("width", width);
      console.log(width/2, height/2);
    }

    function updateFilter() {
      if ($('#search').val() != filters) {
        filters = $('#search').val();
        nodes.length = 0;
        links.length = 0;
        filterItems = filters.split(" ");
        for (var i=0; i<originalData.nodes.length; i++) {
          if (inFilter(originalData.nodes[i], filterItems)) {
            nodes.push(originalData.nodes[i]);
          }
        }
      }
    }

    function restart() {
			updateYear(year);
      updateFilter();
      // Apply the general update pattern to the nodes.
      node = node.data(nodes, function(d) { return d.id;});
      node.exit().remove();
      node = node.enter()
        .append("circle")
        .attr("fill", function(d) { return color(d.lastName); })
        .attr("r", 5)
        .attr("x", width/2)
        .attr("y", height/2)
        .merge(node)
        .call(d3.drag()
          .on("start", function(d) {dragstarted(d, simulation);})
          .on("drag", dragged)
          .on("end", function(d) {dragended(d, simulation);}));

      node.append("title")
        .text(function(d) { return d.name; });

      // Apply the general update pattern to the links.
      link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
      link.exit().remove();
      link = link.enter()
        .append("line")
        .style("stroke-width", 1)
        .style("stroke", function(d) { return d.color; })
        .merge(link);

      // Update and restart the simulation.
      simulation.nodes(nodes);
      simulation.force("link").links(links);
    }

    function ticked() {
      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })

      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
    }
  });

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

  function dragstarted(d, sim) {
    if (!d3.event.active) sim.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d, sim) {
    if (!d3.event.active) sim.alphaTarget(0);
    d.fx = null;
    d.fy = null;
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

}
