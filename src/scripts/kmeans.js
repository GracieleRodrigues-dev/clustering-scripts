import { getKmeansDataset, getPropertiesList } from '../utils/functions.js';

let kmeansModel;

const width = 640;
const height = 480;

// Add event listener to the submit button
document.getElementById("clusterButton").addEventListener("click", make);

// Populate select options with property names
const properties = getPropertiesList();
const xSelect = document.getElementById("xSelect");
const ySelect = document.getElementById("ySelect");

properties.forEach(property => {
  const option = document.createElement("option");
  option.text = property;
  xSelect.add(option.cloneNode(true));
  ySelect.add(option);
});

// create the model
function make() {
  const currentClusterCount = parseInt(document.getElementById("clusterInput").value);
  const options = {
    'k': currentClusterCount,
    'maxIter': 10,
    'threshold': 2,
  };

  const selectedX = xSelect.value;
  const selectedY = ySelect.value;

  const data = getKmeansDataset(selectedX, selectedY);
  console.log("iniciando o kmeans");
  console.log("agrupando por " + selectedX + " e " + selectedY);
  kmeansModel = ml5.kmeans(data, options, modelReady);
}

// when the model is ready, make the chart
function modelReady() {
  console.log("Clusters calculados!");
  makeChart()
}

// use the fancy d3 to make magic
function makeChart() {
  const dataset = kmeansModel.dataset;
  d3.select('svg').remove();

  // reappend the svg to the chart area
  const svg = d3.select('#chart').append('svg')
    .attr('width', width)
    .attr('height', height);

  // d[0] is for the x value in the array
  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, d => d[0]))
    .range([10, width - 100]);

  // d[1] is for the y value in the array
  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, d => d[1]))
    .range([height - 50, 20]);

  svg.selectAll('circle').data(dataset)
    .enter().append('circle')
    .attr('cx', d => xScale(d[0]))
    .attr('cy', d => yScale(d[1]))
    .attr('r', 6)
    .attr('fill', 'black')

  d3.select('svg').selectAll('circle')
    .transition()
    .attr('fill', (d, i) => createRGB(dataset[i].centroid))
}

// Função para gerar uma cor RGB com base no valor do centroide
function createRGB(centroid) {
  // Calcular o deslocamento baseado no valor do centroid
  const offset = centroid * 30; // Ajuste conforme necessário para a distância desejada entre as cores

  // Calcular os componentes RGB com base no deslocamento
  const r = (centroid * 53 + offset) % 255; // calcular R
  const g = (centroid * 101 + offset) % 255; // calcular G
  const b = (centroid * 157 + offset) % 255; // calcular B

  // Retorna a cor RGB no formato 'rgb(x, y, z)'
  return `rgb(${r}, ${g}, ${b})`;
}
