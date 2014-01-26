function start() {

  var zoomLevel = 1;
  var slider = null;
  var width = window.innerWidth / zoomLevel,
      height = window.innerHeight / zoomLevel;
  var fill = d3.scale.category20();
  var startYear = 1900;
  var currentYear = startYear;
  var lastYear = 2014;
  var timeVector = 0;
  var visibleNodes = [];
  var allNodes = [];
  var tickDuration = 1000;

  var json = $.getJSON("data/familyData.json", function(json) {
    allLinks = json.links;
    allNodes = json.nodes;

    startYears = allNodes.map( function(d) { return d.birthYear; } )
    startYear  = Math.min.apply(Math, startYears);
    currentYear = startYear;

    // Initialize the slider
    d3.select('#timeline').call( 
      slider = d3.slider().axis(true).min(startYear).max(lastYear).step(1)
        .value(currentYear)
        .on("slide", function(event, value) {
          currentYear = value;
        })
    );

    // link directly instead of using indices
    allLinks.forEach( function(link, index) {
        
        // Check to see if these links point to valid nodes
        if (typeof(allNodes[link.target]) !== "undefined" && (typeof(allNodes[link.source])) !== "undefined") {
            link.source = allNodes[link.source];
            link.target = allNodes[link.target];
        }
    });

  });
  
  var visibleLinks = [];
  var allLinks = [];
  allNodes.forEach( function(node, index) {
      if (node.year <= startYear) {
          visibleNodes.push(node);
      }
  });
      
  var colors = d3.scale.category20();

  var force = d3.layout.force()
      .size([width, height])
      .nodes(visibleNodes) // initialize with a single node
      .links(visibleLinks)
      .linkDistance(30)
      .charge(-60)
      .on("tick", tick);


  var svg = d3.select("body").append("svg")
      .attr("id", "screen")
      .attr("width", width)
      .attr("height", height);

  svg.append("rect")
      .attr("width", width)
      .attr("height", height);

  var nodes = force.nodes(),
      links = force.links(),
      node = svg.selectAll(".node"),
      link = svg.selectAll(".link");

  var cursor = svg.append("circle")
      .attr("r", 30)
      .attr("transform", "translate(-100,-100)")
      .attr("class", "cursor");

  var feed = [];
  var addedNodeThisYear = false;
  var lockSearch = true;

  restart();

  var stopCode = setInterval(function() {
    console.log(tickDuration); 
  // Check to see if we should add any new nodes that aren't already in there
  allNodes.forEach( function(node, index) {
          if (node.birthYear != "" && node.birthYear <= currentYear && nodes.indexOf(node) == -1 && (!lockSearch || allowNodeFromSearch(node))) {
            nodes.push(node);
  
            if (!addedNodeThisYear) {
              //addToFeed( { name: currentYear, lastName: "black" } );
              addedNodeThisYear = true;
            }
            
          }
          else if ((node.birthYear > currentYear || (lockSearch && !allowNodeFromSearch(node))) && nodes.indexOf(node) != -1) {
            nodes.splice( nodes.indexOf(node), 1);
          }
      });

  allLinks.forEach( function(link, index) {
      
      // Should this link be visible yet?
      if (nodes.indexOf(link.source) != -1 && nodes.indexOf(link.target) != -1 && links.indexOf(link) == -1) {
        links.push(link);   
      } 
      else if ( (nodes.indexOf(link.source) == -1 || nodes.indexOf(link.target) == -1) && links.indexOf(link) != -1) {
        // This link should be removed now
        links.splice(links.indexOf(link, 1)); 
      }
  });
      currentYear += timeVector;
      addedNodeThisYear = false;
      slider.slide_to(currentYear);
     
      if (currentYear < 2020) {
        restart();
      }
      else {
        force.stop();
        clearInterval(stopCode);
      }
  }, tickDuration);

  function tick() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .style("stroke", function(d) { return d.color; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .style("stroke-width", 1)
        .style("fill", function(d) { 
            return colors(d.lastName);
        });

    height = window.innerHeight / zoomLevel;
    width = window.innerWidth / zoomLevel;
    svg.attr("height", height)
      .attr("width", width);
    force.size([width, height]); 
    $('#year').html(currentYear)
      .css('left', width/2 - 105)
      .css('top', height - 140);

  }

  function restart() {
    link = link.data(links);

    link.enter().insert("line", ".node")
        .attr("class", "link");

    link.exit().remove();
    node = node.data(nodes);

    node.enter()
        .insert("circle")
        .attr("class", "node")
        .attr("r", 5)
        .on("mouseover", function(d) { 

          d3.select(this).transition().duration(100).attr('r',10);

          d3.select('#memberDetails')
            .transition()
            .duration(500)
            .style('display', 'block')
            .style('top', d.y - 20)
            .style('left', d.x + 20);

          d3.select('#name').html(d.name + "<br><span class='birthYear'>" + d.birthYear + "</span>");
        })
        .on("mouseout", function(d) {
          d3.select(this).transition().duration(100).attr('r', 5);
          d3.select('#memberDetails').style('display', 'none');            
        })
        .call(force.drag);

    if ($('#search').val() != "") { 
      checkForSearch();
    }

    node.exit().attr('opacity', 1).transition().duration(500).attr('opacity', 0).remove();
    force.start();
  }

  function addToFeed(node) {
    
    d3.selectAll('ul')
      .append('li')
      .text(node.name)
      .style('color', '#FFFFFF')
      .transition()
      .duration(500)
      .style('color', colors(node.lastName));
  }

var audio = new Audio('music/graph.mp3');
$('#timeNavigation').find('#firstButton')
  .click(function() {
      currentYear = startYear;
      timeVector = 0;
    }
  );

$('#timeNavigation').find('#previousButton')
  .click(function() {
      timeVector = 0;
      currentYear--;
    }
  );

$('#timeNavigation').find('#playButton')
  .click(function() {
      timeVector = 1;
      if ($('#musicOn').is(":checked")) { 
        audio.play();  
      }
    }
  );

$('#timeNavigation').find('#pauseButton')
  .click(function() {
      force.stop();
      timeVector = 0;
      audio.pause();
    }
  );

$('#timeNavigation').find('#nextButton')
  .click(function() {
      timeVector = 0;
      currentYear++;
    }
  );

$('#timeNavigation').find('#lastButton')
  .click(function() {
      currentYear = 2014;
      timeVector = 0;
    }
  );

$('#timeNavigation').find('#search')
  .on("keyup", function() {
      checkForSearch();
    }
  );

$('#lockSearch').on("change", function(event) {
    lockSearch = !lockSearch;
});  

var nightMode = false;
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


d3.select('#timeNavigation')
  .on('mouseover', function(d) {
    d3.select(this)
    .transition()
    .duration(500)
    .style("left", 0);
  })
  .on('mouseout', function(d) {
    d3.select(this)
    .transition()
    .duration(500)
    .style("left", -890);
  });

function allowNodeFromSearch(node) {
  var searchText = $('#search').val();

  if (typeof(searchText) == 'undefined' || searchText == "") {
    searchText = "";
  }

  if (searchText == "") {
    return true;
  }

  // Split the string into an array if there are spaces
  // since we may be search for mulitple values
  var searchList = searchText.split(" ");
  var found = false;
  searchList.forEach( function(item) {
    if (item != "" && node.name.indexOf(item) != -1) {
      found = true;
    }
  });
  return found;
}

function checkForSearch() {
  // Grab the search string from the input form
  var searchText = $('#search').val();

  if (typeof(searchText) == 'undefined') {
    searchText = "";
  }

  if (searchText == "") {
    return true;
  }

  // Split the string into an array if there are spaces
  // since we may be search for mulitple values
  var searchList = searchText.split(" ");

  // Search through all nodes for this string
  node.attr('opacity', function(d) {            
    var found = false;
    searchList.forEach( function(item) {
      if (item != "" && d.name.indexOf(item) != -1) {
        found = true;
      }
    });
    return found ? 1 : 0.3;
  });
  
  link.attr('opacity', function(d) {
    var found = false;
    searchList.forEach( function(item) {
      if (item != "" && d.source.name.indexOf(item) != -1 || d.target.name.indexOf(item) != -1) { 
        found = true;
      }
    });
    return found ? 1 : 0.3;
  });

}

}


