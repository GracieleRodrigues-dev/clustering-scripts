import hcluster from 'hclusterjs';
import dataset from '../data/dataset.json' assert { type: 'json' };

const width = 600;
const height = 600;
const loadingEl = document.querySelector('#loading');
const dendrogramEl = document.querySelector('#dendrogram');
const nClustersLabelEl = document.querySelector('#n-clusters');

const dendrogram = {
  show: () => (dendrogramEl.style.display = 'flex'),
  hide: () => (dendrogramEl.style.display = 'none')
};

const loading = {
  show: () => (loadingEl.style.display = 'flex'),
  hide: () => (loadingEl.style.display = 'none')
};

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

const disableFilters = (disabled = false) => {
  inputSizeEl.disabled = disabled;
  selectPresetEl.disabled = disabled;
  selectLinkageEl.disabled = disabled;
  selectDistanceEl.disabled = disabled;
  buttonExecuteEl.disabled = disabled;
};

const createHierarchicalCluster = () => {
  return new Promise((resolve, reject) => {
    try {
      const size = +inputSizeEl.value;
      const linkage = selectLinkageEl.value;
      const distance = selectDistanceEl.value;
      const preset = presets[selectPresetEl.value].slice(0, size);

      const hierarchicalCluster = (window.hierarchicalCluster = hcluster()
        .distance(distance)
        .linkage(linkage)
        .data(preset));

      resolve(hierarchicalCluster);
    } catch (error) {
      reject(error);
    }
  });
};

export const setupHierarchicalCluster = () => {
  if (inputSizeEl.value > 100) {
    dendrogram.hide();
    loading.show();
    disableFilters(true);
  }

  setTimeout(() => {
    createHierarchicalCluster()
      .then(hierarchicalCluster => {
        loading.hide();
        dendrogram.show();
        disableFilters(false);

        const svg = d3
          .select(dendrogramEl)
          .html('')
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
            'M' +
            d.source.y +
            ',' +
            d.source.x +
            'V' +
            d.target.x +
            'H' +
            d.target.y
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
console.log('Clustering hierarchy setup complete.');
      })
      .catch(error => console.error('Erro ao criar o cluster hierárquico:', error));
  }, 50);
};

const findElbowPoint = data => {
  let maxDistanceDiff = 0;
  let bestCutoff = 0;

  for (let i = 1; i < data.length - 1; i++) {
    const distanceDiff = data[i + 1] - data[i];
    if (distanceDiff > maxDistanceDiff) {
      maxDistanceDiff = distanceDiff;
      bestCutoff = data[i];
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
    .range([600, 0]);

  const cutoffX = x(cutoff);

  svg
    .append('line')
    .attr('x1', cutoffX)
    .attr('y1', 0)
    .attr('x2', cutoffX)
    .attr('y2', 600)
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
