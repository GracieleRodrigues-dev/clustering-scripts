import dataset from '../dataset.json' assert { type: 'json' };

export const getKmeansDataset = (x, y) => {
  if (!x || !y) return [];

  return dataset.map(item => ({
    x: item[x],
    y: item[y]
  }));
};

export const getHierarchicalDataset = x => {
  if (!x) return [];
  return dataset.map(item => item[x]);
};

// Retorna todas as propriedades disponíveis no dataset
export const getPropertiesList = () => {
  return Object.keys(dataset[0]);
};