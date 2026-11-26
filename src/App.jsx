import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BoardPage from './pages/BoardPage';
import DetailsPage from './pages/DetailsPage';
import StatsPage from './pages/StatsPage';
import NotFound from './pages/NotFound';
import { useTrackerSync } from './hooks/useTrackerSync';

export default function App() {
  // Runs once for the whole app, so every page stays in sync with Excel.
  const sync = useTrackerSync();

  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<BoardPage sync={sync} />} />
          <Route path="/app/:id" element={<DetailsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
