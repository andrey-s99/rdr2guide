import { render } from 'preact';

// Fonts: only latin + cyrillic subsets are bundled (self-hosted, offline).
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/cyrillic-400.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/cyrillic-500.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/oswald/cyrillic-600.css';
import '@fontsource/pt-serif/latin-400.css';
import '@fontsource/pt-serif/cyrillic-400.css';
import '@fontsource/pt-serif/latin-700.css';
import '@fontsource/pt-serif/cyrillic-700.css';
import '@fontsource/ruslan-display/latin-400.css';
import '@fontsource/ruslan-display/cyrillic-400.css';
import '@fontsource/old-standard-tt/latin-700.css';
import '@fontsource/old-standard-tt/cyrillic-700.css';

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { App } from './app';
import { startRouter } from './router';
import { applyTheme } from './theme';

applyTheme('night');
startRouter();

render(<App />, document.getElementById('app')!);
