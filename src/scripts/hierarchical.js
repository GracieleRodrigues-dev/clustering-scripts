import hcluster from 'hclusterjs';
import dataset from '../dataset.json' assert { type: 'json' };

const dimensions = dataset.splice(0, 100).map(item => ({
  name: ``,
  position: [item.area]
}));

const shapes = dataset.slice(0, 100).map(item => ({
  name: ``,
  position: [
    item.fator_forma_1,
    item.fator_forma_2,
    item.fator_forma_3,
    item.fator_forma_4
  ]
}));

const colors = dataset.slice(0, 100).map(item => ({
  name: ``,
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

const width = 500;
const height = 500;
const containerEl = document.querySelector('#container');
const selectPresetEl = document.querySelector('#preset');

const setupDendrogram = preset => {
  console.log({ preset });
  const hierarchicalCluster = (window.hierarchicalCluster = hcluster()
    .distance('euclidean')
    .linkage('avg')
    .data(preset));

  const svg = d3
    .select(containerEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
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
    .attr('stroke', '#AAA')
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
};

setupDendrogram(presets.dimensions);

selectPresetEl.addEventListener('change', e => {
  const { value } = e.target;

  containerEl.innerHTML = '';
  setupDendrogram(presets[value]);
});
