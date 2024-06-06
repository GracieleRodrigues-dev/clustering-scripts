import hcluster from 'hclusterjs';
import dataset from '../dataset.json' assert { type: 'json' };

const formatedDataset = dataset
  .map(item => item.area)
  .splice(0, 100)
  .map((area, i) => ({
    name: `.`,
    position: [area]
  }));

const colorCluster = (window.colorCluster = hcluster()
  .distance('euclidean')
  .linkage('avg')
  // .verbose(true)
  .data(formatedDataset));

const height = 2000;
const width = 500;

const svg = d3
  .select('#container')
  .append('svg')
  .attr('width', width + 300)
  .attr('height', height + 60)
  .append('g')
  .attr('transform', 'translate(30,30)');

const cluster = d3.layout.cluster().size([height, width]);
d3.svg.diagonal().projection(function (d) {
  return [d.y, d.x];
});

const nodes = cluster.nodes(colorCluster.tree());
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
