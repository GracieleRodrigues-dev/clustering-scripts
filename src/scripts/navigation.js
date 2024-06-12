function loadPage(url) {
    return fetch(url)
      .then(response => response.text())
      .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const scriptElements = tempDiv.querySelectorAll('script');
        const scriptsToLoad = [];
  
        scriptElements.forEach(script => {
          if (script.src) {
            scriptsToLoad.push(loadScript(script.src));
          } else {
            const inlineScript = document.createElement('script');
            inlineScript.innerHTML = script.innerHTML;
            document.body.appendChild(inlineScript);
          }
        });
  
        document.querySelector('main').innerHTML = tempDiv.querySelector('main').innerHTML;
  
        return Promise.all(scriptsToLoad);
      })
      .catch(error => console.error('Erro ao carregar a página:', error));
  }
  
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        const url = event.target.getAttribute('href');
        loadPage(url).then(() => {
          if (url.includes('kmeans.html')) {
            import('./kmeans.js').then(module => {
              module.initializeKMeans();
            });
          } else if (url.includes('hierarchical.html')) {
            import('./hierarchical.js').then(module => {
              module.initializeHierarchical();
            });
          }
        });
      });
    });
  });
  