import './utils/axios';

import { BrowserRouter, Route, Routes } from 'react-router';

import Dashboard from './components/layout/Dashboard';
import Main from './components/layout/Main';
import { ThemeProvider } from './context/ThemeProvider';
import { getMainRoutes } from './utils/routes';

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {getMainRoutes().map((route) =>
            route.dashboard ? (
              <Route
                path={route.path}
                element={
                  <Dashboard>
                    <route.component />
                  </Dashboard>
                }
              />
            ) : (
              <Route
                path={route.path}
                element={
                  <Main>
                    <route.component />
                  </Main>
                }
              />
            )
          )}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
