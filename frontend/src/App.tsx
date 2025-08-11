import { BrowserRouter, Route, Routes } from 'react-router';

import { ThemeProvider } from './context/ThemeProvider';

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
