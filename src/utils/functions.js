
import dataset from '../data/dataset.json' assert { type: 'json' };
const fs = require('fs');

export const getKmeansDataset = (x, y) => {
  if (!x || !y) return [];

  return dataset.map(item => ({
    x: item[x],
    y: item[y]
  }));
};

// Retorna todas as propriedades disponíveis no dataset
export const getPropertiesList = () => {
  return Object.keys(dataset[0]);
};

export const createDatasetFromPresets = selectedProperties => {
  return dataset.map(item => {
    return selectedProperties.map(prop => item[prop]);
  });
};

export const addLog = function(algoritmo, input, clusters) {
  debugger;
  const arquivo = '../data/log.json';

  let objeto = {
    timestamp: Date.now(),
    algoritmo: algoritmo,
    input: input,
    clusters: clusters
  };

  let conteudo;

  try {
    conteudo = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (err) {
    conteudo = [];
  }
  conteudo.push(objeto);

  fs.writeFileSync(arquivo, JSON.stringify(conteudo, null, 2), 'utf8');
}