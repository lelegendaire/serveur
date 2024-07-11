export default class TheFabStudio extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                /* Style pour le contenu */
                .content {
                    padding: 10px;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    color: #333;
                    border: 1px solid #ccc;
                    width: 100%;
                    height: 100%;
                }
                .error {
                    color: red;
                    font-weight: bold;
                }
            </style>
            <div class="content">Loading...</div>
        `;
    }

    static get observedAttributes() {
        return ['url'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'url' && oldValue !== newValue) {
            this.loadContent(newValue);
        }
    }

    async loadContent(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            this.shadowRoot.innerHTML = `<div class="content">${content}</div>`;
        } catch (error) {
            this.shadowRoot.innerHTML = `<div class="error">Failed to load content: ${error.message}</div>`;
        }
    }

    connectedCallback() {
        if (this.hasAttribute('url')) {
            this.loadContent(this.getAttribute('url'));
        }
    }
}

customElements.define('the-fab-studio', TheFabStudio);
