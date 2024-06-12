import { setupHierarchicalCluster } from '../clustering/hierarchical';

const inputSizeEl = document.querySelector('#input-size');
const selectPresetEl = document.querySelector('#select-preset');
const selectLinkageEl = document.querySelector('#select-linkage');
const selectDistanceEl = document.querySelector('#select-distance');
const buttonExecuteEl = document.querySelector('#button-execute');

export function initializeHierarchical() {
  setupHierarchicalCluster();

  buttonExecuteEl.addEventListener('click', setupHierarchicalCluster);

  inputSizeEl.addEventListener('input', function (e) {
    const input = e.target;
    let value = input.value;

    value = value.replace(/[^0-9]/g, '');

    if (value) {
      const numericValue = parseInt(value, 10);
      if (numericValue < 1) {
        value = '1';
      } else if (numericValue > dataset.length) {
        value = `${dataset.length}`;
      } else {
        value = numericValue.toString();
      }
    }

    input.value = value;
  });
}
