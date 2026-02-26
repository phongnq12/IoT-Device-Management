import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// CSS modules — import order matters
import './styles/tokens.css';
import './styles/base.css';
import './styles/navbar.css';
import './styles/buttons.css';
import './styles/layout.css';
import './styles/device-table.css';
import './styles/alerts.css';
import './styles/modals.css';
import './styles/shared.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
