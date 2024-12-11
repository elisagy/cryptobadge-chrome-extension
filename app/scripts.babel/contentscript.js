'use strict';

console.log('\'Allo \'Allo! Content script');

const addresses = {};

function replaceTextNodes(node) {
    if (node.getAttribute?.("crypto-badge-data") === "true") {
        return;
    }

    node.childNodes.forEach(function (el) {
        if (el?.nodeType === 3) {
            if (el.nodeValue.trim().match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/)) {
                const address = el.nodeValue.trim();
                if (!addresses[address]) {
                    addresses[address] = (async (address, el) => {
                        try {
                            const response = await fetch(`https://api.cryptobadge.info/addresses/${el.nodeValue.trim()}`);
                            return await response.json();
                        }
                        catch (err) {
                            return null;
                        }
                    })(address, el);
                }

                addresses[address].then(((el) => (data) => {
                    if (!data) {
                        return;
                    }

                    const badgeElement = document.createElement("img");
                    badgeElement.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAC0UExURfeTGveTGveTGveTGveTGveTGveTGveTGveTGveTGveSGPeUHfeVHveSGfeTGvigNfq4aPq9dPmsT/eTGfeYJPzQm/7y5P7r1PvPmveXI/eRFvq+df7r1fq3Z/3p0fvIivzTov7t2PvFg/7s2PifM/3ozvvIi/rAef705/eSF/eZJ/zSoP/48PvLkfq8cf716vvDgPeRF/eUG/ilQfzdtv3ny/3eufvPmfeXIvmpSfiaKv///9RvhXUAAAAKdFJOUwAbg9n6LL/+wC16jHM8AAAAAWJLR0Q7OQ70bAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+gMCw8GEROEmQYAAACGSURBVAjXRY5HFgIxDEOdQpyEsQmE3oYy9N7L/Q9GZoV2X09PEgAIqbRWUkBSxaCvZoTWJd9yVgv1hmcjQGJsttqdbi+iBMXcHwxH45xYgWamyXQ2zz3rEorFcrUOmwQqbnf7w/F0vqSYxOvt/ni+CkoFwsT3J3yJ2KZZZ9EzMxpXXvjf+QGRMQk8yF1fdwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNC0xMi0xMVQxNTowMTo0NCswMDowMHfHgSUAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjQtMTItMTFUMTU6MDE6NDQrMDA6MDAGmjmZAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI0LTEyLTExVDE1OjA2OjE3KzAwOjAwylsXxgAAAABJRU5ErkJggg==");
                    badgeElement.setAttribute("style", "margin: 0 0 4px 4px; cursor: pointer;");
                    badgeElement.setAttribute("title", JSON.stringify(data));
                    el.parentNode.appendChild(badgeElement);
                })(el));

                el.parentNode.setAttribute("crypto-badge-data", "true");
            }
        } else {
            replaceTextNodes(el);
        }
    });
}

const observer = new MutationObserver(function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.target) {
            replaceTextNodes(mutation.target);
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });