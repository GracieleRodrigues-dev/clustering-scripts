import dataset from '../dataset.json' assert { type: "json" };

export const getDataset = (x, y) => {
    if(!x || !y) return [];

    return dataset.map((item) => ({
      x: item[x],
      y: item[y]
    }));
  };