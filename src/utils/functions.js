import dataset from '../dataset.json' assert { type: 'json' };

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
