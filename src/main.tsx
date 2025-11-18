// Entrypoint of the React frontend application.
// Renders the App component into the DOM element with id 'root'.
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
