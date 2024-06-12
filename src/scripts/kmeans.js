import datasetOriginal from '../data/dataset.json';
import { createDatasetFromPresets, addLog } from '../utils/functions.js';
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

  document.querySelector('#newPreset').addEventListener('click', () => {
    let nomePreset = document.querySelectorAll('input#nomePreset')[0].value;
    let checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    let valores = [];
    checkboxes.forEach(function(checkbox) {
      valores.push(checkbox.value);
    });

    presets[nomePreset] = valores;

    const presetSelect = document.getElementById("presetSelect");
    const option = document.createElement("option");
    option.value = nomePreset;
    option.text = nomePreset;
    presetSelect.appendChild(option);
    document.getElementById('myModal').classList.remove('show');
    document.querySelectorAll('.modal-backdrop')[0].classList.remove('show');
  });

  const presetSelect = document.getElementById("presetSelect");
  Object.keys(presets).forEach(preset => {
    const option = document.createElement("option");
    option.value = preset;
    option.text = preset;
    presetSelect.appendChild(option);
  });

  let kmeansModel;
  let atualOptions;

  const width = 960;
  const height = 960;

  // Adiciona event listener ao botão
  document.getElementById("clusterButton").addEventListener("click", async () => {
    document.getElementById("loadingScreen").style.display = "block";
    await new Promise(resolve => setTimeout(resolve, 2000));
    await make();
    document.getElementById("loadingScreen").style.display = "none";
});

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

    atualOptions = options;

    const data = createDatasetFromPresets(selectedProperties);

    console.log("Iniciando o kmeans");
    console.log("Agrupando por : " + selectedPreset + " " + selectedProperties);
    // console.log("Dados para K-Means:", data);
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

    // addLog('K-Means', atualOptions, clusterGroups);
  
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

document.getElementById("elbowButton").addEventListener("click", async () => {
  document.getElementById("loadingScreen").style.display = "block";
  await new Promise(resolve => setTimeout(resolve, 2000));
  await generateElbowCurve();
  document.getElementById("loadingScreen").style.display = "none";
});

async function generateElbowCurve() {
  const maxK = parseInt(document.getElementById("clusterInput").value) || 10;
  const selectedPreset = document.getElementById("presetSelect").value;
  const selectedProperties = presets[selectedPreset];
  const data = createDatasetFromPresets(selectedProperties);

  const wcss = [];
  const kmeansModels = [];

  async function calculateKMeans(k) {
      const options = {
        'k': k
      };
      console.log(`Calculating K-means for k=${k}`);
      kmeansModels[k] = ml5.kmeans(data, options);        
  }

  try {
    for (let k = 1; k <= maxK; k++) {
      await calculateKMeans(k);
    }
    console.log('All models calculated, calculating WCSS');
    //console.log(kmeansModels[1].dataset[1]);
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

        const clusterSums = {}; // Somas das coordenadas dos pontos por cluster
        const clusterCounts = {}; // Contagem de pontos por cluster

        for (let i = 0; i < model.dataset.length; i++) {
            const d = model.dataset[i];
            const centroidIndex = d.centroid;
            
            if (!clusterSums[centroidIndex]) {
                clusterSums[centroidIndex] = Array(selectedProperties.length).fill(0);
                clusterCounts[centroidIndex] = 0;
            }
    
            selectedProperties.forEach((prop, j) => {
                clusterSums[centroidIndex][j] += d[j]; // Corrigido para d[j]
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
            const distance = selectedProperties.reduce((distanceSum, prop, i) => {
                return distanceSum + Math.pow(d[i] - centroid[i], 2); 
            }, 0);
            return sum + distance;
        }, 0);

        wcss.push({ k, wcss: sumSquares });
    }

    console.log("All WCSS calculated:", wcss);
    plotElbowCurve(wcss);
  }
}

function plotElbowCurve(wcss) {
  const svgWidth = 500, svgHeight = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  d3.select("#elbowChart").html("");

  const svg = d3.select("#elbowChart")
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
      .domain([1, d3.max(wcss, d => d.k)])
      .range([0, width]);

  const y = d3.scaleLinear()
      .domain([0, d3.max(wcss, d => d.wcss)])
      .range([height, 0]);

  const xAxis = d3.axisBottom(x).ticks(wcss.length);
  const yAxis = d3.axisLeft(y);

  svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .append("text")
      .attr("fill", "#000")
      .attr("x", width / 2)
      .attr("y", margin.bottom - 10)
      .attr("text-anchor", "middle")
      .text("Number of Clusters (k)");

  svg.append("g")
      .call(yAxis)
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("WCSS");

  svg.append("path")
      .datum(wcss)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
          .x(d => x(d.k))
          .y(d => y(d.wcss))
      );

  // Criar elemento de tooltip
  const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  svg.selectAll(".dot")
      .data(wcss)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.k))
      .attr("cy", d => y(d.wcss))
      .attr("r", 5)
      .on("mouseover", function(d) {
          // Ao passar o mouse sobre o ponto, exibe o valor de WCSS
          const tooltipText = `k: ${d.k}, WCSS: ${d.wcss.toFixed(2)}`;
          tooltip.transition()
              .duration(200)
              .style("opacity", .9);
          tooltip.html(tooltipText)
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          // Ao retirar o mouse do ponto, esconde o tooltip
          tooltip.transition()
              .duration(500)
              .style("opacity", 0);
      });
}
