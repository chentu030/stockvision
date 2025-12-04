import NewDashboard from './components/NewDashboard';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <NewDashboard />
    </ThemeProvider>
  );
}

export default App;
