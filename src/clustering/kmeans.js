import datasetOriginal from '../data/dataset.json';
import { createDatasetFromPresets } from '../utils/functions.js';
import { presets } from '../scripts/presets.js';

let kmeansModel;

export function make() {
  const currentClusterCount = parseInt(document.getElementById("clusterInput").value);
  const selectedPreset = document.getElementById("presetSelect").value;
  const selectedProperties = presets[selectedPreset];

  const maxIter = parseInt(document.getElementById("maxIterInput").value);
  const threshold = parseFloat(document.getElementById("thresholdInput").value);

  const options = {
    'k': currentClusterCount,
    'maxIter': maxIter,
    'threshold': threshold,
  };

  const data = createDatasetFromPresets(selectedProperties);

  console.log("Iniciando o kmeans");
  console.log("Agrupando por : " + selectedPreset + " " + selectedProperties);
  console.log("Dados para K-Means:", data);
  kmeansModel = ml5.kmeans(data, options, () => modelReady(selectedProperties));
}

function modelReady(selectedProperties) {
  console.log("Clusters calculados!");
  makeChart(selectedProperties);
}

function makeChart(selectedProperties) {
  const dataset = kmeansModel.dataset.map((d, i) => {
    let obj = { cluster: d.centroid };
    selectedProperties.forEach((prop, index) => {
      obj[prop] = d[index];
    });
    obj['classe'] = datasetOriginal[i].classe;
    return obj;
  });

  const width = 960;
  const height = 960;
  const numVar = selectedProperties.length;
  const size = width / numVar;
  const padding = 20;

  d3.select('svg').remove();

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + padding)
    .attr('height', height + padding)
    .append('g')
    .attr('transform', `translate(${padding / 2},${padding / 2})`);

  const xScales = {};
  const yScales = {};

  selectedProperties.forEach(prop => {
    xScales[prop] = d3.scaleLinear()
      .domain(d3.extent(dataset, d => d[prop]))
      .range([padding / 2, size - padding / 2]);

    yScales[prop] = d3.scaleLinear()
      .domain(d3.extent(dataset, d => d[prop]))
      .range([size - padding / 2, padding / 2]);
  });

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  selectedProperties.forEach((propX, i) => {
    selectedProperties.forEach((propY, j) => {
      if (i === j) {
        svg.append('g')
          .attr('transform', `translate(${i * size},${j * size})`)
          .append('text')
          .attr('x', size / 2)
          .attr('y', size / 2)
          .attr('text-anchor', 'middle')
          .text(propX);
      } else {
        const cell = svg.append('g')
          .attr('transform', `translate(${i * size},${j * size})`);

        cell.append('g')
          .attr('transform', `translate(0,${size - padding / 2})`)
          .call(d3.axisBottom(xScales[propX]).ticks(5));

        cell.append('g')
          .attr('transform', `translate(${padding / 2},0)`)
          .call(d3.axisLeft(yScales[propY]).ticks(5));

        cell.selectAll('circle')
          .data(dataset)
          .enter().append('circle')
          .attr('cx', d => xScales[propX](d[propX]))
          .attr('cy', d => yScales[propY](d[propY]))
          .attr('r', 3)
          .attr('fill', d => color(d.cluster));
      }
    });
  });

  createLegend(dataset, color);
}

