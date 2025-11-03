// Persistence utilities for the TTS Prosody Builder
// Handles saving and loading data to/from localStorage

export interface PersistedData {
  // Scenario Refinement Tool
  scenarioRefinement?: {
    scenarios: any[];
    completedPhases: string[];
  };
  
  // Numeric Equivalence Calculator
  numericEquivalence?: {
    editableParams: any;
    isEditing: boolean;
    activeScenario: string;
  };
  
  // Sentence Structure Tool
  sentenceStructure?: {
    generatedScenarios: any[];
    customInputs: any;
    activeTemplate: string;
  };
  
  // Prosody Annotation Tool
  prosodyAnnotation?: {
    selectedPreset: string;
    customProsody: any;
    inputText: string;
    emphasisWords: any[];
    scenarios?: any[];
  };
  
  // Attention Check Generator
  attentionChecks?: {
    activeScenario: string;
    generatedChecks: any[];
  };
  
  // Filler Prompt Generator
  fillerPrompts?: {
    activeCategory: string;
    generatedPrompts: any[];
  };
  
  // Quality Checklist Tool
  qualityChecklist?: {
    completedChecks: any[];
    overallStatus: string;
  };
  
  // App-wide settings
  appSettings?: {
    activePhase: string;
    lastUpdated: string;
  };
}

const STORAGE_KEY = 'tts-prosody-builder-data';

export const saveToStorage = (data: Partial<PersistedData>): void => {
  try {
    const existingData = loadFromStorage();
    const updatedData = { ...existingData, ...data };
    updatedData.appSettings = {
      ...updatedData.appSettings,
      activePhase: updatedData.appSettings?.activePhase || 'home',
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromStorage = (): PersistedData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return {};
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

export const exportData = (): string => {
  const data = loadFromStorage();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn('Failed to import data:', error);
    return false;
  }
};

// Helper function to auto-save data with debouncing
export const createAutoSave = (key: string, delay: number = 1000) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (data: any) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      saveToStorage({ [key]: data });
    }, delay);
  };
};
