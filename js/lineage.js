function Lineage() {

  function lin() {
    console.log("Initializing");
    initNightMode();
    initSlider();
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

  var audio = new Audio('music/graph.mp3');
  var startYear = 1800;
  var endYear = 2014;
  var year = 1800;
  var speed = 100;
  var yearIncrement = 0;
  var filters = $('#search').val();
  var searchRadius = 40;
  var simulation = null;
  var g = null;
  var users = [];
  var interval = null;
  var forceRefresh = true;
  initializeNav();


  function go(error, response) {
    if (error) throw error;

    init(response);
    forceRefresh = true;
    if (interval != null) {
      interval.stop();
    }
    interval = d3.interval(loop, speed, d3.now());
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

    canvas
      .on("mousemove", mousemoved)
      .call(d3.drag()
        .container(document.querySelector("canvas"))
          .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-5))
      .force("link", d3.forceLink(links).distance(30).strength(0.0))
      .force("y", d3.forceY())
      .alphaTarget(1)
      .on("tick", ticked);

    function dragsubject() {
      console.log("started");
      return simulation.find(d3.event.x - width / 2, d3.event.y - height / 2, searchRadius);
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

    node = canvas.selectAll(".node");
    link = canvas.selectAll(".link");
    restart();

    console.timeEnd('init');
  }

  function setForceRefresh(value) {
    forceRefresh = value;
  }

  function loop() {
    console.time("loop 10");
    var oldYear = year;
    year = advanceYear(year);
    updateSlider();
    updateFilter();

    if (year != oldYear) {
      forceRefresh = true;
    }

    console.time("loop 20");
    if (forceRefresh) {
      data.nodes.forEach(addRemoveNode);
      data.links.forEach(addRemoveLink);
    }

    restart();
    console.timeEnd("loop 10");
    console.timeEnd("loop 20");
    console.log("forceRefresh: " + forceRefresh);
    console.log("--------");
    forceRefresh = false;
  }

  function advanceYear(year) {
    year += yearIncrement;
    if (year >= endYear) {
      year = endYear;
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
    position = ((year - startYear) / (endYear - startYear)) * 100;
    $("#yearSlider").val(position);
  }

  function initSlider() {
    $('#yearSlider').on('change', function(){
      position = $("#yearSlider").val();
      year = Math.round(((endYear - startYear) * (position/100)) + startYear);
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
      //links.push(l);
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
    height = window.innerHeight;
    width = window.innerWidth;
    canvas.attr("height", height)
      .attr("width", width);
    console.log(width/2, height/2);
  }

  function restart() {
    updateYear(year);
    users = d3.nest()
      .key(function(d) { return d.id; })
      .entries(nodes);

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
  }

  function ticked() {

    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);

    for(i=0; i<users.length; i++) {
      d = users[i].values[0];
      scale = ((d.birthDate.substring(0,4) - 1750) / (2020 - 1750) - 0.5);
      d.x = width*scale;
    }

    links.forEach(drawLink);

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
          .transition()
          .style("left", 0 + "px");
      })
      .on('mouseout', function(d) {
        d3.select('#timeNavigation')
          .transition()
          .style("left", -890 + "px");
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

  return lin;
}
