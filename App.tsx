
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import GameDisplay from './components/GameDisplay';
import LoadingOverlay from './components/common/LoadingOverlay';
import { generateNewCase } from './services/geminiService';
import { GameStage, CaseData, Theme, Clue } from './types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme;
      if (storedTheme) return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [currentStage, setCurrentStage] = useState<GameStage>(GameStage.Intro);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading...");
  const [selectedSuspectForAccusation, setSelectedSuspectForAccusation] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove(theme === 'light' ? 'dark' : 'light');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const startNewCase = useCallback(async () => {
    setCurrentStage(GameStage.CaseLoading);
    setIsLoading(true);
    setLoadingMessage("Generating your next case file...");
    setSelectedSuspectForAccusation(null);
    const newCase = await generateNewCase();
    if (newCase) {
      setCaseData(newCase);
      setCurrentStage(GameStage.CrimeScene);
    } else {
      // Handle error - maybe show a message and revert to Intro
      alert("Failed to generate a new case. Please check console and ensure API key is valid. Try again later.");
      setCurrentStage(GameStage.Intro);
    }
    setIsLoading(false);
  }, []);

  const handleSolveRiddle = (answer: string): boolean => {
    if (!caseData) return false;
    const isCorrect = answer.trim().toLowerCase() === caseData.riddle.answer.trim().toLowerCase();
    if (isCorrect) {
      setCaseData(prevCase => {
        if (!prevCase) return null;
        const updatedClues = prevCase.clues.map(clue => 
          clue.id === prevCase.riddle.relatedClueId 
            ? { ...clue, isRevealed: true, isNewlyDiscovered: true } 
            : clue
        );
        // Remove isNewlyDiscovered flag after a short delay for animation
        setTimeout(() => {
            setCaseData(p => p ? ({...p, clues: p.clues.map(c => ({...c, isNewlyDiscovered: false}))}) : null);
        }, 3000);

        return {
          ...prevCase,
          riddle: { ...prevCase.riddle, isSolved: true },
          clues: updatedClues,
        };
      });
      // Optionally, automatically move to next stage or let user explore
      // setCurrentStage(GameStage.CrimeScene); // Stay on crime scene to see new clue
    }
    return isCorrect;
  };
  
  const handleSelectSuspect = (suspectId: string) => {
    // For now, this just prepares for deduction. Could be expanded for interrogation.
    console.log("Selected suspect:", suspectId);
    // If we want to directly move to deduction after viewing suspects:
    // setSelectedSuspectForAccusation(suspectId);
    // setCurrentStage(GameStage.Deduction);
  };

  const handleMakeAccusation = (suspectId: string) => {
    setSelectedSuspectForAccusation(suspectId); // Ensure it's set before moving to resolution
    setCurrentStage(GameStage.Resolution);
  };
  
  const handlePlayAgain = () => {
    setCaseData(null);
    startNewCase();
  };

  // Effect for initial load or specific actions on stage change
  useEffect(() => {
    if (currentStage === GameStage.Intro && !caseData) {
      // Potentially pre-load something or just wait for user action
    }
  }, [currentStage, caseData]);


  const navigateToSuspects = () => {
    setCurrentStage(GameStage.Suspects);
  }
  const navigateToDeduction = () => {
    setCurrentStage(GameStage.Deduction);
  }


  // Main render
  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased theme-${theme}`}>
      <Header theme={theme} toggleTheme={toggleTheme} />
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <GameDisplay
          stage={currentStage}
          caseData={caseData}
          onStartNewCase={startNewCase}
          onSolveRiddle={handleSolveRiddle}
          onSelectSuspect={handleSelectSuspect} // This will be for clicking suspects in Suspects view
          onMakeAccusation={handleMakeAccusation} // This is for the final accusation
          onPlayAgain={handlePlayAgain}
          selectedSuspectForAccusation={selectedSuspectForAccusation}
          setSelectedSuspectForAccusation={setSelectedSuspectForAccusation}
        />
        {/* Navigation buttons based on stage */}
        <div className="mt-8 text-center space-x-4">
            {currentStage === GameStage.CrimeScene && caseData && (
                <button 
                    onClick={navigateToSuspects}
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-600 text-white font-semibold rounded-md shadow-md transition-transform hover:scale-105"
                >
                    View Suspects
                </button>
            )}
            {currentStage === GameStage.Suspects && caseData && (
                 <button 
                    onClick={() => setCurrentStage(GameStage.CrimeScene)}
                    className="px-6 py-2 bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-700 text-white font-semibold rounded-md shadow-md transition-transform hover:scale-105"
                >
                    Revisit Crime Scene
                </button>
            )}
             {currentStage === GameStage.Suspects && caseData && (
                <button 
                    onClick={navigateToDeduction}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-semibold rounded-md shadow-md transition-transform hover:scale-105"
                >
                    Proceed to Deduction
                </button>
            )}
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400 font-sans-mono border-t border-slate-200 dark:border-slate-700 mt-8">
        <p>&copy; {new Date().getFullYear()} Gemini Detective Agency. All rights reserved (not really).</p>
      </footer>
    </div>
  );
};

export default App;
