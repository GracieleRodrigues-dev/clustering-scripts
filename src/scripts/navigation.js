document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('btn-kmeans').addEventListener('click', function() {
        setActiveButton(this);
        loadContent('kmeans');
    });

    document.getElementById('btn-hierarchical').addEventListener('click', function() {
        setActiveButton(this);
        loadContent('hierarchical');
    });

    document.getElementById('btn-compare').addEventListener('click', function() {
        setActiveButton(this);
        loadContent('compare');
    });

    function setActiveButton(button) {
        document.querySelectorAll('.nav-button, .compare-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    }

    function loadContent(page) {
        fetch(`${page}.html`)
            .then(response => response.text())
            .then(html => {
                document.getElementById('divContent').innerHTML = html;
                loadScriptsForPage(`./clustering/${page}.js`);
            })
            .catch(error => {
                console.error('Error loading page:', error);
            });
    }

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve(script);
            script.onerror = () => reject(new Error(`Script load error for ${url}`));
            document.head.append(script);
        });
    }

    function loadScriptsForPage(page) {
        let script = document.createElement('script');
        script.src = `./clustering/${page}.js`;
        script.onload = function() {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                // Verifica se a página já foi carregada antes de tentar inicializar
                if (window[`${page}Init`]) {
                    window[`${page}Init`]();
                }
            }
        };
        script.onerror = function() {
            console.error(`Error loading script: ${script.src}`);
        };
        document.body.appendChild(script);
    }
    
});
