import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { app } from './lib/state/app.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app not found');

// A shared link restores template, content and style; an invalid hash is ignored.
app.loadHash(location.hash);

export default mount(App, { target });
