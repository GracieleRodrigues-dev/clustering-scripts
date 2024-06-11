import hcluster from 'hclusterjs';
import dataset from '../dataset.json' assert { type: 'json' };

const width = 500;
const height = 500;

const dendrogramEl = document.querySelector('#dendrogram');
const selectSizeEl = document.querySelector('#select-size');
const selectPresetEl = document.querySelector('#select-preset');
const nClustersLabelEl = document.querySelector('#n-clusters');

const dimensions = dataset.map(item => ({
  name: '',
  position: [item.area]
}));

const shapes = dataset.map(item => ({
  name: '',
  position: [
    item.fator_forma_1,
    item.fator_forma_2,
    item.fator_forma_3,
    item.fator_forma_4
  ]
}));

const colors = dataset.map(item => ({
  name: '',
  position: [
    item.RR_media,
    item.RG_media,
    item.RB_media,
    item.RR_dev,
    item.RG_dev,
    item.RB_dev,
    item.RR_inclinacao,
    item.RG_inclinacao,
    item.RB_inclinacao,
    item.RR_curtose,
    item.RG_curtose,
    item.RB_curtose,
    item.RR_entropia,
    item.RG_entropia,
    item.RB_entropia,
    item.RR_all,
    item.RG_all,
    item.RB_all
  ]
}));

const presets = {
  shapes,
  colors,
  dimensions
};

const setupDendrogram = (preset, size = 10) => {
  const hierarchicalCluster = (window.hierarchicalCluster = hcluster()
    .distance('euclidean')
    .linkage('avg')
    .data(preset.slice(0, +size)));

  const svg = d3
    .select(dendrogramEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(10, 10)')
    .append('g');

  const cluster = d3.layout.cluster().size([height, width]);
  d3.svg.diagonal().projection(function (d) {
    return [d.y, d.x];
  });

  const nodes = cluster.nodes(hierarchicalCluster.tree());
  const links = cluster.links(nodes);

  const elbow = function (d, i) {
    return (
      'M' + d.source.y + ',' + d.source.x + 'V' + d.target.x + 'H' + d.target.y
    );
  };

  const x = d3.scale
    .linear()
    .domain(
      d3.extent(nodes, function (d) {
        return d.height;
      })
    )
    .range([width, 0]);
  nodes.forEach(function (d, ndx) {
    d.y = x(d.height);
  });

  svg
    .selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('stroke', 'black')
    .attr('stroke-width', '1.5px')
    .attr('d', elbow);

  const node = svg
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', function (d) {
      return 'translate(' + d.y + ',' + d.x + ')';
    });
  node
    .append('circle')
    .style('stroke', 'none')
    .style('fill', function (d) {
      return d.position ? 'rgb(' + d.position.join(',') + ')' : '#777';
    })
    .attr('r', function (d) {
      return d.children ? 1.5 : 5.5;
    });
  node
    .append('text')
    .attr('dx', 6)
    .attr('dy', 2)
    .text(function (d) {
      return d.children ? '' : d.name;
    });

  const distances = nodes.map(node => node.height);
  const bestCutoff = findElbowPoint(distances);
  drawCutoffLine(svg, nodes, bestCutoff);
  markClusters(svg, nodes, bestCutoff);

  nClustersLabelEl.textContent = `N° de clusters: ${countClusters(
    nodes,
    bestCutoff
  )}`;
};

const findElbowPoint = distances => {
  const sortedDistances = distances.sort((a, b) => a - b);
  let maxDistanceDiff = 0;
  let bestCutoff = 0;

  for (let i = 1; i < sortedDistances.length - 1; i++) {
    const distanceDiff = sortedDistances[i + 1] - sortedDistances[i];
    if (distanceDiff > maxDistanceDiff) {
      maxDistanceDiff = distanceDiff;
      bestCutoff = sortedDistances[i];
    }
  }

  return bestCutoff;
};

const drawCutoffLine = (svg, nodes, cutoff) => {
  const x = d3.scale
    .linear()
    .domain(
      d3.extent(nodes, function (d) {
        return d.height;
      })
    )
    .range([width, 0]);

  const cutoffX = x(cutoff);

  svg
    .append('line')
    .attr('x1', cutoffX)
    .attr('y1', 0)
    .attr('x2', cutoffX)
    .attr('y2', height)
    .attr('stroke', 'red')
    .attr('stroke-width', 2);
};

const markClusters = (svg, nodes, cutoff) => {
  const clusters = nodes.filter(node => node.height <= cutoff);
  clusters.forEach(cluster => {
    svg
      .append('circle')
      .attr('cx', cluster.y)
      .attr('cy', cluster.x)
      .attr('r', 3)
      .attr('fill', 'red');
  });
};

const countClusters = (nodes, cutoff) => {
  const clusters = nodes.filter(node => node.height <= cutoff);
  return clusters.length;
};

setupDendrogram(presets.dimensions);

selectPresetEl.addEventListener('change', e => {
  const size = selectSizeEl.value;
  const { value } = e.target;

  dendrogramEl.innerHTML = '';
  setupDendrogram(presets[value], size);
});

selectSizeEl.addEventListener('change', e => {
  const preset = selectPresetEl.value;
  const { value } = e.target;

  dendrogramEl.innerHTML = '';
  setupDendrogram(presets[preset], value);
});
