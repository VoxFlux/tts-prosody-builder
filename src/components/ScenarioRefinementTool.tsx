import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Edit, Save, X, Send, Download } from 'lucide-react';
import { loadFromStorage, createAutoSave, saveToStorage } from '../utils/persistence';

const ScenarioRefinementTool = () => {
  const [scenarios, setScenarios] = useState<any[]>([
    {
      id: 1,
      domain: "Banking",
      context: "Credit Card Selection",
      optionA: {
        text: "The Premium Card has a €49 annual fee, offers 1% cashback on all purchases, and includes comprehensive travel insurance with emergency assistance worldwide.",
        attributes: { fee: 49, cashback: 1.0, feature: "travel insurance" }
      },
      optionB: {
        text: "The Classic Card has no annual fee, provides 0.6% cashback on all purchases, and offers optional travel insurance available for purchase separately.",
        attributes: { fee: 0, cashback: 0.6, feature: "optional insurance" }
      },
      status: "draft",
      notes: "",
      manipulationTarget: "A",
      variantType: "Balanced"
    },
    {
      id: 2,
      domain: "Insurance",
      context: "Health Plan Deductible vs Premium",
      optionA: {
        text: "Plan A costs €35 per month with a €350 annual deductible. After you meet the deductible, all covered services are fully paid.",
        attributes: { monthly: 35, deductible: 350, coverage: "full after deductible" }
      },
      optionB: {
        text: "Plan B costs €20 per month with a €500 annual deductible. After you meet the deductible, all covered services are fully paid.",
        attributes: { monthly: 20, deductible: 500, coverage: "full after deductible" }
      },
      status: "draft",
      notes: "",
      manipulationTarget: "A",
      variantType: "Balanced"
    },
    {
      id: 3,
      domain: "Mobile",
      context: "Data Plan Choice",
      optionA: {
        text: "The Standard Plan includes 40 gigabytes of data per month, costs €15 monthly, and provides 5G Plus network access with priority support.",
        attributes: { data: 40, price: 15, feature: "5G Plus + priority" }
      },
      optionB: {
        text: "The Extended Plan includes 60 gigabytes of data per month, costs €18 monthly, and provides standard 5G network access.",
        attributes: { data: 60, price: 18, feature: "5G standard" }
      },
      status: "draft",
      notes: "",
      manipulationTarget: "B",
      variantType: "Balanced"
    },
    {
      id: 4,
      domain: "Energy",
      context: "Tariff Type (Fixed vs Variable)",
      optionA: {
        text: "The Fixed Rate plan charges €0.27 per kilowatt-hour with a €5 monthly service fee. Your rate stays the same for 12 months.",
        attributes: { rate: 0.27, fee: 5, type: "fixed 12mo" }
      },
      optionB: {
        text: "The Variable Rate plan charges between €0.25 and €0.29 per kilowatt-hour with no monthly service fee. Your rate adjusts quarterly based on market conditions.",
        attributes: { rate: "0.25-0.29", fee: 0, type: "variable quarterly" }
      },
      status: "draft",
      notes: "",
      manipulationTarget: "A",
      variantType: "Balanced"
    },
    {
      id: 5,
      domain: "Subscription",
      context: "Cancel vs Continue",
      optionA: {
        text: "Continue your subscription at €8.99 per month. You keep access to two premium channels and can cancel anytime without penalties.",
        attributes: { price: 8.99, channels: 2, commitment: "none" }
      },
      optionB: {
        text: "Cancel your subscription now at no cost. You can resubscribe later, though your current preferences and watch history will not be saved.",
        attributes: { price: 0, channels: 0, commitment: "lose data" }
      },
      status: "draft",
      notes: "",
      manipulationTarget: "A",
      variantType: "Balanced"
    }
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState({ optionA: "", optionB: "" });
  const [activeTab, setActiveTab] = useState("review");

  // Auto-save function
  const autoSave = createAutoSave('scenarioRefinement');

  // Load data on component mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (
      savedData.scenarioRefinement &&
      Array.isArray(savedData.scenarioRefinement.scenarios)
    ) {
      setScenarios(savedData.scenarioRefinement.scenarios);
    }
    if (
      savedData.scenarioRefinement &&
      typeof (savedData.scenarioRefinement as any).activeTab === "string"
    ) {
      setActiveTab((savedData.scenarioRefinement as any).activeTab);
    }
  }, []);

  // Save data whenever scenarios or activeTab changes
  useEffect(() => {
    autoSave({
      scenarios,
      activeTab
    });
  }, [scenarios, activeTab]);

  const analyzeText = (text: string) => {
    const sentences = text.split('.').filter((s: string) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w: string) => w.length > 0);

    // Count numeric numbers (€45, 1.5%, etc.)
    const numericNumbers = (text.match(/€?\d+(\.\d+)?%?/g) || []).length;

    // Count hyphenated spelled-out numbers (forty-five, one-point-five, twenty-five-thousand, etc.)
    const lowerText = text.toLowerCase();
    const hyphenatedNumbers = (lowerText.match(/\b[a-z]+-[a-z-]+\b/g) || []).length;

    // Count single number words (zero, one, two, ... ninety) that aren't part of hyphenated numbers
    const singleNumberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                                'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
                                'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty',
                                'sixty', 'seventy', 'eighty', 'ninety'];

    // Remove all hyphenated words first, then count single number words in what remains
    const textWithoutHyphenated = lowerText.replace(/\b[a-z]+-[a-z-]+\b/g, '');
    const singleNumbers = singleNumberWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = textWithoutHyphenated.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);

    const totalNumbers = numericNumbers + hyphenatedNumbers + singleNumbers;

    // Check for persuasive language
    const persuasiveWords = ['best', 'better', 'premium', 'superior', 'excellent', 'perfect', 'ideal', 'recommended', 'popular', 'most', 'guaranteed', 'exclusive'];
    const foundPersuasive = persuasiveWords.filter(word =>
      text.toLowerCase().includes(word)
    );

    return {
      sentences: sentences.length,
      words: words.length,
      characters: text.length,
      numbers: totalNumbers,
      persuasiveWords: foundPersuasive,
      avgWordLength: (text.replace(/[^a-zA-Z]/g, '').length / words.length).toFixed(1)
    };
  };

  const compareOptions = (optionA: any, optionB: any) => {
    const statsA = analyzeText(optionA.text);
    const statsB = analyzeText(optionB.text);
    
    const sentenceDiff = Math.abs(statsA.sentences - statsB.sentences);
    const wordDiff = Math.abs(statsA.words - statsB.words);
    const wordDiffPercent = (wordDiff / Math.max(statsA.words, statsB.words)) * 100;
    const charDiff = Math.abs(statsA.characters - statsB.characters);
    const charDiffPercent = (charDiff / Math.max(statsA.characters, statsB.characters)) * 100;
    const numberDiff = Math.abs(statsA.numbers - statsB.numbers);

    const balanced = 
      sentenceDiff === 0 && 
      wordDiffPercent <= 10 && 
      charDiffPercent <= 10 && 
      numberDiff === 0 &&
      statsA.persuasiveWords.length === 0 &&
      statsB.persuasiveWords.length === 0;

    return {
      statsA,
      statsB,
      sentenceDiff,
      wordDiff,
      wordDiffPercent,
      charDiff,
      charDiffPercent,
      numberDiff,
      balanced,
      issues: [
        sentenceDiff > 0 ? `Sentence count differs by ${sentenceDiff}` : null,
        wordDiffPercent > 10 ? `Word count differs by ${wordDiffPercent}%` : null,
        charDiffPercent > 10 ? `Character count differs by ${charDiffPercent}%` : null,
        numberDiff > 0 ? `Number count differs by ${numberDiff}` : null,
        statsA.persuasiveWords.length > 0 ? `Option A contains persuasive words: ${statsA.persuasiveWords.join(', ')}` : null,
        statsB.persuasiveWords.length > 0 ? `Option B contains persuasive words: ${statsB.persuasiveWords.join(', ')}` : null,
      ].filter(Boolean)
    };
  };

  const startEditing = (scenario: any) => {
    setEditingId(scenario.id);
    setEditedText({
      optionA: scenario.optionA.text,
      optionB: scenario.optionB.text
    });
  };

  const saveEdits = () => {
    setScenarios(scenarios.map(s => 
      s.id === editingId 
        ? {
            ...s,
            optionA: { ...s.optionA, text: editedText.optionA },
            optionB: { ...s.optionB, text: editedText.optionB }
          }
        : s
    ));
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedText({ optionA: "", optionB: "" });
  };

  const updateStatus = (id: any, status: any, notes = "") => {
    setScenarios(scenarios.map(s => 
      s.id === id ? { ...s, status, notes } : s
    ));
  };

  const deleteScenario = (id: any) => {
    if (confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      setScenarios(scenarios.filter(s => s.id !== id));
    }
  };

  const sendToProsodyAnnotation = (scenario: any) => {
    console.log('Sending scenario to Prosody Annotation:', scenario);
    const savedData = loadFromStorage();
    const existingScenarios = savedData.prosodyAnnotation?.scenarios || [];

    // Check if scenario already exists
    const alreadyExists = existingScenarios.some((s: any) => s.id === scenario.id);

    if (alreadyExists) {
      alert('This scenario has already been sent to Prosody Annotation!');
      return;
    }

    // Add scenario to prosody annotation list
    const updatedScenarios = [...existingScenarios, {
      id: scenario.id,
      domain: scenario.domain,
      context: scenario.context,
      optionA: scenario.optionA.text,
      optionB: scenario.optionB.text,
      addedAt: new Date().toISOString()
    }];

    console.log('Updated scenarios to save:', updatedScenarios);

    const currentProsody = savedData.prosodyAnnotation || {
      selectedPreset: 'neutral',
      customProsody: {},
      inputText: '',
      emphasisWords: []
    };

    saveToStorage({
      prosodyAnnotation: {
        ...currentProsody,
        scenarios: updatedScenarios
      }
    });

    console.log('Scenarios saved to localStorage');

    // Dispatch custom event to notify Prosody Annotation Tool
    window.dispatchEvent(new Event('prosodyScenariosUpdated'));
    console.log('Dispatched prosodyScenariosUpdated event');

    alert('Scenario sent to Prosody Annotation! Navigate to the Prosody tool to annotate it.');
  };

  const clearAllScenarios = () => {
    if (confirm('Are you sure you want to clear all scenarios? This action cannot be undone.')) {
      setScenarios([]);
    }
  };

  const updateManipulationTarget = (id: number, target: "A" | "B") => {
    setScenarios(scenarios.map(s =>
      s.id === id ? { ...s, manipulationTarget: target } : s
    ));
  };

  const updateVariantType = (id: number, variantType: "Balanced" | "Slightly-Worse") => {
    setScenarios(scenarios.map(s =>
      s.id === id ? { ...s, variantType } : s
    ));
  };

  const exportApprovedScenarios = () => {
    const approved = scenarios.filter(s => s.status === "approved");

    if (approved.length === 0) {
      alert('No approved scenarios to export. Please approve at least one scenario first.');
      return;
    }

    // Format for export
    const exportData = approved.map(s => ({
      id: s.id,
      domain: s.domain,
      context: s.context,
      manipulationTarget: s.manipulationTarget || "A",
      variantType: s.variantType || "Balanced",
      optionA: s.optionA.text,
      optionB: s.optionB.text,
      attributes: {
        optionA: s.optionA.attributes,
        optionB: s.optionB.attributes
      },
      notes: s.notes
    }));

    // Create JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    // Download
    const link = document.createElement('a');
    link.href = url;
    link.download = `approved-scenarios-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Successfully exported ${approved.length} approved scenario(s)!`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          TTS Prosody Scenario Refinement Tool
        </h1>
        <p className="text-gray-600 mb-4">
          Review and refine experimental scenarios for neutrality, balance, and cognitive load parity
        </p>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("review")}
            className={`px-4 py-2 rounded ${activeTab === "review" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Review Scenarios
          </button>
          <button
            onClick={() => setActiveTab("guidelines")}
            className={`px-4 py-2 rounded ${activeTab === "guidelines" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Writing Guidelines
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 rounded ${activeTab === "summary" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Summary Report
          </button>
        </div>
      </div>

      {activeTab === "review" && (
        <div className="space-y-6">
          {scenarios.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Scenarios ({scenarios.length})
                </h3>
                <button
                  onClick={clearAllScenarios}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 text-sm"
                >
                  <X size={16} />
                  Clear All Scenarios
                </button>
              </div>
            </div>
          )}
          {scenarios.map(scenario => {
            const comparison = compareOptions(scenario.optionA, scenario.optionB);
            const isEditing = editingId === scenario.id;

            return (
              <div key={scenario.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Scenario {scenario.id}: {scenario.domain}
                    </h3>
                    <p className="text-gray-600">{scenario.context}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {comparison.balanced ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={20} />
                        <span className="text-sm font-medium">Balanced</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">Needs Work</span>
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      scenario.status === "approved" ? "bg-green-100 text-green-800" :
                      scenario.status === "needs-revision" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {scenario.status === "approved" ? "Approved" :
                       scenario.status === "needs-revision" ? "Needs Revision" :
                       "Draft"}
                    </span>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => startEditing(scenario)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Edit scenario"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteScenario(scenario.id)}
                          className="p-2 hover:bg-red-100 rounded text-red-600"
                          title="Delete scenario"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!isEditing ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="border rounded p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-900 mb-2">Option A</h4>
                        <p className="text-gray-700 text-sm mb-2">{scenario.optionA.text}</p>
                        <div className="text-xs text-gray-600">
                          <div>Sentences: {comparison.statsA.sentences} | Words: {comparison.statsA.words} | Chars: {comparison.statsA.characters}</div>
                          <div>Numbers: {comparison.statsA.numbers}</div>
                        </div>
                      </div>
                      <div className="border rounded p-4 bg-green-50">
                        <h4 className="font-semibold text-green-900 mb-2">Option B</h4>
                        <p className="text-gray-700 text-sm mb-2">{scenario.optionB.text}</p>
                        <div className="text-xs text-gray-600">
                          <div>Sentences: {comparison.statsB.sentences} | Words: {comparison.statsB.words} | Chars: {comparison.statsB.characters}</div>
                          <div>Numbers: {comparison.statsB.numbers}</div>
                        </div>
                      </div>
                    </div>

                    {comparison.issues.length > 0 && (
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                        <h4 className="font-semibold text-orange-800 mb-2">Issues to Address:</h4>
                        <ul className="list-disc list-inside text-sm text-orange-700">
                          {comparison.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prosody Manipulation Settings */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Manipulation Target (Authoritative Prosody)
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateManipulationTarget(scenario.id, "A")}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex-1 ${
                              (scenario.manipulationTarget || "A") === "A"
                                ? "bg-purple-600 text-white"
                                : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100"
                            }`}
                          >
                            Card A
                          </button>
                          <button
                            onClick={() => updateManipulationTarget(scenario.id, "B")}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex-1 ${
                              (scenario.manipulationTarget || "A") === "B"
                                ? "bg-purple-600 text-white"
                                : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100"
                            }`}
                          >
                            Card B
                          </button>
                        </div>
                        <p className="text-xs text-purple-700 mt-1">
                          Which card will have authoritative prosody applied
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-2">
                          Variant Type
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateVariantType(scenario.id, "Balanced")}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex-1 ${
                              (scenario.variantType || "Balanced") === "Balanced"
                                ? "bg-purple-600 text-white"
                                : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100"
                            }`}
                          >
                            Balanced
                          </button>
                          <button
                            onClick={() => updateVariantType(scenario.id, "Slightly-Worse")}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex-1 ${
                              (scenario.variantType || "Balanced") === "Slightly-Worse"
                                ? "bg-purple-600 text-white"
                                : "bg-white text-purple-700 border border-purple-300 hover:bg-purple-100"
                            }`}
                          >
                            Slightly-Worse
                          </button>
                        </div>
                        <p className="text-xs text-purple-700 mt-1">
                          Equal expected value vs dominated option
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => updateStatus(scenario.id, "approved")}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          scenario.status === "approved"
                            ? "bg-green-700 text-white cursor-default"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                        disabled={scenario.status === "approved"}
                      >
                        {scenario.status === "approved" ? "✓ Approved" : "Approve"}
                      </button>
                      <button
                        onClick={() => updateStatus(scenario.id, "needs-revision")}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                          scenario.status === "needs-revision"
                            ? "bg-orange-700 text-white cursor-default"
                            : "bg-orange-600 text-white hover:bg-orange-700"
                        }`}
                        disabled={scenario.status === "needs-revision"}
                      >
                        {scenario.status === "needs-revision" ? "⚠ Needs Revision" : "Needs Revision"}
                      </button>
                      {scenario.status === "approved" && (
                        <button
                          onClick={() => sendToProsodyAnnotation(scenario)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Send size={16} />
                          Send to Prosody Annotation
                        </button>
                      )}
                      {(scenario.status === "approved" || scenario.status === "needs-revision") && (
                        <button
                          onClick={() => updateStatus(scenario.id, "draft")}
                          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium transition-colors"
                        >
                          Reset to Draft
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Option A Text</label>
                        <textarea
                          value={editedText.optionA}
                          onChange={(e) => setEditedText({...editedText, optionA: e.target.value})}
                          className="w-full p-3 border rounded h-24 text-sm"
                          placeholder="Enter Option A text..."
                          aria-label="Option A text"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-2">Option B Text</label>
                        <textarea
                          value={editedText.optionB}
                          onChange={(e) => setEditedText({...editedText, optionB: e.target.value})}
                          className="w-full p-3 border rounded h-24 text-sm"
                          placeholder="Enter Option B text..."
                          aria-label="Option B text"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdits}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "guidelines" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Writing Guidelines for Neutral Text</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Four-Sentence Template</h3>
              <div className="bg-gray-50 p-4 rounded">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li><strong>Name the product/service</strong> - Clear identification without adjectives</li>
                  <li><strong>Present numeric attributes</strong> - Fixed order, consistent units</li>
                  <li><strong>State trade-off clearly</strong> - "Higher X, lower Y" format</li>
                  <li><strong>Close with availability</strong> - Neutral confirmation without urgency</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Prohibited Persuasive Language</h3>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm mb-2"><strong>Avoid these words:</strong></p>
                <div className="flex flex-wrap gap-2">
                  {['best', 'better', 'premium', 'superior', 'excellent', 'perfect', 'ideal', 'recommended', 'popular', 'most', 'guaranteed', 'exclusive', 'limited', 'special', 'amazing', 'incredible'].map(word => (
                    <span key={word} className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">{word}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Structural Balance Requirements</h3>
              <div className="bg-blue-50 p-4 rounded">
                <ul className="space-y-2 text-sm">
                  <li><strong>✓</strong> Same number of sentences (3-4)</li>
                  <li><strong>✓</strong> Word count difference ≤ 10%</li>
                  <li><strong>✓</strong> Character count difference ≤ 10%</li>
                  <li><strong>✓</strong> Same number of numeric values</li>
                  <li><strong>✓</strong> Same attribute presentation order</li>
                  <li><strong>✓</strong> Consistent units (€, GB, kWh, %)</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Example Neutral vs Persuasive</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded">
                  <h4 className="font-semibold text-red-800 mb-2">❌ Persuasive (Avoid)</h4>
                  <p className="text-sm text-gray-700">
                    "Our <strong>premium</strong> plan offers the <strong>best</strong> value with <strong>incredible</strong> 5G speeds. Most customers <strong>prefer</strong> this option for its <strong>superior</strong> coverage."
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <h4 className="font-semibold text-green-800 mb-2">✓ Neutral (Correct)</h4>
                  <p className="text-sm text-gray-700">
                    "The Extended Plan includes 60 gigabytes of data per month, costs €18 monthly, and provides 5G network access."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Scenario Review Summary</h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="text-2xl font-bold text-green-800">
                {scenarios.filter(s => s.status === "approved").length}
              </div>
              <div className="text-sm text-green-700">Approved</div>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <div className="text-2xl font-bold text-orange-800">
                {scenarios.filter(s => s.status === "needs-revision").length}
              </div>
              <div className="text-sm text-orange-700">Needs Revision</div>
            </div>
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
              <div className="text-2xl font-bold text-gray-800">
                {scenarios.filter(s => s.status === "draft").length}
              </div>
              <div className="text-sm text-gray-700">Not Reviewed</div>
            </div>
          </div>

          {/* Export Button */}
          <div className="mb-6 flex justify-center">
            <button
              onClick={exportApprovedScenarios}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md transition-colors flex items-center gap-2"
              disabled={scenarios.filter(s => s.status === "approved").length === 0}
            >
              <Download size={20} />
              Export Approved Scenarios ({scenarios.filter(s => s.status === "approved").length})
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Detailed Status</h3>
            {scenarios.map(scenario => {
              const comparison = compareOptions(scenario.optionA, scenario.optionB);
              return (
                <div key={scenario.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Scenario {scenario.id}: {scenario.domain}</h4>
                      <p className="text-sm text-gray-600">{scenario.context}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${
                      scenario.status === "approved" ? "bg-green-100 text-green-800" :
                      scenario.status === "needs-revision" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {scenario.status === "approved" ? "Approved" :
                       scenario.status === "needs-revision" ? "Needs Revision" :
                       "Draft"}
                    </span>
                  </div>
                  <div className="text-sm">
                    {comparison.balanced ? (
                      <span className="text-green-600">✓ Structurally balanced</span>
                    ) : (
                      <span className="text-orange-600">⚠ {comparison.issues.length} issue(s) found</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioRefinementTool;