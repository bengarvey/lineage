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
  const scale = d3.scaleOrdinal(d3.schemeTableau10);

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

  function color(key) {
    key = key != null ? key.toLowerCase() : null;
    if (config.colorKeys[key])
      return config.colorKeys[key];
    else {
      return scale(key);
    }
  }

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
    timeStart('init', config);
    nodes = [];
    links = [];
    originalData = jQuery.extend(true, {}, response);
    data = response;

    users = d3.group(nodes, (d) => d.id);
    timeLog('init', config, "users");
    data = prepareData(data, filters);
    timeLog('init', config, "prep data");
    config.firstDate = new Date(findFirstDate(config.nodes));
    config.lastDate = new Date(findLastDate(config.nodes));
    timeLog('init', config, "data");

    config = initConfig(config);

    console.log(`${data.nodes.length} nodes`);
    console.log(`${data.links.length} links`);
    simulation = d3.forceSimulation(nodes);
    timeLog('init', config, "sim");
    [canvas, simulation] = getCanvasSimulation(mode);
    timeLog('init', config, "getSim");

    clusters = resetClusters(data.nodes);
    timeLog('init', config, "resetClusters");
    restart();
    timeEnd('init', config);
  }

  function initConfig(config) {
    const defaultTreeSim = {
      charge: -105,
      link: 0.2,
      alphaTarget: 1,
    };
  
    return {
      ...config,
      treeSim: {
        ...defaultTreeSim,
        ...config.treeSim,
      },
    };
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
      //.force('charge', d3.forceManyBody().strength(-45))
      .force('charge', d3.forceManyBody().strength(config.treeSim.charge))
      .force('centering', d3.forceCenter(0, 0))
      .force('link', d3.forceLink(links).distance(30).strength(config.treeSim.link))
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .alphaTarget(config.treeSim.alphaTarget)
      .on('tick', treeTicked);

    return simulation;
  }

  function getTimelineSimulation() {
    simulation
      .force('charge', d3.forceManyBody().strength(-5))
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
    d3.select('#name').html(`${d.id} ${d.description} ${showCategory(config.showCategory, d.category)} <br><span class='birthYear'>
    ${showCreatedAt(d.createdAt)} ${printLinks(d)}</span>`);
  }

  function printLinks(d) {
    printlinks = data.links.filter( link => link.source.id == d.id || link.target.id == d.id )
    return printlinks.map(link => link.description || "").join("<br>")
  }

  function showCreatedAt(createdAt) {
    if (createdAt) {
      return createdAt.substring(0, 10);
    }
    else {
      return '';
    }
  }

  function showCategory(showIt, category) {
    if (showIt) {
      return category;
    }
    return '';
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
    } else if ((nodes.indexOf(n) !== -1 && createdAt > currentTime)) {
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
    // Debug logging
    if (true) {
      console.log('Sample node:', dataOb.nodes[0]);
      console.log('Sample link before lookup:', {
        source: dataOb.links[0]?.source,
        target: dataOb.links[0]?.target,
        sourceType: typeof dataOb.links[0]?.source,
        targetType: typeof dataOb.links[0]?.target
      });
    }

    const nodeMap = new Map(dataOb.nodes.map(node => [node.id, node]));
    
    const filterPatterns = filterString.split(' ')
      .filter(i => i.length > 0)
      .map(pattern => new RegExp(pattern, 'ig'));

    const linkTotals = new Map(); 
    dataOb.links = dataOb.links.filter(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      
      if (source && target) {
        // Count links for each node
        linkTotals.set(source.id, (linkTotals.get(source.id) || 0) + 1);
        linkTotals.set(target.id, (linkTotals.get(target.id) || 0) + 1);
        
        // Update link references
        link.source = source;
        link.target = target;
        return true;
      }
      return false;
    });
  
    dataOb.nodes = dataOb.nodes.filter(node => {
      
      node.linkTotal = linkTotals.get(node.id);
      
      return (
        (!config.hideOrphans) && 
        (filterPatterns.length === 0 || matchesFilter(node, filterPatterns))
      );
    });

    return dataOb;
  }
  
  // Separate filter matching function for clarity and reuse
  function matchesFilter(node, patterns) {
    if (!node.description) return false;
    
    // Return true if any pattern matches
    return patterns.some(regex => {
      regex.lastIndex = 0; // Reset regex state
      return regex.test(node.description);
    });
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

    context.lineWidth = 1;
    links.forEach(drawLink);

    users.forEach((user) => {
      context.beginPath();
      drawNode(user[0]);
      context.fillStyle = color(user[0].category);
      context.fill();
    });

    // Map nodes to unique categories with color and label
    const nodeCategories = Array.from(
      new Map(
        nodes.map(node => [node.category, { color: color(node.category), label: node.category }])
      ).values()
    );

    // Map links to unique relations with color and label
    const linkRelations = Array.from(
      new Map(
        links.map(link => [link.color, { color: color(link.color), label: link.color }])
      ).values()
    );

    if (config.showLegend) {
      drawLegend(
        {
          nodeCategories: nodeCategories, 
          linkRelations: linkRelations
        });
    }

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
      if (d.createdAt !== null) {
        const d = user[0];
        const createdAt = new Date(d.createdAt);
        const daysFromStart = (createdAt - startDate) / (1000 * 60 * 60 * 24);
        const scale = (daysFromStart / totalDays) - 0.5;
        d.x += (width * scale - d.x) * TIMELINE_SPEED;

        context.beginPath();
        user.forEach(drawNode);
        context.fillStyle = color(user[0].category);
        context.fill();
      }
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
    // Define the size and angle of the arrowhead
    const arrowLength = 10; // Length of the arrowhead
    const arrowWidth = 6; // Width of the arrowhead
  
    // Calculate the angle of the link
    const dx = d.target.x - d.source.x;
    const dy = d.target.y - d.source.y;
    const angle = Math.atan2(dy, dx);
  
    // Calculate the length of the link line
    const linkLength = Math.sqrt(dx * dx + dy * dy);
  
    // Calculate the end of the line (just before the arrowhead)
    const endX = d.target.x - (arrowLength * Math.cos(angle));
    const endY = d.target.y - (arrowLength * Math.sin(angle));
  
    // Draw the main link line
    context.beginPath();
    context.moveTo(d.source.x, d.source.y);
    context.lineTo(endX, endY);
    context.strokeStyle = color(d.color);
    context.stroke();
  
    // Draw the arrowhead
    context.beginPath();
    context.moveTo(endX, endY); // Tip of the arrow
    context.lineTo(
      endX - arrowWidth * Math.cos(angle - Math.PI / 6),
      endY - arrowWidth * Math.sin(angle - Math.PI / 6)
    );
    context.lineTo(
      endX - arrowWidth * Math.cos(angle + Math.PI / 6),
      endY - arrowWidth * Math.sin(angle + Math.PI / 6)
    );
    context.closePath();
    context.fillStyle = color(d.color);
    context.fill();
  }
  

  /*
  function drawLink(d) {
    context.beginPath();
    context.moveTo(d.source.x, d.source.y);
    context.strokeStyle = color(d.color);
    context.lineTo(d.target.x, d.target.y);
    context.stroke();
  }
  */

  function drawLegend(options) {
    const {
      nodeCategories, // Array of node categories with { color, label }
      linkRelations,  // Array of link relations with { color, label }
      x = 300,         // X-coordinate for the legend's top-left corner
      y = -350,         // Y-coordinate for the legend's top-left corner
      padding = 7,   // Padding inside the legend
      fontSize = 12,  // Font size for text
      boxSize = 15,   // Size of the color boxes
      columnSpacing = 135, // Space between columns
    } = options;
  
    // Ensure the global context is available
    if (!context) {
      throw new Error("No global drawing context found.");
    }
  
    // Calculate column positions
    const nodeColumnX = x + padding;
    const linkColumnX = x + columnSpacing;
  
    // Determine the maximum width of labels
    const maxNodeLabelWidth = Math.max(
      ...nodeCategories.map(c => context.measureText(c.label).width)
    );
    const maxLinkLabelWidth = Math.max(
      ...linkRelations.map(r => context.measureText(r.label).width)
    );
  
    // Calculate legend width and height
    const legendWidth = Math.max(
      maxNodeLabelWidth,
      maxLinkLabelWidth
    ) + boxSize + padding * 2 + columnSpacing;
    const legendHeight =
      Math.max(nodeCategories.length, linkRelations.length) * (boxSize + padding) +
      padding * 2;
  
    // Draw the background for the legend
    /*
    context.fillStyle = "white";
    context.fillRect(x, y, legendWidth, legendHeight);
    context.strokeStyle = "black";
    context.strokeRect(x, y, legendWidth, legendHeight);
    */
  
    // Set font for the legend
    context.font = `${fontSize}px sans-serif`;
    context.fillStyle = "black";
    let currentNodeY = y + padding;
    let currentLinkY = y + padding;
  
    // Draw node category legend in the left column
    nodeCategories.forEach(category => {
      // Draw the color box
      context.fillStyle = category.color;
      context.fillRect(nodeColumnX, currentNodeY, boxSize, boxSize);
  
      // Draw the label
      context.fillStyle = "black";
      context.fillText(
        category.label,
        nodeColumnX + boxSize + padding,
        currentNodeY + boxSize - 2
      );
  
      currentNodeY += boxSize + padding;
    });
  
    // Draw link relation legend in the right column
    linkRelations.forEach(relation => {
      // Draw the arrowed line
      const startX = linkColumnX;
      const startY = currentLinkY + boxSize / 2;
      const endX = startX + boxSize * 2;
      const endY = startY;
  
      // Draw line
      context.strokeStyle = relation.color;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();
  
      // Draw arrowhead
      const arrowLength = 6;
      const arrowWidth = 4;
      context.beginPath();
      context.moveTo(endX, endY);
      context.lineTo(endX - arrowLength, endY - arrowWidth);
      context.lineTo(endX - arrowLength, endY + arrowWidth);
      context.closePath();
      context.fillStyle = relation.color;
      context.fill();
  
      // Draw the label
      context.fillStyle = "black";
      context.fillText(
        relation.label,
        linkColumnX + boxSize * 2 + padding,
        currentLinkY + boxSize - 2
      );
  
      currentLinkY += boxSize + padding;
    });
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

  function timeLog(name, conf, message) {
    if (conf.debug) {
      console.timeLog(name, message);
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

  lin.setFirst = function () {
    config.firstDate = findFirstDate(nodes);
    currentTime = new Date(config.firstDate);
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
