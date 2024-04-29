import { getDataset } from "../utils/functions.js";

const dataset = getDataset('area', 'perimetro');
let calculated =false;

const options = {
  k: 4,
  maxIter: 4,
  threshold: 0.5,
};

// Initialize kmeans
const kmeans = ml5.kmeans(dataset, options, clustersCalculated);

// When the model is loaded
function clustersCalculated() {
  calculated = true; 
  console.log('Points Clustered!');
  console.log(calculated);
  console.log(kmeans.dataset);
  //console.log(kmeans.centroids);
}


/*
function draw() {
  if (calculated) {
    for (i = 0; i < kmeans.dataset.length; i++) {
      let centroid = kmeans.dataset[i].centroid;
      let datapointx = kmeans.dataset[i][0];
      let datapointy = kmeans.dataset[i][1];
      //We are using the HSB colorMode heres
      fill(centroid * 36, 100,100);
      ellipse(datapointx, datapointy, 20, 20);
      //We also add a label to the output, so it could be interpreted without the color
      fill(0);
      textAlign(CENTER, CENTER);
      text(centroid + 1, datapointx, datapointy);
    }
  }
}*/