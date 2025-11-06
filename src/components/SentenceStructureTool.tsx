import { useState, useEffect } from 'react';
import { Layout, Copy, CheckCircle, AlertCircle, Download, Trash2, X, FileText } from 'lucide-react';
import { loadFromStorage, createAutoSave } from '../utils/persistence';

const SentenceStructureStandardizer = () => {
  const [activeTemplate, setActiveTemplate] = useState('banking');
  const [customInputs, setCustomInputs] = useState({
    optionA: {
      productName: '',
      attribute1: '',
      attribute2: '',
      attribute3: '',
      attribute4: '',
      attribute5: '',
      attribute6: '',
      tradeoff: '',
      availability: ''
    },
    optionB: {
      productName: '',
      attribute1: '',
      attribute2: '',
      attribute3: '',
      attribute4: '',
      attribute5: '',
      attribute6: '',
      tradeoff: '',
      availability: ''
    }
  });
  
  // Template structures for each domain
  const templates = {
    banking: {
      name: "Banking / Credit Cards",
      structure: [
        "The [PRODUCT_NAME] has an annual fee of [ATTRIBUTE_1].",
        "It offers [ATTRIBUTE_2] cashback on all purchases.",
        "Travel insurance coverage is [ATTRIBUTE_3].",
        "The APR is [ATTRIBUTE_4].",
        "You'll receive a welcome bonus of [ATTRIBUTE_5].",
        "[ATTRIBUTE_6]."
      ],
      example: {
        optionA: {
          productName: "TravelPlus Card",
          attribute1: "forty-five euros",
          attribute2: "one-point-five percent",
          attribute3: "fifty-thousand euros",
          attribute4: "twelve-point-nine percent",
          attribute5: "one-hundred-fifty euros",
          attribute6: "There are no foreign transaction fees",
          tradeoff: "",
          availability: ""
        },
        optionB: {
          productName: "CashRewards Card",
          attribute1: "zero euros",
          attribute2: "two percent",
          attribute3: "twenty-five-thousand euros",
          attribute4: "fourteen-point-nine percent",
          attribute5: "one-hundred euros",
          attribute6: "Foreign transaction fees are one-point-seven-five percent",
          tradeoff: "",
          availability: ""
        }
      },
      guidelines: [
        "Attribute 1: Annual Fee (hyphenate multi-word numbers: 'forty-five euros' not '€45')",
        "Attribute 2: Cashback Rate (hyphenate decimals: 'one-point-five percent' not '1.5%')",
        "Attribute 3: Travel Insurance Coverage (hyphenate: 'fifty-thousand euros')",
        "Attribute 4: APR (hyphenate decimals: 'twelve-point-nine percent')",
        "Attribute 5: Welcome Bonus (hyphenate: 'one-hundred-fifty euros')",
        "Attribute 6: Foreign Transaction Fees (full sentence, hyphenate any numbers)",
        "Keep same sentence structure for both cards",
        "Same number of sentences (6 total) for parity",
        "Use hyphens for all multi-word numbers to ensure accurate counting"
      ]
    },
    insurance: {
      name: "Insurance / Health Plans",
      structure: [
        "Plan [PRODUCT_NAME] costs [ATTRIBUTE_1] per month with a [ATTRIBUTE_2] annual deductible.",
        "After you meet the deductible, [ATTRIBUTE_3].",
        "Both plans include prescription coverage and preventive care visits.",
        "Which plan would you prefer?"
      ],
      example: {
        optionA: {
          productName: "A",
          attribute1: "€35",
          attribute2: "€350",
          attribute3: "all covered services are fully paid",
          tradeoff: "Lower deductible means higher monthly premium",
          availability: "enrollment available"
        },
        optionB: {
          productName: "B",
          attribute1: "€20",
          attribute2: "€500",
          attribute3: "all covered services are fully paid",
          tradeoff: "Higher deductible means lower monthly premium",
          availability: "enrollment available"
        }
      },
      guidelines: [
        "Attribute 1: Monthly premium (€X format)",
        "Attribute 2: Annual deductible (€X format)",
        "Attribute 3: Coverage statement after deductible",
        "Always mention what happens 'after deductible'"
      ]
    },
    mobile: {
      name: "Mobile / Data Plans",
      structure: [
        "The [PRODUCT_NAME] Plan includes [ATTRIBUTE_1] of data per month, costs [ATTRIBUTE_2] monthly, and provides [ATTRIBUTE_3].",
        "[TRADEOFF_STATEMENT].",
        "Both plans include unlimited calls and texts within the EU.",
        "Which plan would you prefer?"
      ],
      example: {
        optionA: {
          productName: "Standard",
          attribute1: "40 gigabytes",
          attribute2: "€15",
          attribute3: "5G Plus network access with priority support",
          tradeoff: "Less data with enhanced network features",
          availability: "activation within 24 hours"
        },
        optionB: {
          productName: "Extended",
          attribute1: "60 gigabytes",
          attribute2: "€18",
          attribute3: "standard 5G network access",
          tradeoff: "More data at a higher monthly rate",
          availability: "activation within 24 hours"
        }
      },
      guidelines: [
        "Attribute 1: Data allowance (X gigabytes format)",
        "Attribute 2: Monthly cost (€X format)",
        "Attribute 3: Network type and extras",
        "Use 'gigabytes' not 'GB' in speech"
      ]
    },
    energy: {
      name: "Energy / Electricity Tariffs",
      structure: [
        "The [PRODUCT_NAME] plan charges [ATTRIBUTE_1] per kilowatt-hour with a [ATTRIBUTE_2] monthly service fee.",
        "[ATTRIBUTE_3].",
        "Both plans use 100% renewable energy sources.",
        "Which plan would you prefer?"
      ],
      example: {
        optionA: {
          productName: "Fixed Rate",
          attribute1: "€0.27",
          attribute2: "€5",
          attribute3: "Your rate stays the same for 12 months",
          tradeoff: "Fixed pricing protects against market increases",
          availability: "switch available"
        },
        optionB: {
          productName: "Variable Rate",
          attribute1: "between €0.25 and €0.29",
          attribute2: "€0",
          attribute3: "Your rate adjusts quarterly based on market conditions",
          tradeoff: "No monthly fee but rate fluctuates with market",
          availability: "switch available"
        }
      },
      guidelines: [
        "Attribute 1: Rate per kWh (€0.XX format)",
        "Attribute 2: Monthly base fee (€X format)",
        "Attribute 3: Rate stability statement",
        "Use 'kilowatt-hour' not 'kWh' in speech"
      ]
    },
    subscription: {
      name: "Subscription / Retention",
      structure: [
        "[PRODUCT_NAME] your subscription at [ATTRIBUTE_1] per month.",
        "[ATTRIBUTE_2].",
        "[ATTRIBUTE_3].",
        "Would you like to continue or cancel?"
      ],
      example: {
        optionA: {
          productName: "Continue",
          attribute1: "€8.99",
          attribute2: "You keep access to two premium channels and can cancel anytime without penalties",
          attribute3: "Your saved playlists and preferences will remain active",
          tradeoff: "Continuing maintains all your personalized content",
          availability: "effective immediately"
        },
        optionB: {
          productName: "Cancel",
          attribute1: "€0",
          attribute2: "You lose access to all premium channels immediately",
          attribute3: "Your saved playlists and preferences will be deleted",
          tradeoff: "Canceling saves money but you lose all saved content",
          availability: "effective immediately"
        }
      },
      guidelines: [
        "Attribute 1: Monthly cost (€X.XX format)",
        "Attribute 2: Access and flexibility statement",
        "Attribute 3: Data/content preservation statement",
        "Frame as continue vs cancel (not A vs B)"
      ]
    }
  };

  const [generatedScenarios, setGeneratedScenarios] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData.sentenceStructure?.generatedScenarios) {
      setGeneratedScenarios(savedData.sentenceStructure.generatedScenarios);
    }
    if (savedData.sentenceStructure?.activeTemplate) {
      setActiveTemplate(savedData.sentenceStructure.activeTemplate);
    }
    if (savedData.sentenceStructure?.customInputs) {
      setCustomInputs(savedData.sentenceStructure.customInputs);
    }
  }, []);

  const autoSave = createAutoSave('sentenceStructure');

  // Save data whenever generatedScenarios, activeTemplate, or customInputs changes
  useEffect(() => {
    autoSave({
      generatedScenarios,
      activeTemplate,
      customInputs
    });
  }, [generatedScenarios, activeTemplate, customInputs, autoSave]);

  const generateFromTemplate = (templateKey: string, inputs: any, option = 'A') => {
    const template = (templates as any)[templateKey];
    const inputData = option === 'A' ?
      (inputs.optionA || inputs) :
      (inputs.optionB || inputs);

    let text = template.structure.map((sentence: string) => {
      return sentence
        .replace('[PRODUCT_NAME]', inputData.productName || template.example[`option${option}`].productName)
        .replace('[ATTRIBUTE_1]', inputData.attribute1 || template.example[`option${option}`].attribute1)
        .replace('[ATTRIBUTE_2]', inputData.attribute2 || template.example[`option${option}`].attribute2)
        .replace('[ATTRIBUTE_3]', inputData.attribute3 || template.example[`option${option}`].attribute3)
        .replace('[ATTRIBUTE_4]', inputData.attribute4 || template.example[`option${option}`].attribute4 || '')
        .replace('[ATTRIBUTE_5]', inputData.attribute5 || template.example[`option${option}`].attribute5 || '')
        .replace('[ATTRIBUTE_6]', inputData.attribute6 || template.example[`option${option}`].attribute6 || '')
        .replace('[TRADEOFF_STATEMENT]', inputData.tradeoff || template.example[`option${option}`].tradeoff || '')
        .replace('[AVAILABILITY]', inputData.availability || template.example[`option${option}`].availability || '');
    }).join(' ');

    return text;
  };

  const analyzeText = (text: string) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
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

    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      charCount: text.length,
      numberCount: totalNumbers,
      sentences: sentences.map((s: string) => s.trim())
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deleteScenario = (index: number) => {
    const newScenarios = generatedScenarios.filter((_, idx) => idx !== index);
    setGeneratedScenarios(newScenarios);
  };

  const clearAllScenarios = () => {
    setGeneratedScenarios([]);
  };

  const currentTemplate = (templates as any)[activeTemplate];
  const exampleTextA = generateFromTemplate(activeTemplate, currentTemplate.example, 'A');
  const exampleTextB = generateFromTemplate(activeTemplate, currentTemplate.example, 'B');
  const analysisA = analyzeText(exampleTextA);
  const analysisB = analyzeText(exampleTextB);

  const addToGenerated = () => {
    const optionAText = generateFromTemplate(activeTemplate, customInputs, 'A');
    const optionBText = generateFromTemplate(activeTemplate, customInputs, 'B');

    setGeneratedScenarios([...generatedScenarios, {
      domain: currentTemplate.name,
      optionA: optionAText,
      optionB: optionBText,
      timestamp: new Date().toISOString()
    }]);

    // Reset inputs
    setCustomInputs({
      optionA: {
        productName: '',
        attribute1: '',
        attribute2: '',
        attribute3: '',
        attribute4: '',
        attribute5: '',
        attribute6: '',
        tradeoff: '',
        availability: ''
      },
      optionB: {
        productName: '',
        attribute1: '',
        attribute2: '',
        attribute3: '',
        attribute4: '',
        attribute5: '',
        attribute6: '',
        tradeoff: '',
        availability: ''
      }
    });
  };

  const exportScenarios = () => {
    const exportText = generatedScenarios.map((scenario: any, idx: number) => {
      return `Scenario ${idx + 1}: ${scenario.domain}\n\nOption A:\n${scenario.optionA}\n\nOption B:\n${scenario.optionB}\n\n${'='.repeat(80)}\n\n`;
    }).join('');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'standardized_scenarios.txt';
    a.click();
  };

  const appendToRefinement = () => {
    if (generatedScenarios.length === 0) {
      alert('No scenarios to send. Please generate some scenarios first.');
      return;
    }

    // Get existing data from localStorage
    const savedData = loadFromStorage();
    
    // Convert generated scenarios to the format expected by ScenarioRefinementTool
    const newScenarios = generatedScenarios.map((scenario: any, idx: number) => {
      return {
        id: idx + 1, // Start from 1 for new scenarios
        domain: scenario.domain.split(' / ')[0], // Extract just the domain name
        context: `${scenario.domain} Selection`,
        optionA: {
          text: scenario.optionA,
          attributes: {} // Will be analyzed by the refinement tool
        },
        optionB: {
          text: scenario.optionB,
          attributes: {} // Will be analyzed by the refinement tool
        },
        status: "draft",
        notes: "Generated from Sentence Structure Tool"
      };
    });

    // Replace the scenarios in localStorage (don't append, replace)
    const updatedData = {
      ...savedData,
      scenarioRefinement: {
        ...savedData.scenarioRefinement,
        scenarios: newScenarios,
        activeTab: "scenarios" // Set to scenarios tab
      }
    };
    
    localStorage.setItem('tts-prosody-builder-data', JSON.stringify(updatedData));
    
    alert(`Successfully replaced scenarios in the Text Review & Refinement tool with ${newScenarios.length} new scenario(s). You can now navigate to that phase to review them.`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Layout className="text-purple-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">
            Sentence Structure Standardization Tool
          </h1>
        </div>
        <p className="text-gray-600">
          Generate perfectly balanced scenario texts using validated templates
        </p>
      </div>

      {/* Template Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Select Domain Template:</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.keys(templates).map((key: string) => (
            <button
              key={key}
              onClick={() => setActiveTemplate(key)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                activeTemplate === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {(templates as any)[key].name.split('/')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Template Structure */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {currentTemplate.name} Template
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Sentence Structure:</h3>
              <ol className="space-y-2">
                {currentTemplate.structure.map((sentence: string, idx: number) => (
                  <li key={idx} className="text-sm">
                    <span className="inline-block w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-center font-semibold mr-2">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{sentence}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Guidelines:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                {currentTemplate.guidelines.map((guideline: string, idx: number) => (
                  <li key={idx}>• {guideline}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">Example Outputs:</h4>
            </div>
            
            <div className="space-y-3 mb-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-700">Option A:</span>
                  <button
                    onClick={() => copyToClipboard(exampleTextA)}
                    className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2 bg-blue-50 p-2 rounded">{exampleTextA}</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisA.sentenceCount}</div>
                    <div className="text-gray-600">Sentences</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisA.wordCount}</div>
                    <div className="text-gray-600">Words</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisA.charCount}</div>
                    <div className="text-gray-600">Characters</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisA.numberCount}</div>
                    <div className="text-gray-600">Numbers</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-green-700">Option B:</span>
                  <button
                    onClick={() => copyToClipboard(exampleTextB)}
                    className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2 bg-green-50 p-2 rounded">{exampleTextB}</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisB.sentenceCount}</div>
                    <div className="text-gray-600">Sentences</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisB.wordCount}</div>
                    <div className="text-gray-600">Words</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisB.charCount}</div>
                    <div className="text-gray-600">Characters</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center">
                    <div className="font-semibold text-gray-800">{analysisB.numberCount}</div>
                    <div className="text-gray-600">Numbers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Input Generator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Generate Your Scenario
          </h2>

          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Option A</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={customInputs.optionA.productName}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionA: {...customInputs.optionA, productName: e.target.value}
                })}
                placeholder={currentTemplate.example.optionA.productName}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 1
              </label>
              <input
                type="text"
                value={customInputs.optionA.attribute1}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionA: {...customInputs.optionA, attribute1: e.target.value}
                })}
                placeholder={currentTemplate.example.optionA.attribute1}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{currentTemplate.guidelines[0]}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 2
              </label>
              <input
                type="text"
                value={customInputs.optionA.attribute2}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionA: {...customInputs.optionA, attribute2: e.target.value}
                })}
                placeholder={currentTemplate.example.optionA.attribute2}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{currentTemplate.guidelines[1]}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 3
              </label>
              <input
                type="text"
                value={customInputs.optionA.attribute3}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionA: {...customInputs.optionA, attribute3: e.target.value}
                })}
                placeholder={currentTemplate.example.optionA.attribute3}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{currentTemplate.guidelines[2]}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 4
              </label>
              <input
                type="text"
                value={customInputs.optionA.attribute4}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionA: {...customInputs.optionA, attribute4: e.target.value}
                })}
                placeholder={currentTemplate.example.optionA.attribute4}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{currentTemplate.guidelines[3] || 'Attribute 4'}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 5
              </label>
              <input
                type="text"
                value={customInputs.optionA.attribute5}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionA: {...customInputs.optionA, attribute5: e.target.value}
                })}
                placeholder={currentTemplate.example.optionA.attribute5}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{currentTemplate.guidelines[4] || 'Attribute 5'}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 6
              </label>
              <input
                type="text"
                value={customInputs.optionA.attribute6}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionA: {...customInputs.optionA, attribute6: e.target.value}
                })}
                placeholder={currentTemplate.example.optionA.attribute6}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{currentTemplate.guidelines[5] || 'Attribute 6'}</p>
            </div>

            <hr className="my-6" />

            <h3 className="font-semibold text-gray-700 mb-2">Option B</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={customInputs.optionB.productName}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionB: {...customInputs.optionB, productName: e.target.value}
                })}
                placeholder={currentTemplate.example.optionB.productName}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 1
              </label>
              <input
                type="text"
                value={customInputs.optionB.attribute1}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionB: {...customInputs.optionB, attribute1: e.target.value}
                })}
                placeholder={currentTemplate.example.optionB.attribute1}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 2
              </label>
              <input
                type="text"
                value={customInputs.optionB.attribute2}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionB: {...customInputs.optionB, attribute2: e.target.value}
                })}
                placeholder={currentTemplate.example.optionB.attribute2}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 3
              </label>
              <input
                type="text"
                value={customInputs.optionB.attribute3}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionB: {...customInputs.optionB, attribute3: e.target.value}
                })}
                placeholder={currentTemplate.example.optionB.attribute3}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 4
              </label>
              <input
                type="text"
                value={customInputs.optionB.attribute4}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionB: {...customInputs.optionB, attribute4: e.target.value}
                })}
                placeholder={currentTemplate.example.optionB.attribute4}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 5
              </label>
              <input
                type="text"
                value={customInputs.optionB.attribute5}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionB: {...customInputs.optionB, attribute5: e.target.value}
                })}
                placeholder={currentTemplate.example.optionB.attribute5}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Attribute 6
              </label>
              <input
                type="text"
                value={customInputs.optionB.attribute6}
                onChange={(e) => setCustomInputs({
                  ...customInputs,
                  optionB: {...customInputs.optionB, attribute6: e.target.value}
                })}
                placeholder={currentTemplate.example.optionB.attribute6}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
          </div>

          <button
            onClick={addToGenerated}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Generate & Add to Collection
          </button>

          {(customInputs.optionA.productName || customInputs.optionB.productName) && (
            <div className="mt-4 space-y-3">
              <div className="bg-blue-50 rounded p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Preview Option A:</h4>
                <p className="text-sm text-gray-700">
                  {generateFromTemplate(activeTemplate, customInputs, 'A')}
                </p>
              </div>
              <div className="bg-green-50 rounded p-4">
                <h4 className="font-semibold text-green-900 mb-2">Preview Option B:</h4>
                <p className="text-sm text-gray-700">
                  {generateFromTemplate(activeTemplate, customInputs, 'B')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generated Scenarios Collection */}
      {generatedScenarios.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Generated Scenarios ({generatedScenarios.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={appendToRefinement}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <FileText size={16} />
                Replace Review Scenarios
              </button>
              <button
                onClick={clearAllScenarios}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Clear All
              </button>
              <button
                onClick={exportScenarios}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Export All
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {generatedScenarios.map((scenario: any, idx: number) => (
              <div key={idx} className="border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    Scenario {idx + 1}: {scenario.domain}
                  </h3>
                  <button
                    onClick={() => deleteScenario(idx)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                  >
                    <X size={16} />
                    Delete
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded p-3">
                    <h4 className="font-semibold text-blue-900 text-sm mb-2">Option A</h4>
                    <p className="text-sm text-gray-700">{scenario.optionA}</p>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionA).sentenceCount}</div>
                        <div className="text-gray-600">Sentences</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionA).wordCount}</div>
                        <div className="text-gray-600">Words</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionA).charCount}</div>
                        <div className="text-gray-600">Characters</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionA).numberCount}</div>
                        <div className="text-gray-600">Numbers</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <h4 className="font-semibold text-green-900 text-sm mb-2">Option B</h4>
                    <p className="text-sm text-gray-700">{scenario.optionB}</p>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionB).sentenceCount}</div>
                        <div className="text-gray-600">Sentences</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionB).wordCount}</div>
                        <div className="text-gray-600">Words</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionB).charCount}</div>
                        <div className="text-gray-600">Characters</div>
                      </div>
                      <div className="bg-white rounded p-1 text-center">
                        <div className="font-semibold text-gray-800">{analyzeText(scenario.optionB).numberCount}</div>
                        <div className="text-gray-600">Numbers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structural Consistency Checklist */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Structural Consistency Checklist
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">✓ Requirements</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Exactly 3-4 sentences per option</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Same sentence structure between A and B</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Word count difference ≤ 10%</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Same number of numeric values</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Consistent attribute order</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={16} />
                <span>No persuasive language</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">✗ Common Mistakes</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Different sentence counts (e.g., 3 vs 4)</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Reordering attributes between options</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Using "better," "best," "premium"</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Inconsistent units (€ vs EUR, GB vs gigabytes)</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <span>More detail in one option vs the other</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <span>Different closing questions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentenceStructureStandardizer;