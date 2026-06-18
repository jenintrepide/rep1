import { useState } from 'react';
import BgIntro from './components/BgIntro';
import InputView from './components/InputView';
import LoadingView from './components/LoadingView';
import ResultView from './components/ResultView';

function App() {
  // State: 'intro' | 'input' | 'loading' | 'result'
  const [view, setView] = useState('intro');
  const [data, setData] = useState(null);

  const handleIntroComplete = () => {
    setView('input');
  };

  const analyze = async (formData) => {
    setView('loading');

    // Create a unique key based on input for caching
    const cacheKey = `ssa_analysis_split_${JSON.stringify(formData)}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      console.log("Using cached analysis data");
      await new Promise(resolve => setTimeout(resolve, 800)); // Smooth transition
      setData(JSON.parse(cached));
      setView('result');
      return;
    }

    try {
      // 1. Prediction Step
      const predRes = await fetch('http://127.0.0.1:8000/predict_json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!predRes.ok) {
        throw new Error(`Prediction API Error: ${predRes.statusText}`);
      }

      const predData = await predRes.json();

      // 2. Decision Step (Feed prediction output to decision engine)
      const decideRes = await fetch('http://127.0.0.1:8000/decide_json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predData)
      });

      if (!decideRes.ok) {
        throw new Error(`Decision API Error: ${decideRes.statusText}`);
      }

      const decideData = await decideRes.json();

      // 3. Combine Results
      // ResultView expects: data.prediction_results & data.decision_results
      // Backend returns decision_report = { results: [...] }
      // We need to map the backend keys to what ResultView expects
      const rawDecisionResults = decideData.decision_report?.results || [];
      const mappedDecisionResults = rawDecisionResults.map(item => ({
        ...item,
        other_id: item.debris_id,             // ResultView expects 'other_id'
        maneuver_evaluations: item.maneuvers  // ResultView expects 'maneuver_evaluations'
      }));

      const combinedResult = {
        ...predData, // Contains 'prediction_results', 'status', 'metadata', etc.
        decision_results: mappedDecisionResults
      };

      // Cache the combined result
      try {
        localStorage.setItem(cacheKey, JSON.stringify(combinedResult));
      } catch (e) {
        console.warn("Failed to cache analysis results (likely storage quota exceeded):", e);
      }

      // Artificial delay for UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      setData(combinedResult);
      setView('result');

    } catch (err) {
      console.error("Analysis Flow Failed:", err);
      alert("Failed to complete analysis chain. Please try again.");
      setView('input');
    }
  };

  const handleBack = () => {
    setView('input');
    setData(null);
  };

  return (
    <div className="w-full h-screen overflow-hidden font-mono bg-space-950 text-silver">
      {/* {view === 'intro' && <SatelliteIntro onComplete={handleIntroComplete} />} */}
      {view === 'intro' && <BgIntro onComplete={handleIntroComplete} />}
      {view === 'input' && <InputView onSubmit={analyze} />}
      {view === 'loading' && <LoadingView />}
      {view === 'result' && data && <ResultView data={data} onBack={handleBack} />}
    </div>
  );
}

export default App;
