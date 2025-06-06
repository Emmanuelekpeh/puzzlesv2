import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PuzzleBrowser from './pages/PuzzleBrowser';
import PuzzleSolverPage from './pages/PuzzleSolverPage';
import PuzzleCreator from './pages/PuzzleCreator';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AccuracyTracker from './components/AccuracyTracker';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/puzzles" element={<PuzzleBrowser />} />
            <Route path="/puzzle/:id" element={<PuzzleSolverPage />} />
            <Route path="/create" element={<PuzzleCreator />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accuracy" element={<AccuracyTracker />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
