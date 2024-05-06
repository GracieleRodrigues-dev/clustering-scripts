import * as d3 from 'd3';
import cluster from 'hierarchical-clustering';
import { getHierarchicalDataset } from '../utils/functions.js';

const dataset = getHierarchicalDataset('area')
  // .splice(0, 30)
  .map(item => [item]);

const distance = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    d += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(d);
};

const linkage = distances => {
  return Math.min.apply(null, distances);
};

const elbow = (data, maxClusters) => {
  const distances = [];

  for (let k = 1; k <= maxClusters; k++) {
    let totalDistance = 0;
    for (let i = 0; i < data.length; i++) {
      let minDist = Infinity;
      for (let j = 0; j < data.length; j++) {
        if (i !== j) {
          let dist = distance(data[i], data[j]);
          if (dist < minDist) {
            minDist = dist;
          }
        }
      }
      totalDistance += minDist;
    }
    distances.push(totalDistance);
  }

  const variances = [];
  for (let i = 0; i < distances.length - 1; i++) {
    variances.push(distances[i] - distances[i + 1]);
  }

  let elbowPoint = 0;
  let maxVariance = -Infinity;
  for (let i = 0; i < variances.length; i++) {
    if (variances[i] > maxVariance) {
      maxVariance = variances[i];
      elbowPoint = i;
    }
  }

  return { optimalClusters: elbowPoint + 1, variances: variances };
};

const makeChart = data => {
  const width = 8000;
  const height = 3000;

  console.log(data);

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'svg')
    .call(
      d3.zoom().on('zoom', function () {
        svg.attr('transform', d3.zoomTransform(this));
      })
    )
    .append('g');

  const cluster = d3.cluster().size([width, height - 100]);

  const root = d3.hierarchy({
    children: data.map(d => ({
      children: d.clusters[0].map(point => ({ id: point }))
    }))
  });

  cluster(root);

  svg
    .selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 1);

  const node = svg
    .selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x},${d.y})`);

  node.append('circle').attr('r', 4).attr('fill', 'black');
};

let levels = null;

console.log(dataset);

levels = cluster({
  input: dataset,
  distance: distance,
  linkage: linkage,
  minClusters: 2
});

// const { optimalClusters, variances } = elbow(dataset, 5);

if (levels) makeChart(levels);

// console.log('Variações:', variances);
// console.log('Número ótimo de clusters:', optimalClusters);
