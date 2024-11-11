/*
    D3.js Slider
    Inspired by jQuery UI Slider
    Copyright (c) 2013, Bjorn Sandvik - http://blog.thematicmapping.org
    BSD license: http://opensource.org/licenses/BSD-3-Clause
*/

d3.slider = function module() {
  // Public variables width default settings
  let min = 0;
  let max = 100;
  let step = 1;
  let animate = true;
  let orientation = 'horizontal';
  let axis = false;
  let margin = 50;
  let value;
  let div;
  let scale;

  // Private variables
  let axisScale;
  const dispatch = d3.dispatch('slide');
  const formatPercent = d3.format('.2%');
  const tickFormat = d3.format('.0');
  let sliderLength;

  function slider(selection) {
    selection.each(function () {
      // Create scale if not defined by user
      if (!scale) {
        scale = d3.scale.linear().domain([min, max]);
      }

      // Start value
      value = value || scale.domain()[0];

      // DIV container
      div = d3.select(this).classed(`d3-slider d3-slider-${orientation}`, true);

      const drag = d3.behavior.drag();

      // Slider handle
      const handle = div.append('a')
        .classed('d3-slider-handle', true)
        .attr('xlink:href', '#')
        .on('click', stopPropagation)
        .call(drag);

      // Horizontal slider
      if (orientation === 'horizontal') {
        div.on('click', onClickHorizontal);
        drag.on('drag', onDragHorizontal);
        handle.style('left', formatPercent(scale(value)));
        sliderLength = parseInt(div.style('width'), 10);
      } else { // Vertical
        div.on('click', onClickVertical);
        drag.on('drag', onDragVertical);
        handle.style('bottom', formatPercent(scale(value)));
        sliderLength = parseInt(div.style('height'), 10);
      }

      if (axis) {
        createAxis(div);
      }

      function createAxis(dom) {
        // Create axis if not defined by user
        if (typeof axis === 'boolean') {
          axis = d3.svg.axis()
            .ticks(Math.round(sliderLength / 100))
            .tickFormat(tickFormat)
            .orient((orientation === 'horizontal') ? 'bottom' : 'right');
        }

        // Copy slider scale to move from percentages to pixels
        axisScale = scale.copy().range([0, sliderLength]);
        axis.scale(axisScale);

        // Create SVG axis container
        const svg = dom.append('svg')
          .classed(`d3-slider-axis d3-slider-axis-${axis.orient()}`, true)
          .on('click', stopPropagation);

        const g = svg.append('g');

        // Horizontal axis
        if (orientation === 'horizontal') {
          svg.style('left', -margin);

          svg.attr({
            width: sliderLength + margin * 2,
            height: margin,
          });

          if (axis.orient() === 'top') {
            svg.style('top', -margin);
            g.attr('transform', `translate(${margin},${margin})`);
          } else { // bottom
            g.attr('transform', `translate(${margin},0)`);
          }
        } else { // Vertical
          svg.style('top', -margin);

          svg.attr({
            width: margin,
            height: sliderLength + margin * 2,
          });

          if (axis.orient() === 'left') {
            svg.style('left', -margin);
            g.attr('transform', `translate(${margin},${margin})`);
          } else { // right
            g.attr('transform', `translate(${0},${margin})`);
          }
        }

        g.call(axis);
      }

      // Move slider handle on click/drag
      function moveHandle(pos, val) {
        let newValue = 0;
        if (typeof val !== 'undefined') {
          newValue = val;
        } else {
          newValue = stepValue(scale.invert(pos / sliderLength));
        }

        if (value !== newValue) {
          const oldPos = formatPercent(scale(stepValue(value)));
          const newPos = formatPercent(scale(stepValue(newValue)));
          const position = (orientation === 'horizontal') ? 'left' : 'bottom';

          let from = val;
          if (d3.event != null) {
            from = d3.event.sourceEvent || d3.event;
          }

          dispatch.slide(from, value = newValue);

          if (animate) {
            handle.transition()
              .styleTween(position, () => d3.interpolate(oldPos, newPos))
              .duration((typeof animate === 'number') ? animate : 250);
          } else {
            handle.style(position, newPos);
          }
        }
      }

      // Calculate nearest step value
      function stepValue(val) {
        const valModStep = (val - scale.domain()[0]) % step;
        let alignValue = val - valModStep;

        if (Math.abs(valModStep) * 2 >= step) {
          alignValue += (valModStep > 0) ? step : -step;
        }

        return alignValue;
      }

      function onClickHorizontal(val) {
        let from = val;
        if (d3.event != null) {
          from = d3.event.offsetX || d3.event.layerX;
        }
        moveHandle(from, val);
      }

      function onClickVertical(val) {
        if (d3.event != null) {
          moveHandle(sliderLength - d3.event.offsetY || d3.event.layerY, val);
        }
      }

      function onDragHorizontal() {
        moveHandle(Math.max(0, Math.min(sliderLength, d3.event.x)));
      }

      function onDragVertical() {
        moveHandle(sliderLength - Math.max(0, Math.min(sliderLength, d3.event.y)));
      }

      function stopPropagation() {
        d3.event.stopPropagation();
      }
    });
  }

  // Getter/setter functions
  slider.min = function (_) {
    if (!arguments.length) return min;
    min = _;
    return slider;
  };

  slider.max = function (_) {
    if (!arguments.length) return max;
    max = _;
    return slider;
  };

  slider.step = function (_) {
    if (!arguments.length) return step;
    step = _;
    return slider;
  };

  slider.animate = function (_) {
    if (!arguments.length) return animate;
    animate = _;
    return slider;
  };

  slider.orientation = function (_) {
    if (!arguments.length) return orientation;
    orientation = _;
    return slider;
  };

  slider.axis = function (_) {
    if (!arguments.length) return axis;
    axis = _;
    return slider;
  };

  slider.margin = function (_) {
    if (!arguments.length) return margin;
    margin = _;
    return slider;
  };

  slider.value = function (_) {
    if (!arguments.length) return value;
    value = _;
    return slider;
  };

  slider.scale = function (_) {
    if (!arguments.length) return scale;
    scale = _;
    return slider;
  };

  slider.slide_to = function (newValue) {
    if (newValue > max) newValue = max;
    else if (newValue < min) newValue = min;

    // div = d3.select('#timeline');
    div.on('click')(newValue);
  };

  d3.rebind(slider, dispatch, 'on');

  return slider;
};