function createLegend(dataset, color) {
  const legendContainer = d3.select('#legend').html('');

  const clusterGroups = {};
  dataset.forEach(d => {
    const cluster = d.cluster;
    const classe = d.classe;
    if (!clusterGroups[cluster]) {
      clusterGroups[cluster] = {};
      clusterGroups[cluster].total = 0;
    }
    if (!clusterGroups[cluster][classe]) {
      clusterGroups[cluster][classe] = 0;
    }
    clusterGroups[cluster][classe]++;
    clusterGroups[cluster].total++;
  });

  Object.keys(clusterGroups).forEach(cluster => {
    const clusterDiv = legendContainer.append('div').attr('class', 'legend-item');
    clusterDiv.append('span')
      .style('background-color', color(cluster))
      .style('display', 'inline-block')
      .style('width', '20px')
      .style('height', '20px')
      .style('margin-right', '10px');
    clusterDiv.append('span').text(`Cluster ${cluster}: (${clusterGroups[cluster].total})`);
    const sortedClasses = Object.keys(clusterGroups[cluster]).sort((a, b) => clusterGroups[cluster][b] - clusterGroups[cluster][a]);
    sortedClasses.forEach(classe => {
      if (classe !== 'total') {
        clusterDiv.append('div').attr('class', 'legend-species')
          .style('padding-left', '30px')
          .text(`${classe}: ${clusterGroups[cluster][classe]}`);
      }
    });
  });

  d3.selectAll('.legend-item').style('margin-bottom', '10px');
  d3.selectAll('.legend-species').style('margin-left', '30px');
}

export async function generateElbowCurve() {
  const maxK = parseInt(document.getElementById("clusterInput").value) || 10;
  const selectedPreset = document.getElementById("presetSelect").value;
  const selectedProperties = presets[selectedPreset];
  const data = createDatasetFromPresets(selectedProperties);

  const wcss = [];
  const kmeansModels = [];

  async function calculateKMeans(k) {
    const options = {
      'k': k,
      'maxIter': 300,
      'threshold': 1e-4,
    };
    console.log(`Calculating K-means for k=${k}`);
    kmeansModels[k] = ml5.kmeans(data, options);
  }

  try {
    for (let k = 1; k <= maxK; k++) {
      await calculateKMeans(k);
    }
    console.log('All models calculated, calculating WCSS');
    calculateAllWCSS();
  } catch (error) {
    console.error(error);
  }

  function calculateAllWCSS() {
    for (let k = 1; k <= maxK; k++) {
      const model = kmeansModels[k];
      if (!model) {
        console.log(`Model for k=${k} not found`);
        continue;
      }

      console.log(`Calculating WCSS for k=${k}`);

      const clusterSums = {};
      const clusterCounts = {};

      for (let i = 0; i < model.dataset.length; i++) {
        const d = model.dataset[i];
        const centroidIndex = d.centroid;

        if (!clusterSums[centroidIndex]) {
          clusterSums[centroidIndex] = Array(selectedProperties.length).fill(0);
          clusterCounts[centroidIndex] = 0;
        }

        selectedProperties.forEach((prop, j) => {
          clusterSums[centroidIndex][j] += d[j];
        });

        clusterCounts[centroidIndex]++;
      }

      const centroids = {};
      for (let index in clusterSums) {
        centroids[index] = clusterSums[index].map(sum => sum / clusterCounts[index]);
      }

      const sumSquares = model.dataset.reduce((sum, d) => {
        const centroidIndex = d.centroid;
        const centroid = centroids[centroidIndex];
        const distance = Math.sqrt(selectedProperties.reduce((acc, prop, j) => {
          const diff = d[j] - centroid[j];
          return acc + diff * diff;
        }, 0));
        return sum + distance * distance;
      }, 0);

      wcss[k] = sumSquares;
    }

    makeElbowChart(wcss);
  }

  function makeElbowChart(wcss) {
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select('#elbowChart').html('')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([1, maxK]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(wcss)]).range([height, 0]);

    const xAxis = d3.axisBottom(x).ticks(maxK);
    const yAxis = d3.axisLeft(y);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('g')
      .call(yAxis);

    const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(d));

    svg.append('path')
      .datum(wcss.slice(1))
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.selectAll('.dot')
      .data(wcss.slice(1))
      .enter().append('circle')
      .attr('cx', (d, i) => x(i + 1))
      .attr('cy', d => y(d))
      .attr('r', 3)
      .attr('fill', 'red');
  }
}
