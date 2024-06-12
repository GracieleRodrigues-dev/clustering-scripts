import hcluster from 'hclusterjs';
import dataset from '../data/dataset.json' assert { type: 'json' };

const width = 600;
const height = 600;
const loadingEl = document.querySelector('#loading');
const dendrogramEl = document.querySelector('#dendrogram');
const elbowCurveEl = document.querySelector('#elbow-curve');
const inputSizeEl = document.querySelector('#input-size');
const selectPresetEl = document.querySelector('#select-preset');
const selectLinkageEl = document.querySelector('#select-linkage');
const selectDistanceEl = document.querySelector('#select-distance');
const buttonExecuteEl = document.querySelector('#button-execute');
const nClustersLabelEl = document.querySelector('#n-clusters');

const dendrogram = {
  show: () => (dendrogramEl.style.display = 'flex'),
  hidde: () => (dendrogramEl.style.display = 'none')
};

const elbowCurve = {
  show: () => (elbowCurve.style.display = 'flex'),
  hidde: () => (elbowCurve.style.display = 'none')
};

const loading = {
  show: () => (loadingEl.style.display = 'flex'),
  hidde: () => (loadingEl.style.display = 'none')
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

const setup = () => {
  if (inputSizeEl.value > 100) {
    dendrogram.hidde();
    loading.show();
    disableFilters(true);
  }

  setTimeout(() => {
    createHierarchicalCluster()
      .then(hierarchicalCluster => {
        loading.hidde();
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

        // calculateElbowCurve(nodes.length);
      })
      .catch(error => {
        console.error('Erro no processamento!', error);
        loading.hidde();
        dendrogram.hidde();
        disableFilters(false);
      });
  }, 0);
};

const findElbowPoint = distances => {
  const sortedDistances = distances.slice().sort((a, b) => a - b);
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

const euclideanDistance = (a, b) => {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
};

const calculateElbowCurve = async maxClusters => {
  const wcss = [];
  const preset = presets[selectPresetEl.value].slice(0, inputSizeEl.value);

  for (let k = 2; k <= preset.length; k++) {
    await createHierarchicalCluster().then(hierarchicalCluster => {
      const clusters = hierarchicalCluster.getClusters(k);
      const sumOfSquares = clusters.reduce((sum, cluster) => {
        const centroid = cluster.reduce((centroid, point) => {
          point.position.forEach((val, i) => {
            centroid[i] += val;
          });
          return centroid;
        }, new Array(cluster[0].position.length).fill(0));

        centroid.forEach((value, i) => {
          centroid[i] /= cluster.length;
        });

        const clusterSumOfSquares = cluster.reduce((sum, point) => {
          return sum + euclideanDistance(point.position, centroid);
        }, 0);

        return sum + clusterSumOfSquares;
      }, 0);
      wcss.push({ k, sumOfSquares });
    });
  }

  const sortedDistances = [...wcss.map(d => d.sumOfSquares)].sort(
    (a, b) => a - b
  );
  let maxDistanceDiff = 0;
  let bestCutoff = 0;

  for (let i = 1; i < sortedDistances.length - 1; i++) {
    const distanceDiff = sortedDistances[i + 1] - sortedDistances[i];
    if (distanceDiff > maxDistanceDiff) {
      maxDistanceDiff = distanceDiff;
      bestCutoff = sortedDistances[i];
    }
  }

  plotElbowCurve(wcss, bestCutoff);
};

const plotElbowCurve = (wcss, elbowPoint) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 40 },
    width = 500 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

  const x = d3.scale.linear().domain([1, wcss.length]).range([0, width]);

  const y = d3.scale
    .linear()
    .domain([0, d3.max(wcss, d => d.sumOfSquares)])
    .range([height, 0]);

  const xAxis = d3.svg.axis().scale(x).orient('bottom');

  const yAxis = d3.svg.axis().scale(y).orient('left');

  const line = d3.svg
    .line()
    .x(d => x(d.k))
    .y(d => y(d.sumOfSquares));

  const svg = d3
    .select('#elbow-curve')
    .html('') // Limpa o gráfico anterior
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  svg
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)
    .append('text')
    .attr('x', width)
    .attr('dy', '-.71em')
    .style('text-anchor', 'end')
    .text('Number of Clusters (k)');

  svg
    .append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
    .text('Sum of Squares');

  svg.append('path').datum(wcss).attr('class', 'line').attr('d', line);

  const elbowIndex = wcss.findIndex(d => d.sumOfSquares === elbowPoint);
  if (elbowIndex !== -1) {
    svg
      .append('circle')
      .attr('cx', x(wcss[elbowIndex].k))
      .attr('cy', y(elbowPoint))
      .attr('r', 4)
      .style('fill', 'red');
  }
};
setup();
buttonExecuteEl.addEventListener('click', setup);

document.querySelector('#input-size').addEventListener('input', function (e) {
  const input = e.target;
  let value = input.value;

  value = value.replace(/[^0-9]/g, '');

  if (value) {
    const numericValue = parseInt(value, 10);
    if (numericValue < 1) {
      value = '1';
    } else if (numericValue > dataset.length) {
      value = `${dataset.length}`;
    } else {
      value = numericValue.toString();
    }
  }

  input.value = value;
});
