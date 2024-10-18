function Lineage() {

  function lin(conf) {
    log("Initializing", conf);
    initNightMode();
    config = conf;
    
    // Initialize startDate, lastDate, and firstDate in Date format
    config.startDate = new Date(config.startDate);
    config.lastDate = new Date(config.lastDate);
    config.firstDate = findFirstDate(config.nodes); // Set earliest birth date
    
    currentTime = config.startDate; // Set the app to start at the configured start date
    initShowDead(config.showDead);
    document.getElementById('search').value = conf.filter;
  }

  // Will be overwritten by `lin()`
  var config = {
    startDate: '2014-01-01', // Change from startYear to startDate in the configuration (ISO format)
    lastDate: '2014-12-31',  // Change from endYear to lastDate in the configuration (ISO format)
    speed: 100,
    debug: false
  };

  timeStart('init', config);

  var showDead = true;

  // Constants for different time intervals (in milliseconds)
  const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
  const MS_IN_A_WEEK = 7 * MS_IN_A_DAY;
  const MS_IN_A_YEAR = 365.25 * MS_IN_A_DAY; // Approximation

  var currentTime = new Date(config.startDate); // Start from the configured start date
  var showDead = true;

  var CLUSTER_COL_SPACING = 10;
  var CLUSTER_ROW_SPACING = 40;

  var TIMELINE_SPEED = 0.8;

  var svg = d3.select("svg");
  var width = window.innerWidth,
      height = window.innerHeight,
      color = d3.scaleOrdinal(d3.schemeCategory10);

  var canvas = document.querySelector("canvas"),
      context = canvas.getContext("2d");

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
  var filters = $('#search').val();
  var searchRadius = 40;
  var simulation = d3.forceSimulation();
  var g = null;
  var users = [];
  var interval = null;
  var mode = 'tree';

  var forceRefresh = true;

  var zoom = d3.zoom()
      .scaleExtent([0.1, 5]) 
      .on("zoom", zoomed);

  d3.select("canvas").call(zoom);

  var transform = d3.zoomIdentity;

  function zoomed(event) {
    transform = event.transform;
    restart(); 
  }

  function initShowDead(value) {
    showDead = value;
    $('#showDead').prop('checked', showDead);
  }

  function go(response) {
    init(response);
    forceRefresh = true;
    if (interval != null) {
      interval.stop();
    }
    interval = d3.interval(loop, config.speed);
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

    users = d3.group(nodes, d => d.id);
    data = prepareData(data, filters);
    simulation = d3.forceSimulation(nodes);
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
    } else if (mode == 'timeline') {
      sim = getTimelineSimulation();
    } else if (mode == 'cluster') {
      sim = getClusterSimulation();
    }

    return [canvas, sim];
  }

  function getClusterSimulation() {
    simulation
      .force("charge", d3.forceManyBody().strength(-5))
      .force("centering", d3.forceCenter(0, 0))
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
      .force("centering", d3.forceCenter(0, 0))
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

  function mousemoved(event) {
    var m = d3.pointer(event, this);
    var d = simulation.find(m[0] - width / 2, m[1] - height / 2, searchRadius);
    if (!d) {
      hideMemberDetails();
    } else {
      highlightNode(d, m);
    }
  }

  function dragsubject() {
    return simulation.find(event.x - width / 2, event.y - height / 2, searchRadius);
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
    d3.select('#name').html(d.name + " " + d.lastName + "<br><span class='birthYear'>" + d.birthDate.substring(0, 4) + "</span>");
  }

  function setForceRefresh(value) {
    forceRefresh = value;
  }

  function loop() {
    timeStart("loop", config);
    resizeScreen();
    var oldDate = currentTime;
    currentTime = advanceTime(currentTime);

    updateFilter();

    if (currentTime != null && currentTime.getTime() !== oldDate.getTime()) {
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

  function advanceTime(currentTime) {

    var msIncrement;
    switch (config.timeStep) {
      case 'pause':
        msIncrement = 0
        break;
      case 'day':
        msIncrement = MS_IN_A_DAY;
        break;
      case 'week':
        msIncrement = MS_IN_A_WEEK;
        break;
      case 'year':
      default:
        msIncrement = MS_IN_A_YEAR;
        break;
    }

    if (config.pause == true) {
      msIncrement = 0;
    }

    var newTime = new Date(currentTime.getTime() + msIncrement);
    if (newTime.getTime() > config.lastDate.getTime()) {
      newTime = config.lastDate;
    }

    return newTime;
  }

  function addRemoveNode(n) {
    var birthDate = new Date(n.birthDate);
    if (nodes.indexOf(n) == -1 && birthDate <= currentTime) {
      nodes.push(n);
    } else if (nodes.indexOf(n) != -1 && birthDate > currentTime) {
      nodes.splice(nodes.indexOf(n), 1);
    }

    if (!showDead && n.deathDate != null) {
      var deathDate = new Date(n.deathDate);
      if (nodes.indexOf(n) != -1 && deathDate < currentTime) {
        nodes.splice(nodes.indexOf(n), 1);
      }
    }
  }

  function addRemoveLink(l) {
    if (
      links.indexOf(l) == -1 &&
      nodes.indexOf(l.source) > -1 &&
      nodes.indexOf(l.target) > -1
    ) {
      links.push(l);
    } else if (
      links.indexOf(l) > -1 &&
      (nodes.indexOf(l.source) == -1 || nodes.indexOf(l.target) == -1)
    ) {
      links.splice(links.indexOf(l), 1);
    }
  }

  function resetClusters(nodes) {
    clusters = [];
    var rowCount = 11;
    var colCount = 13;
    nodes.forEach(function(n, i) {
      if (clusters[n.lastName] == null) {
        var x = Math.round(i / colCount) + Math.round(i / colCount) * CLUSTER_COL_SPACING - width;
        var y = i % rowCount + Math.round(i % rowCount) * CLUSTER_ROW_SPACING - height;
        clusters[n.lastName] = { x: x, y: y };
      }
    });
    return clusters;
  }

  function findFirstDate(nodes) {
    if (!nodes || nodes.length === 0) {
      return new Date('1900-01-01'); 
    }
  
    return nodes.reduce((earliest, node) => {
      var birthDate = new Date(node.birthDate);
      return birthDate < earliest ? birthDate : earliest;
    }, new Date());
  }

  function updateFilter() {
    if (filters != $("#search").val()) {
      filters = $("#search").val();
      go(originalData);
    }
  }

  function prepareData(data, filters) {
    var filterItems = filters.split(" ");
    filterItems = filterItems.filter(function(i) {
      return i.length > 0;
    });
    for (var i = 0; i < data.nodes.length; i++) {
      if (!inFilter(data.nodes[i], filterItems)) {
        data.nodes.splice(i, 1);
        i--;
      }
    }

    data.links.forEach(function(link) {
      link.source = getNodeById(data.nodes, link.source);
      link.target = getNodeById(data.nodes, link.target);
    });
    return data;
  }

  function inFilter(node, filterItems) {
    if (filterItems.length == 0) {
      return true;
    }
    var regex = null;
    for (var i = 0; i < filterItems.length; i++) {
      regex = new RegExp(filterItems[i], 'ig');
      if (node.name.match(regex)) {
        return true;
      }
    }
    return false;
  }

  function updateYear(currentTime) {
    $('#year').html(currentTime.toUTCString())
      .css('left', width / 2 - 105)
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
    updateYear(currentTime);
    users = d3.group(nodes, d => d.id);

    context.save();
    context.translate(transform.x, transform.y); 
    context.scale(transform.k, transform.k);     

    simulation.nodes(nodes);
    if (mode == 'tree') {
      simulation.force("link").links(links);
    } else {
      simulation.force("link").links(links).strength(0);
    }
    simulation.alpha(1).restart();

    context.restore();
  }

  function clusterTicked() {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);    
    context.translate(width / 2, height / 2);

    var k = 0.1 * simulation.alpha;
    users.forEach(function(o) {
      var u = o[0];
      u.y += (clusters[u.lastName].y - u.y) * 0.08;
      u.x += (clusters[u.lastName].x - u.x) * 0.08;
    });

    users.forEach(function(user) {
      context.beginPath();
      user.forEach(drawNode);
      context.fillStyle = color(user[0].lastName);
      context.fill();
    });

    context.restore();
  }

  function treeTicked() {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(transform.x, transform.y); 
    context.scale(transform.k, transform.k);     
    context.translate(width / 2, height / 2);

    links.forEach(drawLink);

    users.forEach(function(user) {
      context.beginPath();
      user.forEach(drawNode);
      context.fillStyle = color(user[0].lastName);
      context.fill();
    });

    context.restore();
  }

  function timeTicked() {
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(transform.x, transform.y); 
    context.scale(transform.k, transform.k);     
    context.translate(width / 2, height / 2);

    users.forEach( function(user) {
      var d = user[0];
      var scale = ((d.birthDate.substring(0, 4) - 1900) / (2014 - 1900) - 0.5);
      d.x += (width * scale - d.x) * TIMELINE_SPEED;
    });

    users.forEach(function(user) {
      context.beginPath();
      user.forEach(drawNode);
      context.fillStyle = color(user[0].lastName);
      context.fill();
    });

    context.restore();
  }

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  function getNodeById(nodes, id) {
    for (var i = 0; i < nodes.length; i++) {
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
      var body = d3.select('body');
      var main = d3.select('main');
      var menu = d3.select('#menu');

      if (nightMode) {
        body.transition().duration(1000).style('background-color', '#000').style('color', '#EEE');
        main.transition().duration(1000).style('background-color', '#000').style('color', '#EEE');
        menu.transition().duration(1000).style('background-color', 'rgba(5, 5, 5, 0.75)').style('color', '#EEE');
        d3.select('#year').transition().duration(1000).style('color', '#EEE');
        d3.select('.toggle__button').transition().duration(1000).style('color', '#666').style('background-color', '#333');
      } else {
        body.transition().duration(1000).style('background-color', '#FFF').style('color', '#333');
        main.transition().duration(1000).style('background-color', '#FFF').style('color', '#333');
        menu.transition().duration(1000).style('background-color', 'rgba(250, 250 , 250, 0.75)').style('color', '#333');
        d3.select('#year').transition().duration(1000).style('color', '#222');
        d3.select('.toggle__button').transition().duration(1000).style('color', '#FFF').style('background-color', '#E7E7E7');
      }
    });
  }

  function timeStart(name, config) {
    if (config.debug) {
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
    d3.json(path).then(go);
  };

  lin.playMusic = function() {
    if ($('#musicOn').is(":checked")) {
      audio.play();
    }
  }

  lin.pauseMusic = function() {
    audio.pause();
  }

  lin.setYear = function(value) {
    console.log(value);
    currentTime = new Date(value);
    forceRefresh = true;
  }

  lin.setTimeStep = function(timeStep) {
    config.timeStep = timeStep;
    forceRefresh = true;
  }

  lin.setPause = function(value) {
    config.pause = value;
  }

  lin.moveYear = function(value) {
    currentTime.setFullYear(currentTime.currentTime.getFullYear());
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

  lin.setShowDead = function(value) {
    showDead = value;
    forceRefresh = true;
    reinit(originalData);
    loop();
  }

  lin.print = function() {
    console.log(links);
    console.log(nodes);
    console.log(simulation);
  }

  return lin;
}

