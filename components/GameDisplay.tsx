
import React, { useState, useEffect } from 'react';
import { GameStage, CaseData, Clue, Suspect } from '../types';
import InteractiveCard from './common/InteractiveCard';

interface GameDisplayProps {
  stage: GameStage;
  caseData: CaseData | null;
  onStartNewCase: () => void;
  onSolveRiddle: (answer: string) => boolean; // Returns true if correct
  onSelectSuspect: (suspectId: string) => void; // For initiating interrogation or selection
  onMakeAccusation: (suspectId: string) => void;
  onPlayAgain: () => void;
  selectedSuspectForAccusation: string | null;
  setSelectedSuspectForAccusation: (id: string | null) => void;
}

const GameDisplay: React.FC<GameDisplayProps> = ({
  stage,
  caseData,
  onStartNewCase,
  onSolveRiddle,
  onSelectSuspect,
  onMakeAccusation,
  onPlayAgain,
  selectedSuspectForAccusation,
  setSelectedSuspectForAccusation,
}) => {
  const [riddleAttempt, setRiddleAttempt] = useState('');
  const [riddleFeedback, setRiddleFeedback] = useState('');
  const [showFullCulpritReason, setShowFullCulpritReason] = useState(false);

  useEffect(() => {
    // Reset riddle state when case changes or stage changes away from riddle
    if (stage !== GameStage.RiddleActive) {
      setRiddleAttempt('');
      setRiddleFeedback('');
    }
    if (stage === GameStage.Resolution) {
        setShowFullCulpritReason(false);
    }
  }, [stage, caseData]);

  const handleRiddleSubmit = () => {
    if (!caseData) return;
    const isCorrect = onSolveRiddle(riddleAttempt);
    if (isCorrect) {
      setRiddleFeedback('Correct! A new clue detail has been revealed.');
      // setTimeout(() => setStage(GameStage.CrimeScene), 2000); // Or handled by App.tsx
    } else {
      setRiddleFeedback('Not quite. Keep thinking, detective.');
    }
  };

  const renderIntro = () => (
    <div className="text-center p-8 animate-fade-in">
      <h2 className="text-4xl font-serif-display mb-6">Welcome, Detective!</h2>
      <p className="text-lg mb-8 font-sans-mono">A new case has landed on your desk. Dust off your magnifying glass and sharpen your wits. Justice awaits.</p>
      <button
        onClick={onStartNewCase}
        className="px-8 py-3 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105 transform"
      >
        Begin Investigation
      </button>
    </div>
  );

  const renderCrimeScene = () => {
    if (!caseData) return <p>Error: Case data not loaded.</p>;
    const { victimName, causeOfDeath, locationDescription, crimeSceneImageUrl, clues, riddle } = caseData;

    return (
      <div className="p-4 md:p-8 space-y-6">
        <h2 className="text-3xl font-serif-display text-center border-b-2 border-amber-500 pb-2 mb-6">The Crime Scene</h2>
        <InteractiveCard className="overflow-hidden">
          <img src={crimeSceneImageUrl} alt="Crime Scene" className="w-full h-64 md:h-96 object-cover" />
          <div className="p-4">
            <p className="text-xl font-semibold">{locationDescription}</p>
            <p className="mt-2 font-sans-mono">Victim: {victimName}</p>
            <p className="font-sans-mono">Cause of Death: {causeOfDeath}</p>
          </div>
        </InteractiveCard>

        <h3 className="text-2xl font-serif-display mt-6">Initial Clues:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clues.filter(c => c.isRevealed && c.type !== 'riddle_reward').map(clue => (
            <InteractiveCard key={clue.id} className={`bg-opacity-90 ${clue.isNewlyDiscovered ? 'animate-pulse-subtle ring-2 ring-green-500' : ''}`}>
              <h4 className="font-bold text-amber-700 dark:text-amber-400">{clue.description}</h4>
              <p className="text-sm mt-1 font-sans-mono">{clue.details}</p>
            </InteractiveCard>
          ))}
        </div>

        {!riddle.isSolved && (
          <InteractiveCard className="mt-8 bg-amber-100 dark:bg-slate-700">
            <h3 className="text-2xl font-serif-display mb-3 text-amber-700 dark:text-amber-300">A Puzzling Find...</h3>
            <p className="italic mb-4 font-sans-mono">"{riddle.text}"</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={riddleAttempt}
                onChange={(e) => setRiddleAttempt(e.target.value)}
                placeholder="Your answer..."
                className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <button
                onClick={handleRiddleSubmit}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-semibold rounded-md transition-transform hover:scale-105"
              >
                Solve
              </button>
            </div>
            {riddleFeedback && <p className={`mt-3 text-sm ${riddle.isSolved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-sans-mono`}>{riddleFeedback}</p>}
          </InteractiveCard>
        )}
         {riddle.isSolved && clues.filter(c => c.type === 'riddle_reward' && c.isRevealed).map(clue => (
             <InteractiveCard key={clue.id} className="mt-4 bg-green-50 dark:bg-green-900 border-l-4 border-green-500 animate-fade-in">
                <h4 className="font-bold text-green-700 dark:text-green-300">Riddle Solved! New Insight:</h4>
                <p className="text-lg font-semibold mt-1">{clue.description}</p>
                <p className="text-sm mt-1 font-sans-mono">{clue.details}</p>
            </InteractiveCard>
         ))}
      </div>
    );
  };
  
  const renderSuspects = () => {
    if (!caseData) return <p>Error: Case data not loaded.</p>;
    return (
      <div className="p-4 md:p-8 space-y-6">
        <h2 className="text-3xl font-serif-display text-center border-b-2 border-amber-500 pb-2 mb-6">The Suspects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseData.suspects.map(suspect => (
            <InteractiveCard 
              key={suspect.id} 
              className="flex flex-col items-center text-center"
              onClick={() => onSelectSuspect(suspect.id)} // For future interrogation feature
            >
              <img src={suspect.imageUrl} alt={suspect.name} className="w-40 h-48 object-cover rounded-md mb-3 shadow-sm" />
              <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-400">{suspect.name}</h3>
              <p className="text-sm font-sans-mono mt-1">{suspect.background}</p>
              <p className="text-xs italic mt-2 font-sans-mono">Motive/Alibi: {suspect.motiveOrAlibi}</p>
            </InteractiveCard>
          ))}
        </div>
         <div className="text-center mt-8">
            <button 
                onClick={() => {/* This button should change stage to deduction, handled by App.tsx */}}
                className="px-8 py-3 bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105 transform"
            >
                Proceed to Deduction
            </button>
        </div>
      </div>
    );
  };

  const renderDeduction = () => {
    if (!caseData) return <p>Error: Case data not loaded.</p>;
    return (
      <div className="p-4 md:p-8 space-y-6">
        <h2 className="text-3xl font-serif-display text-center border-b-2 border-amber-500 pb-2 mb-6">Make Your Accusation</h2>
        <p className="text-center font-sans-mono mb-6">Review the evidence and the suspects. Who is the culprit?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {caseData.suspects.map(suspect => (
            <InteractiveCard 
              key={suspect.id} 
              onClick={() => setSelectedSuspectForAccusation(suspect.id)}
              isHighlighted={selectedSuspectForAccusation === suspect.id}
              className="flex flex-col items-center text-center"
            >
              <img src={suspect.imageUrl} alt={suspect.name} className="w-32 h-40 object-cover rounded-md mb-3 shadow-sm" />
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400">{suspect.name}</h3>
            </InteractiveCard>
          ))}
        </div>
        {selectedSuspectForAccusation && (
          <div className="text-center animate-fade-in">
            <button
              onClick={() => onMakeAccusation(selectedSuspectForAccusation)}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105 transform"
            >
              Accuse {caseData.suspects.find(s => s.id === selectedSuspectForAccusation)?.name}
            </button>
          </div>
        )}
      </div>
    );
  };
  
  const renderResolution = () => {
    if (!caseData) return <p>Error: Case data not loaded.</p>;
    const culprit = caseData.suspects.find(s => s.id === caseData.culpritId);
    const playerCorrect = selectedSuspectForAccusation === caseData.culpritId;

    return (
      <div className="p-4 md:p-8 text-center space-y-6 animate-slide-in-up">
        <h2 className="text-4xl font-serif-display mb-4">
          {playerCorrect ? "Case Closed! Excellent Work, Detective!" : "Case Cold... Not Quite, Detective."}
        </h2>
        <div className={`p-6 rounded-lg shadow-xl ${playerCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
          <p className="text-lg font-sans-mono mb-4">You accused: <span className="font-bold">{caseData.suspects.find(s => s.id === selectedSuspectForAccusation)?.name || 'Unknown'}</span></p>
          <p className="text-lg font-sans-mono mb-4">The true culprit was: <span className="font-bold">{culprit?.name || 'Unknown'}</span></p>
          <img src={culprit?.imageUrl} alt={culprit?.name} className="w-48 h-60 object-cover rounded-md mx-auto mb-4 shadow-lg border-4 border-amber-300 dark:border-amber-600" />
          
          <h3 className="text-2xl font-serif-display mt-6 mb-2 text-slate-700 dark:text-slate-200">The Full Story:</h3>
          <p className="font-sans-mono text-left whitespace-pre-wrap">
            {showFullCulpritReason || caseData.culpritReason.length < 300 ? caseData.culpritReason : `${caseData.culpritReason.substring(0, 300)}...`}
          </p>
          {caseData.culpritReason.length > 300 && !showFullCulpritReason && (
            <button 
                onClick={() => setShowFullCulpritReason(true)} 
                className="text-amber-600 dark:text-amber-400 hover:underline mt-2 font-sans-mono"
            >
                Read Full Confession
            </button>
          )}
        </div>
        <button
          onClick={onPlayAgain}
          className="mt-8 px-8 py-3 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold rounded-lg shadow-md transition-transform hover:scale-105 transform"
        >
          Start a New Case
        </button>
      </div>
    );
  };

  switch (stage) {
    case GameStage.Intro:
      return renderIntro();
    case GameStage.CrimeScene:
    case GameStage.RiddleActive: // Riddle is part of CrimeScene view now
      return renderCrimeScene();
    case GameStage.Suspects:
      return renderSuspects();
    case GameStage.Deduction:
      return renderDeduction();
    case GameStage.Resolution:
      return renderResolution();
    default:
      return <p>Unknown game stage.</p>;
  }
};

export default GameDisplay;
