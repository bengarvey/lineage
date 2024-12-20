/* globals

  d3

*/

function Lineage() {
  let config = {
    startDate: '2014-01-01',
    lastDate: '2014-12-31',
    speed: 100,
    debug: false,
  };

  timeStart('init', config);

  let showDead = true;

  const MS_IN_A_DAY = 24 * 60 * 60 * 1000;
  const MS_IN_A_WEEK = 7 * MS_IN_A_DAY;
  const MS_IN_A_MONTH = 30.437 * MS_IN_A_DAY; // Approximation
  const MS_IN_A_YEAR = 365.25 * MS_IN_A_DAY; // Approximation

  let currentTime = new Date(config.startDate);

  const CLUSTER_COL_SPACING = 10;
  const CLUSTER_ROW_SPACING = 40;

  const TIMELINE_SPEED = 0.8;

  let width = window.innerWidth;
  let height = window.innerHeight;
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  let context;
  if (document.querySelector('canvas')) {
    context = document.querySelector('canvas').getContext('2d');
  }
  let nightMode = false;

  let nodes = [];
  let links = [];
  let clusters = [];
  let data = {};
  let originalData = {};

  let canvas = d3.select('canvas')
    .attr('id', 'screen')
    .attr('width', width)
    .attr('height', height);

  const audio = new Audio('music/graph.mp3');
  let filters = $('#search').val();
  const searchRadius = 40;
  let simulation = d3.forceSimulation();

  let users = [];
  let interval = null;
  let mode = 'tree';

  let forceRefresh = true;

  const zoom = d3.zoom()
    .scaleExtent([0.1, 5])
    .on('zoom', zoomed);

  d3.select('canvas').call(zoom);

  let transform = d3.zoomIdentity;

  function lin(conf) {
    log('Initializing', conf);
    initNightMode();
    config = conf;

    config.startDate = new Date(config.startDate);

    currentTime = config.startDate;
    initShowDead(config.showDead);
    document.getElementById('search').value = conf.filter;
  }

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
    if (interval !== null) {
      interval.stop();
    }
    interval = d3.interval(loop, config.speed);
  }

  function reinit() {
    links = [];
    [canvas, simulation] = getCanvasSimulation(mode);
    restart();
  }

  function init(response) {
    nodes = [];
    links = [];
    originalData = jQuery.extend(true, {}, response);
    data = response;

    users = d3.group(nodes, (d) => d.id);
    data = prepareData(data, filters);
    config.firstDate = new Date(findFirstDate(config.nodes));
    config.lastDate = new Date(findLastDate(config.nodes));
    console.log(`${data.nodes.length} nodes`);
    console.log(`${data.links.length} links`);
    simulation = d3.forceSimulation(nodes);
    [canvas, simulation] = getCanvasSimulation(mode);

    clusters = resetClusters(data.nodes);
    restart();

    timeEnd('init', config);
  }

  function getCanvasSimulation(simulationMode) {
    console.log('getCanvasSim');
    canvas
      .on('mousemove', mousemoved)
      .call(d3.drag()
        .container(document.querySelector('canvas'))
        .subject(dragsubject)
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    let sim = null;
    if (simulationMode === 'tree') {
      sim = getTreeSimulation();
    } else if (simulationMode === 'timeline') {
      sim = getTimelineSimulation();
    } else if (simulationMode === 'cluster') {
      sim = getClusterSimulation();
    }

    return [canvas, sim];
  }

  function getClusterSimulation() {
    simulation
      .force('charge', d3.forceManyBody().strength(-10))
      .force('centering', d3.forceCenter(0, 0))
      .force('link', d3.forceLink([]).strength(-1))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .alphaTarget(1)
      .on('tick', clusterTicked);

    return simulation;
  }

  function getTreeSimulation() {
    simulation
      .force('charge', d3.forceManyBody().strength(-45))
      .force('centering', d3.forceCenter(0, 0))
      .force('link', d3.forceLink(links).distance(30).strength(0.2))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .alphaTarget(1)
      .on('tick', treeTicked);

    return simulation;
  }

  function getTimelineSimulation() {
    simulation
      .force('charge', d3.forceManyBody().strength(-2))
      .force('link', d3.forceLink([]).strength(-1))
      .force('y', d3.forceY())
      .force('x', d3.forceX(0))
      .alphaTarget(0.5)
      .on('tick', timeTicked);

    return simulation;
  }

  function mousemoved(event) {
    const [mouseX, mouseY] = d3.pointer(event, this);
    const transformedX = (mouseX - transform.x) / transform.k - width / 2;
    const transformedY = (mouseY - transform.y) / transform.k - height / 2;

    const d = simulation.find(transformedX, transformedY, searchRadius);
    if (!d) {
      hideMemberDetails();
    } else {
      highlightNode(d, [mouseX, mouseY]);
    }
  }

  function dragsubject(event) {
    return simulation.find(event.x - width / 2, event.y - height / 2, searchRadius);
  }

  function hideMemberDetails() {
    d3.selectAll('#memberDetails')
      .style('display', 'none');
  }

  function highlightNode(d, m) {
    d3.selectAll('#memberDetails')
      .style('display', 'block')
      .style('top', m[1] - 20)
      .style('left', m[0] + 20);
    d3.select('#name').html(`${d.description} ${d.category} <br><span class='birthYear'>${d.createdAt.substring(0, 10)}</span>`);
  }

  function loop() {
    timeStart('loop', config);
    resizeScreen();
    const oldDate = currentTime;
    currentTime = advanceTime(currentTime);

    updateFilter();
    if (currentTime !== null && currentTime.getTime() !== oldDate.getTime()) {
      forceRefresh = true;
    }
    if (forceRefresh) {
      data.nodes.forEach(addRemoveNode);
      if (mode === 'tree') {
        data.links.forEach(addRemoveLink);
      }
    }
    if (forceRefresh) {
      restart();
    }
    timeEnd('loop', config);
    forceRefresh = false;
  }

  function advanceTime(time) {
    let msIncrement;
    switch (config.timeStep) {
      case 'pause':
        msIncrement = 0;
        break;
      case 'day':
        msIncrement = MS_IN_A_DAY;
        break;
      case 'week':
        msIncrement = MS_IN_A_WEEK;
        break;
      case 'month':
        msIncrement = MS_IN_A_MONTH;
        break;
      case 'year':
      default:
        msIncrement = MS_IN_A_YEAR;
        break;
    }

    if (config.pause === true) {
      msIncrement = 0;
    }

    let newTime = new Date(time.getTime() + msIncrement);
    if (newTime.getTime() > config.lastDate.getTime()) {
      newTime = config.lastDate;
    }

    return newTime;
  }

  function addRemoveNode(n) {
    const createdAt = new Date(n.createdAt);
    if (nodes.indexOf(n) === -1 && createdAt <= currentTime) {
      nodes.push(n);
    } else if (nodes.indexOf(n) !== -1 && createdAt > currentTime) {
      nodes.splice(nodes.indexOf(n), 1);
    }

    if (!showDead && n.deletedAt !== null) {
      const deletedAt = new Date(n.deletedAt);
      if (nodes.indexOf(n) !== -1 && deletedAt < currentTime) {
        nodes.splice(nodes.indexOf(n), 1);
      }
    }
  }

  function addRemoveLink(l) {
    if (
      links.indexOf(l) === -1
      && nodes.indexOf(l.source) > -1
      && nodes.indexOf(l.target) > -1
    ) {
      links.push(l);
    } else if (
      links.indexOf(l) > -1
      && (nodes.indexOf(l.source) === -1 || nodes.indexOf(l.target) === -1)
    ) {
      links.splice(links.indexOf(l), 1);
    }
  }

  function resetClusters(clusterNodes) {
    clusters = [];
    const rowCount = 11;
    const colCount = 13;
    clusterNodes.forEach((n, i) => {
      if (clusters[n.category] == null) {
        const x = Math.round(i / colCount) + Math.round(i / colCount) * CLUSTER_COL_SPACING - width;
        const y = (i % rowCount) + Math.round(i % rowCount) * CLUSTER_ROW_SPACING - height;
        clusters[n.category] = { x, y };
      }
    });
    return clusters;
  }

  function findFirstDate(someNodes) {
    if (!someNodes || someNodes.length === 0) {
      return new Date('1900-01-01');
    }

    return nodes.reduce((earliest, node) => {
      const createdAt = new Date(node.createdAt);
      return createdAt < earliest ? createdAt : earliest;
    }, new Date());
  }

  function findLastDate(someNodes) {
    if (!someNodes || someNodes.length === 0) {
      return new Date();
    }

    return nodes.reduce((latest, node) => {
      const createdAt = new Date(node.createdAt);
      return createdAt > latest ? createdAt : latest;
    }, new Date());
  }

  function updateFilter() {
    if (filters !== $('#search').val()) {
      filters = $('#search').val();
      go(originalData);
    }
  }

  function mapColumns(dataOb) {
    const nodeMappings = config.nodeColumnMappings;
    dataOb.nodes.forEach((node, index) => {
      Object.keys(nodeMappings).forEach((key) => {
        if (key !== nodeMappings[key]) { // Skip if they're the same
          const value = nodeMappings[key];
          dataOb.nodes[index][key] = node[value];
          delete dataOb.nodes[index][value];
        }
      });
    });

    const linkMappings = config.linkColumnMappings;
    dataOb.links.forEach((link, index) => {
      Object.keys(linkMappings).forEach((key) => {
        if (key !== linkMappings[key]) { // Skip if they're the same
          const value = linkMappings[key];
          dataOb.links[index][key] = link[value];
          delete dataOb.links[index][value];
        }
      });
    });

    return dataOb;
  }

  function prepareData(dataOb, filterString) {
    dataOb = mapColumns(dataOb);
    let filterItems = filterString.split(' ');
    filterItems = filterItems.filter((i) => i.length > 0);
    dataOb.links.forEach((link) => {
      const source = getNodeById(data.nodes, link.source);
      const target = getNodeById(data.nodes, link.target);

      if (source !== -1 && target !== -1) {
        incrementLinkTotal(source);
        incrementLinkTotal(target);
      }

      link.source = source;
      link.target = target;
    });

    for (let i = 0; i < dataOb.nodes.length; i += 1) {
      if (!inFilter(dataOb.nodes[i], filterItems) || (dataOb.nodes[i].linkTotal === undefined && config.hideOrphans)) {
        dataOb.nodes.splice(i, 1);
        i -= 1;
      }
    }

    return data;
  }

  function incrementLinkTotal(node) {
    if (node.linkTotal === undefined) {
      node.linkTotal = 0;
    } else {
      node.linkTotal += 1;
    }
    return node;
  }

  function inFilter(node, filterItems) {
    if (filterItems.length === 0) {
      return true;
    }
    let regex = null;
    for (let i = 0; i < filterItems.length; i += 1) {
      regex = new RegExp(filterItems[i], 'ig');
      if (node.description != null && node.description.match(regex)) {
        return true;
      }
    }
    return false;
  }

  function updateYear(time) {
    $('#year').html(time.toDateString())
      .css('left', width / 2 - 105)
      .css('top', height - 140);
  }

  function resizeScreen() {
    if (width !== window.innerWidth) {
      height = window.innerHeight;
      width = window.innerWidth;
      canvas.attr('height', height)
        .attr('width', width);
    }
  }

  function restart() {
    updateYear(currentTime);
    users = d3.group(nodes, (d) => d.id);
    context.save();
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    simulation.nodes(nodes);
    if (mode === 'tree') {
      simulation.force('link').links(links);
    } else {
      simulation.force('link').links(links).strength(0);
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

    // const k = 0.1 * simulation.alpha;
    users.forEach((o) => {
      const u = o[0];
      u.y += (clusters[u.category].y - u.y) * 0.08;
      u.x += (clusters[u.category].x - u.x) * 0.08;
    });

    users.forEach((user) => {
      context.beginPath();
      user.forEach(drawNode);
      context.fillStyle = color(user[0].category);
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
    console.timeLog('tree', 'after transform');

    context.lineWidth = 1;
    links.forEach(drawLink);

    users.forEach((user) => {
      context.beginPath();
      drawNode(user[0]);
      context.fillStyle = color(user[0].category);
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

    const startDate = config.firstDate;
    const endDate = config.lastDate;
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

    users.forEach((user) => {
      const d = user[0];
      const createdAt = new Date(d.createdAt);
      const daysFromStart = (createdAt - startDate) / (1000 * 60 * 60 * 24);
      const scale = (daysFromStart / totalDays) - 0.5;
      d.x += (width * scale - d.x) * TIMELINE_SPEED;
    });

    users.forEach((user) => {
      context.beginPath();
      user.forEach(drawNode);
      context.fillStyle = color(user[0].category);
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

  function getNodeById(someNodes, id) {
    const nodeMap = new Map(someNodes.map(node => [node.id, node]));
    return nodeMap.get(id) || -1;
  }

  function drawLink(d) {
    context.beginPath();
    context.moveTo(d.source.x, d.source.y);
    context.strokeStyle = color(d.color);
    context.lineTo(d.target.x, d.target.y);
    context.stroke();
  }

  function drawNode(d) {
    context.moveTo(d.x, d.y);
    context.arc(d.x, d.y, 5, 0, 2 * Math.PI);
  }

  function initNightMode() {
    $('#nightModeOn').on('change', () => {
      nightMode = !nightMode;
      const body = d3.select('body');
      const main = d3.select('main');
      const menu = d3.select('#menu');

      if (nightMode) {
        body.transition().duration(1000).style('background-color', '#000').style('color', '#EEE');
        main.transition().duration(1000).style('background-color', '#000').style('color', '#EEE');
        menu.transition().duration(1000).style('background-color', 'rgba(5, 5, 5, 0.75)').style('color', '#EEE');
        d3.select('#year').transition().duration(1000).style('color', '#EEE');
        d3.select('.toggle__button').transition().duration(1000).style('color', '#666')
          .style('background-color', '#333');
      } else {
        body.transition().duration(1000).style('background-color', '#FFF').style('color', '#333');
        main.transition().duration(1000).style('background-color', '#FFF').style('color', '#333');
        menu.transition().duration(1000).style('background-color', 'rgba(250, 250 , 250, 0.75)').style('color', '#333');
        d3.select('#year').transition().duration(1000).style('color', '#222');
        d3.select('.toggle__button').transition().duration(1000).style('color', '#FFF')
          .style('background-color', '#E7E7E7');
      }
    });
  }

  function timeStart(name, conf) {
    if (conf.debug) {
      console.time(name);
    }
  }

  function timeEnd(name, conf) {
    if (conf.debug) {
      console.timeEnd(name);
    }
  }

  function log(message, conf) {
    if (conf.debug) {
      console.log(message);
    }
  }

  lin.loadJson = function (path) {
    d3.json(path).then(go);
  };

  lin.playMusic = function () {
    if ($('#musicOn').is(':checked')) {
      audio.play();
    }
  };

  lin.pauseMusic = function () {
    audio.pause();
  };

  lin.setYear = function (value) {
    currentTime = new Date(value);
    forceRefresh = true;
  };

  lin.setTimeStep = function (timeStep) {
    config.timeStep = timeStep;
    forceRefresh = true;
  };

  lin.setPause = function (value) {
    config.pause = value;
  };

  lin.setMode = function (value) {
    mode = value;
    forceRefresh = true;
    reinit(originalData);
  };

  lin.setShowDead = function (value) {
    showDead = value;
    forceRefresh = true;
    reinit(originalData);
    loop();
  };

  lin.print = function () {
    console.log(links);
    console.log(nodes);
    console.log(simulation);
  };

  return lin;
}
Lineage();
