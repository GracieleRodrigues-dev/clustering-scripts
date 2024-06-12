import { presets } from '../scripts/presets.js';
import { make, generateElbowCurve } from '../clustering/kmeans.js';

export function initializeKMeans() {
  // Carregar opções dos presets
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

  document.getElementById("clusterButton").addEventListener("click", make);
  document.getElementById("elbowButton").addEventListener("click", generateElbowCurve);
}
