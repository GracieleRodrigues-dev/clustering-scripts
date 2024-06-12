import log from '../data/log.json';
document.addEventListener('DOMContentLoaded', () => {
    const listagem = document.getElementById("logs");
    log.forEach(item => {
        const tr = document.createElement("tr");
        const tdTimestamp = document.createElement("td");
        const tdAlgoritmo = document.createElement("td");
        const tdInput = document.createElement("td");
        const tdClusters = document.createElement("td");

        tdTimestamp.innerHTML = item.timestamp;
        tdAlgoritmo.innerHTML = item.algoritmo;
        tdInput.innerHTML = item.input;
        tdClusters.innerHTML = item.clusters;

        tr.appendChild(tdTimestamp);
        tr.appendChild(tdAlgoritmo);
        tr.appendChild(tdInput);
        tr.appendChild(tdClusters);
        listagem.appendChild(tr);
    });
});