function Lineage() {

  function lin(conf) {
    log("Initializing", config);
    initNightMode();
    initSlider();
    config = conf;
    year = config.startYear;
    document.getElementById('search').value = conf.filter;
  }

  var config = {
    startYear:2014,
    endYear: 2014,
    speed: 100,
    debug: false
  };

  timeStart('init', config);

  var year = 1800;

  var CLUSTER_COL_SPACING = 10;
  var CLUSTER_ROW_SPACING = 40;

  var TIMELINE_SPEED = 0.8;

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
      clusters = [],
      data = {},
      originalData = {};

  var canvas = d3.select("canvas")
      .attr("id", "screen")
      .attr("width", width)
      .attr("height", height);

  var audio = new Audio('music/graph.mp3');
  var yearIncrement = 0;
  var filters = $('#search').val();
  var searchRadius = 40;
  var simulation = d3.forceSimulation();
  var g = null;
  var users = [];
  var interval = null;
  var forceRefresh = true;
  var mode = 'tree'

  function go(error, response) {
    if (error) throw error;

    init(response);
    forceRefresh = true;
    if (interval != null) {
      interval.stop();
    }
    interval = d3.interval(loop, config.speed, d3.now());
  }

  function reinit(response) {
    links = [];
    [canvas, simulation] = getCanvasSimulation(mode);
    restart();
 }

 function init(response) {
    nodes = [];
    links = [];
    originalData = jQuery.extend(true, {}, response);
    data = response;

    users = d3.nest()
      .key(function(d) { return d.id; })
      .entries(nodes);

    data = prepareData(data, filters);
    simulation - d3.forceSimulation(nodes);
    [canvas, simulation] = getCanvasSimulation(mode);

    clusters = resetClusters(data.nodes);
    restart();

    timeEnd('init', config);
  }

  function getCanvasSimulation(mode) {

    canvas
      .on("mousemove", mousemoved)
      .call(d3.drag()
        .container(document.querySelector("canvas"))
          .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    var sim = null;
    if (mode == 'tree') {
      sim = getTreeSimulation();
    }
    else if (mode == 'timeline') {
      sim = getTimelineSimulation();
    }
    else if (mode == 'cluster') {
      sim = getClusterSimulation();
    }

    return [canvas, sim];
  }

  function getClusterSimulation() {
    simulation
      .force("charge", d3.forceManyBody().strength(-5))
      .force("centering", d3.forceCenter(0,0))
      .force("link", d3.forceLink([]).strength(-1))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(1)
      .on("tick", clusterTicked);

    return simulation;
  }


  function getTreeSimulation() {
    simulation
      .force("charge", d3.forceManyBody().strength(-50))
      .force("centering", d3.forceCenter(0,0))
      .force("link", d3.forceLink(links).distance(30).strength(0.5))
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(1)
      .on("tick", treeTicked);

    return simulation;
  }

  function getTimelineSimulation() {
    simulation
      .force("charge", d3.forceManyBody().strength(-5))
      .force("link", d3.forceLink([]).strength(-1))
      .force("y", d3.forceY())
      .force("x", d3.forceX(0))
      .alphaTarget(0.5)
      .on("tick", timeTicked);

    return simulation;
  }

  function mousemoved() {
    var a = this.parentNode, m = d3.mouse(this), d = simulation.find(m[0] - width / 2, m[1] - height / 2, searchRadius);
    if (!d) {
      hideMemberDetails(); 
    }
    else {
      highlightNode(d, m);
    }
  }

  function dragsubject() {
    return simulation.find(d3.event.x - width / 2, d3.event.y - height / 2, searchRadius);
  }

  function hideMemberDetails() {
    d3.selectAll("#memberDetails")
      .style('display', 'none');
  }

  function highlightNode(d, m) {
    d3.selectAll('#memberDetails')
      .style('display', 'block')
      .style('top', m[1] - 20)
      .style('left', m[0] + 20);
    d3.select('#name').html(d.name + "<br><span class='birthYear'>" + d.birthDate.substring(0,4) + "</span>");
  }


  function setForceRefresh(value) {
    forceRefresh = value;
  }

  function loop() {
    timeStart("loop", config);
    resizeScreen();
    var oldYear = year;
    year = advanceYear(year);
    updateSlider();
    updateFilter();

    if (year != oldYear) {
      forceRefresh = true;
    }

    if (forceRefresh) {
      data.nodes.forEach(addRemoveNode);
      if (mode == 'tree') {
        data.links.forEach(addRemoveLink);
      }
    }


    restart();
    timeEnd("loop", config);
    forceRefresh = false;
  }

  function resetClusters(nodes) {
    clusters = [];
    rowCount = 11;
    colCount = 13;
    nodes.forEach( function(n, i) {
      if(clusters[n.lastName] == null) {
        var x = Math.round(i / colCount) + Math.round(i/colCount)*CLUSTER_COL_SPACING - width;
        var y = i % rowCount + Math.round(i%rowCount)*CLUSTER_ROW_SPACING - height;
        clusters[n.lastName] = {x: x, y: y};
      }
    });
    return clusters;
  }

  function advanceYear(year) {
    year += yearIncrement;
    if (year >= config.endYear) {
      year = config.endYear;
    }
    return year;
  }

  function updateFilter() {
    if (filters != $("#search").val()) {
      filters = $("#search").val();
      go(null, originalData);
    }
  }

  function updateSlider() {
    position = ((year - config.startYear) / (config.endYear - config.startYear)) * 100;
    $("#yearSlider").val(position);
  }

  function initSlider() {
    $('#yearSlider').on('change', function(){
      position = $("#yearSlider").val();
      year = Math.round(((config.endYear - config.startYear) * (position/100)) + config.startYear);
    });
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
    filterItems = filterItems.filter( function(i) {
      return i.length > 0;
    });
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

  function updateYear(year) {
    $('#year').html(year)
      .css('left', width/2 - 105)
      .css('top', height - 140);
  }

  function resizeScreen() {
    if (width != window.innerWidth) {
      height = window.innerHeight;
      width = window.innerWidth;
      canvas.attr("height", height)
        .attr("width", width);
    }
  }

  function restart() {
    updateYear(year);
    users = d3.nest()
      .key(function(d) { return d.id; })
      .entries(nodes);

    simulation.nodes(nodes);
    if (mode == 'tree') {
      simulation.force("link").links(links);
    }
    else {
      simulation.force("link").links(links).strength(0);
    }
    simulation.alpha(1).restart();
  }

  function clusterTicked() {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);

    var k = 0.1 * simulation.alpha;
    users.forEach(function(o, i) {
      u = o.values[0];
      u.y += (clusters[u.lastName].y - u.y) * 0.08;
      u.x += (clusters[u.lastName].x - u.x) * 0.08;
    });

    users.forEach(function(user) {
      context.beginPath();
      user.values.forEach(drawNode);
      context.fillStyle = color(user.values[0].lastName);
      context.fill();
    });

    context.restore();
  }

  function treeTicked() {
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
  }

  function timeTicked() {

    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);

    for(i=0; i<users.length; i++) {
      d = users[i].values[0];
      scale = ((d.birthDate.substring(0,4) - 1750) / (2020 - 1750) - 0.5);
      d.x += (width*scale - d.x) * TIMELINE_SPEED;
    }

    users.forEach(function(user) {
      context.beginPath();
      user.values.forEach(drawNode);
      context.fillStyle = color(user.values[0].lastName);
      context.fill();
    });

    context.restore();
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
    context.moveTo(d.x, d.y);
    context.arc(d.x, d.y, 5, 0, 2 * Math.PI);
  }

  function initNightMode() {
    $('#nightModeOn').on("change", function(event) {
        nightMode = !nightMode;
        body = d3.select('body');
        main = d3.select('main');
        menu = d3.select('#menu');

        if (nightMode) {
          body.transition().duration(1000).style('background-color', '#000').style('color', '#EEE');
          main.transition().duration(1000).style('background-color', '#000').style('color', '#EEE');
          menu.transition().duration(1000).style('background-color', 'rgba(5, 5, 5, 0.75)').style('color', '#EEE');
          d3.select('#year').transition().duration(1000).style('color', '#EEE');
          d3.select('.toggle__button').transition().duration(1000).style('color', '#666').style('background-color', '#333');
        }
        else {
          body.transition().duration(1000).style('background-color', '#FFF').style('color', '#333');
          main.transition().duration(1000).style('background-color', '#FFF').style('color', '#333');
          menu.transition().duration(1000).style('background-color', 'rgba(250, 250 , 250, 0.75)').style('color', '#333');
          d3.select('#year').transition().duration(1000).style('color', '#222');
          d3.select('.toggle__button').transition().duration(1000).style('color', '#FFF').style('background-color', '#E7E7E7');
        }
    });
  }

  function timeStart(name, config) {
    if (config.debug ) {
      console.time(name);
    }
  }

  function timeEnd(name, config) {
    if (config.debug) {
      console.timeEnd(name);
    }
  }

  function log(message, config) {
    if (config.debug) {
      console.log(message);
    }
  }

  lin.loadJson = function(path) {
    d3.json(path, go);
  }

  lin.playMusic = function() {
    if ($('#musicOn').is(":checked")) {
      audio.play();
    }
  }

  lin.pauseMusic = function() {
    audio.pause();
  }

  lin.setYear = function(value) {
    year = value;
    forceRefresh = true;
  }

  lin.moveYear = function(value) {
    year += value
    forceRefresh = true;
  }

  lin.setYearIncrement = function(value) {
    yearIncrement = value;
    forceRefresh = true;
  }

  lin.setMode = function(value) {
    mode = value;
    forceRefresh = true;
    reinit(originalData);
  }

  lin.print = function() {
    console.log(links);
    console.log(nodes);
    console.log(simulation);
  }

  return lin;
}
