import datasetOriginal from '../dataset.json';
import { createDatasetFromPresets } from '../utils/functions.js';
import { presets } from './presets.js';


//vamos carregar as opções dos presets
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.fa-question-circle').addEventListener('click', () => {
    let message = "";
    Object.entries(presets).forEach(([preset, properties]) => {
      message += `Preset ${preset}: ${properties.join(', ')}\n\n`;
    });
    alert(message);
  });

  const presetSelect = document.getElementById("presetSelect");
  Object.keys(presets).forEach(preset => {
    const option = document.createElement("option");
    option.value = preset;
    option.text = preset;
    presetSelect.appendChild(option);
  });

  let kmeansModel;

  const width = 960;
  const height = 960;

  // Adiciona event listener ao botão
  document.getElementById("clusterButton").addEventListener("click", make);

  // Cria o modelo kmeans
  function make() {
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

  // Quando o modelo está pronto, cria o gráfico
  function modelReady(selectedProperties) {
    console.log("Clusters calculados!");
    makeChart(selectedProperties);
  }

  // Cria a matriz de gráficos de dispersão
  function makeChart(selectedProperties) {
    const dataset = kmeansModel.dataset.map((d, i) => {
      let obj = { cluster: d.centroid }; 
      selectedProperties.forEach((prop, index) => {
        obj[prop] = d[index];
      });
      obj['classe'] = datasetOriginal[i].classe;
      return obj;
    });

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

    // Adiciona a legenda
    createLegend(dataset, color);
  }

  // Função para criar a legenda
  function createLegend(dataset, color) {
    const legendContainer = d3.select('#legend').html(''); // Limpa a legenda anterior
  
    // Agrupa os dados por cluster e por classe
    const clusterGroups = {};
    dataset.forEach(d => {
      const cluster = d.cluster;
      const classe = d.classe;
      if (!clusterGroups[cluster]) {
        clusterGroups[cluster] = {};
        clusterGroups[cluster].total = 0; // Inicializa o contador total
      }
      if (!clusterGroups[cluster][classe]) {
        clusterGroups[cluster][classe] = 0;
      }
      clusterGroups[cluster][classe]++;
      clusterGroups[cluster].total++; // Incrementa o contador total
    });
  
    // Cria os elementos da legenda
    Object.keys(clusterGroups).forEach(cluster => {
      const clusterDiv = legendContainer.append('div').attr('class', 'legend-item');
      clusterDiv.append('span')
        .style('background-color', color(cluster))
        .style('display', 'inline-block')
        .style('width', '20px')
        .style('height', '20px')
        .style('margin-right', '10px');
      clusterDiv.append('span').text(`Cluster ${cluster}: (${clusterGroups[cluster].total})`); // Adiciona o total de pontos
      // Ordena as classes do cluster do maior para o menor
      const sortedClasses = Object.keys(clusterGroups[cluster]).sort((a, b) => clusterGroups[cluster][b] - clusterGroups[cluster][a]);
      sortedClasses.forEach(classe => {
        if (classe !== 'total') { // Ignora o total na legenda
          clusterDiv.append('div').attr('class', 'legend-species')
            .style('padding-left', '30px')
            .text(`${classe}: ${clusterGroups[cluster][classe]}`);
        }
      });
    });
  
    // Adiciona estilos inline
    d3.selectAll('.legend-item')
      .style('margin-bottom', '10px');
  
    d3.selectAll('.legend-species')
      .style('margin-left', '30px');
  }
  
});