function start() {
  console.log("start");
  var colors = d3.scaleOrdinal(d3.schemeCategory20);
  var svg = d3.select("svg");
  var width = window.innerWidth,
      height = window.innerHeight;

  var color = d3.scaleOrdinal(d3.schemeCategory20);

  var simulation = d3.forceSimulation()
      .force("link", d3.forceLink())
      .force("charge", d3.forceManyBody()
                        .strength(-20)
                        .distanceMax(height/6))
      .force("center", d3.forceCenter(width / 2, height / 2));

  var world = {};
  world.year = 1900;

  var graph = {};
  var visibleNodes = [];
  var visibleLinks = [];
  var node = null;
  var link = null;
  var visibleNodeMap = [];

  svg.attr("width", width).attr("height", height);


  d3.json("data/people.json", function(error, data) {
    if (error) throw error;

    graph = data;

    node = svg.append("g")
        .attr("class", "nodes");
    /*
    visibleNodes = graph.nodes.filter( function(n, index) {
      return new Date(n.birthDate).getFullYear() <= world.year;
    });

    visibleNodeMap = visibleNodes.map( function(node) { return node.id });

    visibleLinks = graph.links.filter( function(link, index) {
      console.log(visibleNodeMap.indexOf(link.source) > -1, visibleNodeMap.indexOf(link.target) > -1);
      return visibleNodeMap.indexOf(link.source) > -1 && visibleNodeMap.indexOf(link.target) > -1;
    });

    console.log(visibleNodes);
    console.log(visibleNodeMap);
    console.log(visibleLinks);

    // link directly instead of using indices
    visibleLinks.forEach( function(link, index) {
        // Check to see if these links point to valid nodes
        link.source = graph.nodes[link.source-1];
        link.target = graph.nodes[link.target-1];
    });

    svg.attr("width", width)
      .attr("height", height);

    var link = svg.append("g")
        .attr("class", "links")
      .selectAll("line")
      .data(visibleLinks)
      .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
        .style("stroke", function(d) { return d.color; });

    var node = svg.append("g")
        .attr("class", "nodes")
      .selectAll("circle")
      .data(visibleNodes)
      .enter().append("circle")
        .attr("r", 5)
        .attr("fill", function(d, i) { return color(d.lastName)})
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(function(d) { return d.name; });

    simulation
        .nodes(visibleNodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(visibleLinks);

    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }
    */
    setInterval(incrementYear, 2000);

    function incrementYear() {
      console.log("Incrementing year... ", world.year);
      world.year += 10;
      reFilter(graph, world);
      simulation.alphaTarget(0.3).restart();
    }
  });

  function reFilter(graph, world) {
    newNodes = graph.nodes.filter( function(n, index) {
      return visibleNodes.indexOf(n) == -1 && new Date(n.birthDate).getFullYear() <= world.year;
    });

    for (i=0; i<newNodes.length; i++) {
      visibleNodes.push(newNodes[i]);
    }

    /*
    visibleNodeMap = visibleNodes.map( function(node) { return node.id });

    visibleLinks = graph.links.filter( function(link, index) {
      return visibleNodeMap.indexOf(link.source) > -1 && visibleNodeMap.indexOf(link.target) > -1;
    });

    // link directly instead of using indices
    visibleLinks.forEach( function(link, index) {
        // Check to see if these links point to valid nodes
        link.source = graph.nodes[link.source-1];
        link.target = graph.nodes[link.target-1];
    });

    link = svg.append("g")
        .attr("class", "links")
      .selectAll("line")
      .data(visibleLinks)
      .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); })
        .style("stroke", function(d) { return d.color; })
      .exit().remove();
    */
    node = d3.select(".nodes").selectAll("circles")
      .data(visibleNodes, function(d) { return d.id;});

    node.exit().remove();
    node.enter().append("circle")
        .attr("r", 5)
        .attr("fill", function(d, i) { return color(d.lastName)})
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))

    console.log(visibleNodes.length);
    simulation.nodes(visibleNodes);
    //simulation.force("link").links(visibleLinks);
    simulation
      .nodes(visibleNodes)
      .on("tick", ticked);
    /*
    simulation.force("link")
        .links(visibleLinks);
    */

    function ticked() {
      /*
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      */
      node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }

  }

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

}
