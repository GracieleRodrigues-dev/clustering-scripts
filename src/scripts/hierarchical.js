import cluster from 'hierarchical-clustering';
import { getHierarchicalDataset } from '../utils/functions.js';

const dataset = getHierarchicalDataset('area');

const distance = (a, b) => {
  var d = 0;
  for (var i = 0; i < a.length; i++) {
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

console.log('Processando...');

const levels = cluster({
  input: dataset,
  distance: distance,
  linkage: linkage,
  minClusters: 2
});

const { optimalClusters, variances } = elbow(dataset, 5);

console.clear();
console.log(levels);
console.log('Variações:', variances);
console.log('Número ótimo de clusters:', optimalClusters);
