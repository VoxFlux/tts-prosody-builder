import { useState, useEffect, useRef } from 'react';
import { Volume2, TrendingDown, Gauge, Clock, Copy, Download, Settings } from 'lucide-react';
import { loadFromStorage } from '../utils/persistence';

const ProsodyAnnotationTool = () => {
  const [activeTab, setActiveTab] = useState('presets');
  const [selectedPreset, setSelectedPreset] = useState('authoritative');
  const [selectedPlatform, setSelectedPlatform] = useState<'azure' | 'google' | 'elevenlabs'>('azure');
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B'>('A');
  const [inputText, setInputText] = useState(
    "The Premium Card has a €49 annual fee, offers 1% cashback on all purchases, and includes comprehensive travel insurance with emergency assistance worldwide."
  );

  // Track last loaded scenarios to avoid unnecessary updates
  const lastScenariosRef = useRef<string>('');

  // Function to load scenarios from storage
  const loadScenarios = () => {
    const savedData = loadFromStorage();
    const loadedScenarios = savedData.prosodyAnnotation?.scenarios || [];
    const scenariosJson = JSON.stringify(loadedScenarios);

    // Only update state if scenarios have actually changed
    if (scenariosJson !== lastScenariosRef.current) {
      console.log('Scenarios changed, updating:', loadedScenarios);
      lastScenariosRef.current = scenariosJson;
      setScenarios(loadedScenarios);

      // Auto-select the first scenario if available and none is selected
      if (loadedScenarios.length > 0 && scenarios.length === 0) {
        const firstScenario = loadedScenarios[0];
        setSelectedScenario(firstScenario);
        setInputText(firstScenario.optionA);
      }
    }
  };

  // Load scenarios on mount and listen for updates
  useEffect(() => {
    loadScenarios();

    // Listen for custom event when scenarios are added
    const handleScenariosUpdate = () => {
      console.log('Received prosodyScenariosUpdated event, reloading...');
      loadScenarios();
    };

    window.addEventListener('prosodyScenariosUpdated', handleScenariosUpdate);

    return () => {
      window.removeEventListener('prosodyScenariosUpdated', handleScenariosUpdate);
    };
  }, []);

  // Handle scenario selection
  const handleScenarioSelect = (scenario: any, option: 'A' | 'B') => {
    setSelectedScenario(scenario);
    setSelectedOption(option);
    setInputText(option === 'A' ? scenario.optionA : scenario.optionB);
  };

  // Prosodic presets based on literature
  const presets = {
    neutral: {
      name: "Neutral (Baseline)",
      description: "Standard conversational delivery with no manipulation",
      parameters: {
        pitch: { shift: 0, range: 0, contour: "natural" },
        rate: { global: 0, local: [] },
        volume: { level: 0, peaks: [] },
        pauses: [],
        voiceQuality: "normal"
      },
      color: "gray",
      icon: "📊"
    },
    authoritative: {
      name: "Authoritative/Dominant",
      description: "Lower pitch, slower rate, stable intensity - signals confidence and authority",
      parameters: {
        pitch: { shift: -200, range: -30, contour: "falling" },
        rate: { global: -15, local: [] },
        volume: { level: +4, peaks: [] },
        pauses: [{ position: "before-numbers", duration: 200 }],
        voiceQuality: "modal"
      },
      color: "blue",
      icon: "👔",
      literature: [
        "Lower F0 (-100 to -300 cents) → authority/dominance [Guyer et al., 2018]",
        "Reduced pitch range (-20-40%) → restraint [Jiang & Pell, 2017]",
        "Slower rate (-15-30%) → emphasis [Miller et al., 1976]",
        "Higher intensity (+3-6 dB) → confidence [Van Zant & Berger, 2020]",
        "Terminal fall > 3 st → certainty [Vaughan-Johnston et al., 2024]"
      ]
    },
    friendly: {
      name: "Friendly/Warm",
      description: "Higher pitch, moderate variation, breathy quality - builds trust",
      parameters: {
        pitch: { shift: +150, range: +25, contour: "rising" },
        rate: { global: 0, local: [] },
        volume: { level: 0, peaks: [] },
        pauses: [],
        voiceQuality: "breathy"
      },
      color: "green",
      icon: "😊",
      literature: [
        "Higher F0 → friendly, polite [Guyer et al., 2018]",
        "Wide pitch range (+20-40%) → expressive [Gomes et al., 2023]",
        "Breathy quality (H1-H2 +3-6 dB) → warmth/trust [Goupil et al., 2021]",
        "Rising intonation → politeness [Jiang & Pell, 2017]"
      ]
    },
    urgent: {
      name: "Urgent/Pressing",
      description: "Faster rate, dynamic contrast, intensity peaks - creates time pressure",
      parameters: {
        pitch: { shift: +100, range: +35, contour: "dynamic" },
        rate: { global: +25, local: [] },
        volume: { level: +3, peaks: [{ word: "now", boost: +6 }] },
        pauses: [{ position: "minimal", duration: 50 }],
        voiceQuality: "tense"
      },
      color: "orange",
      icon: "⚡",
      literature: [
        "Faster rate (+15-30%) → urgency [Miller et al., 1976]",
        "Expanded F0 range → heightened salience [Guyer et al., 2018]",
        "Emphasis peaks (+6-9 dB) → pressure [Wang et al., 2018]",
        "Reduced pauses → time constraint [Michalsky et al., 2019]"
      ]
    },
    hesitant: {
      name: "Hesitant/Uncertain",
      description: "Rising intonation, more pauses, softer volume - signals doubt",
      parameters: {
        pitch: { shift: 0, range: +20, contour: "rising" },
        rate: { global: -10, local: [{ position: "sentence-end", change: -25 }] },
        volume: { level: -3, peaks: [] },
        pauses: [{ position: "mid-sentence", duration: 300 }],
        voiceQuality: "breathy"
      },
      color: "yellow",
      icon: "🤔",
      literature: [
        "Rising terminal contour → uncertainty [Vaughan-Johnston et al., 2024]",
        "Mid-sentence pauses → hesitation [Jiang & Pell, 2017]",
        "Lower intensity → less confidence [Van Zant & Berger, 2020]",
        "Slower rate near boundaries → doubt [Gomes et al., 2023]"
      ]
    },
    confident: {
      name: "Confident/Assured",
      description: "Stable pitch, moderate rate, clear articulation - signals certainty",
      parameters: {
        pitch: { shift: -100, range: -20, contour: "stable" },
        rate: { global: -8, local: [] },
        volume: { level: +2, peaks: [] },
        pauses: [{ position: "after-key-points", duration: 250 }],
        voiceQuality: "modal"
      },
      color: "purple",
      icon: "💪",
      literature: [
        "Moderate F0 lowering (-100 to -150 cents) → competence [Guyer et al., 2018]",
        "Stable pitch range → certainty [Jiang & Pell, 2017]",
        "Slightly slower rate (-5-10%) → clarity [Miller et al., 1976]",
        "Modal voice quality → credibility [Goupil et al., 2021]"
      ]
    }
  };

  // Platform-specific SSML generators
  const generateAzureSSML = (text: string, preset: string) => {
    const params = (presets as any)[preset].parameters;

    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="en-US-GuyNeural">
    <mstts:silence type="Leading" value="200ms"/>
`;

    // Add express-as style for certain presets
    if (preset === 'authoritative' || preset === 'confident') {
      ssml += `    <mstts:express-as style="newscast-formal" styledegree="1.5">\n`;
    } else if (preset === 'friendly') {
      ssml += `    <mstts:express-as style="friendly" styledegree="1.3">\n`;
    } else if (preset === 'urgent') {
      ssml += `    <mstts:express-as style="excited" styledegree="1.2">\n`;
    }

    // Add prosody tags
    ssml += `      <prosody`;
    if (params.pitch.shift !== 0) {
      const pitchPercent = Math.round(params.pitch.shift / 20); // Convert cents to approximate %
      ssml += ` pitch="${pitchPercent > 0 ? '+' : ''}${pitchPercent}%"`;
    }
    if (params.rate.global !== 0) {
      ssml += ` rate="${params.rate.global > 0 ? '+' : ''}${params.rate.global}%"`;
    }
    if (params.volume.level !== 0) {
      const volumeLevel = params.volume.level > 3 ? 'loud' : params.volume.level < -2 ? 'soft' : 'medium';
      ssml += ` volume="${volumeLevel}"`;
    }
    ssml += `>\n        ${text}\n      </prosody>\n`;

    if (preset === 'authoritative' || preset === 'confident' || preset === 'friendly' || preset === 'urgent') {
      ssml += `    </mstts:express-as>\n`;
    }

    ssml += `    <mstts:silence type="Tailing" value="200ms"/>
  </voice>
</speak>`;
    return ssml;
  };

  const generateGoogleSSML = (text: string, preset: string) => {
    const params = (presets as any)[preset].parameters;

    let ssml = `<speak version="1.0" xml:lang="en-US">
  <voice language="en-US" name="en-US-Neural2-D">
    <break time="200ms"/>
    <prosody`;

    // Pitch in semitones for Google
    if (params.pitch.shift !== 0) {
      const semitones = (params.pitch.shift / 100).toFixed(1);
      const semitonesNum = parseFloat(semitones);
      ssml += ` pitch="${semitonesNum > 0 ? '+' : ''}${semitones}st"`;
    }

    // Rate as percentage (0-100 = slower, 100+ = faster)
    if (params.rate.global !== 0) {
      const ratePercent = 100 + params.rate.global;
      ssml += ` rate="${ratePercent}%"`;
    }

    // Volume levels
    if (params.volume.level !== 0) {
      const volumeLevel = params.volume.level > 3 ? 'loud' : params.volume.level < -2 ? 'soft' : 'medium';
      ssml += ` volume="${volumeLevel}"`;
    }

    ssml += `>\n      ${text}\n    </prosody>
    <break time="200ms"/>
  </voice>
</speak>`;
    return ssml;
  };

  const generateElevenLabsPrompt = (text: string, preset: string) => {
    // Map prosody presets to ElevenLabs voice settings
    const voiceSettings: Record<string, any> = {
      neutral: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true,
        speed: 1.0
      },
      authoritative: {
        stability: 0.75,  // High stability for consistent, controlled delivery
        similarity_boost: 0.75,
        style: 0.5,  // Moderate style exaggeration for authority
        use_speaker_boost: true,
        speed: 0.85  // Slower for emphasis (-15% matches params)
      },
      friendly: {
        stability: 0.4,  // Lower stability for more variation
        similarity_boost: 0.75,
        style: 0.6,  // Higher style for expressiveness
        use_speaker_boost: true,
        speed: 1.0
      },
      urgent: {
        stability: 0.6,
        similarity_boost: 0.75,
        style: 0.7,  // High style for urgency
        use_speaker_boost: true,
        speed: 1.15  // Faster for urgency (+15%)
      },
      hesitant: {
        stability: 0.3,  // Low stability for uncertainty
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
        speed: 0.95  // Slightly slower with pauses
      },
      confident: {
        stability: 0.75,  // High stability for confidence
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
        speed: 0.92  // Moderate, controlled pace (-8%)
      }
    };

    const settings = voiceSettings[preset] || voiceSettings.neutral;

    // Add SSML break tags for pauses based on preset
    let textWithSSML = text;

    // Add pauses before key numeric values for authoritative/confident presets
    if (preset === 'authoritative' || preset === 'confident') {
      // Add 350ms pause before numbers (matching Azure implementation)
      textWithSSML = text.replace(/(\d+[-.]?\d*\s*(?:euros|percent|thousand))/gi,
        '<break time="0.35s" />$1');
    }

    // Add pauses for hesitant preset
    if (preset === 'hesitant') {
      // Add short pauses to create hesitation
      textWithSSML = text.replace(/\./g, '...<break time="0.2s" />');
    }

    // Recommended model and voice based on preset
    const modelRecommendations: Record<string, { model: string; voice: string; reason: string }> = {
      neutral: {
        model: "eleven_flash_v2_5",
        voice: "Sam (neutral male) or Charlotte (neutral female)",
        reason: "Fast, efficient for conversational baseline"
      },
      authoritative: {
        model: "eleven_multilingual_v2",
        voice: "Adam (authoritative male) or Matilda (professional female)",
        reason: "High quality, nuanced delivery for authority"
      },
      friendly: {
        model: "eleven_turbo_v2_5",
        voice: "Bella (friendly female) or Ethan (warm male)",
        reason: "Good balance of quality and expressiveness"
      },
      urgent: {
        model: "eleven_flash_v2_5",
        voice: "Charlie (energetic male) or Freya (dynamic female)",
        reason: "Low latency for urgent, fast-paced delivery"
      },
      hesitant: {
        model: "eleven_multilingual_v2",
        voice: "Emily (soft female) or Liam (gentle male)",
        reason: "Best for subtle emotional nuances"
      },
      confident: {
        model: "eleven_multilingual_v2",
        voice: "Adam (confident male) or Matilda (assured female)",
        reason: "Stable, consistent quality for confidence"
      }
    };

    const recommendation = modelRecommendations[preset] || modelRecommendations.neutral;

    // Generate the complete API configuration
    return `ElevenLabs Text-to-Speech Configuration
${'-'.repeat(50)}

TEXT WITH SSML:
${textWithSSML}

${'-'.repeat(50)}
VOICE SETTINGS (JSON):
${JSON.stringify(settings, null, 2)}

${'-'.repeat(50)}
RECOMMENDED CONFIGURATION:

Model: ${recommendation.model}
  - ${recommendation.reason}

Voice: ${recommendation.voice}

API Endpoint: POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}

${'-'.repeat(50)}
SAMPLE API REQUEST (Python):

import requests

VOICE_ID = "your_voice_id_here"  # e.g., "21m00Tcm4TlvDq8ikWAM" for Rachel
API_KEY = "your_api_key_here"

url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

headers = {
    "xi-api-key": API_KEY,
    "Content-Type": "application/json"
}

data = {
    "text": """${textWithSSML}""",
    "model_id": "${recommendation.model}",
    "voice_settings": ${JSON.stringify(settings, null, 4).replace(/\n/g, '\n    ')}
}

response = requests.post(url, json=data, headers=headers)

with open("output.mp3", "wb") as f:
    f.write(response.content)

${'-'.repeat(50)}
NOTES:

• SSML Support: ElevenLabs supports <break time="x.xs" /> tags for pauses (max 3s)
• Emotional Delivery: Add context in text (e.g., "she said excitedly", use exclamation marks)
• Stability: Higher = more consistent, lower = more expressive/variable
• Similarity Boost: Controls voice similarity (0.75 recommended)
• Style Exaggeration: 0 = neutral, higher = more dramatic delivery
• Speed: ${settings.speed}x (range: 0.7-1.2, default: 1.0)

For banking scenarios, use ${recommendation.voice} with ${recommendation.model} for optimal results.`;
  };

  const generateSSML = (text: string, preset: string, platform: string = selectedPlatform) => {
    switch (platform) {
      case 'azure':
        return generateAzureSSML(text, preset);
      case 'google':
        return generateGoogleSSML(text, preset);
      case 'elevenlabs':
        return generateElevenLabsPrompt(text, preset);
      default:
        return generateAzureSSML(text, preset);
    }
  };

  const generateControlSheet = (preset: string) => {
    const params = (presets as any)[preset].parameters;
    return `
PROSODY CONTROL SHEET
Preset: ${(presets as any)[preset].name}
=====================

PITCH (F0) CONTROL:
- Mean shift: ${params.pitch.shift} cents ${params.pitch.shift < 0 ? '(lower)' : params.pitch.shift > 0 ? '(higher)' : '(neutral)'}
- Range adjustment: ${params.pitch.range}% ${params.pitch.range < 0 ? '(narrower)' : params.pitch.range > 0 ? '(wider)' : '(neutral)'}
- Terminal contour: ${params.pitch.contour}

SPEECH RATE:
- Global rate: ${params.rate.global}% ${params.rate.global < 0 ? '(slower)' : params.rate.global > 0 ? '(faster)' : '(neutral)'}
${params.rate.local.length > 0 ? '- Local adjustments: ' + JSON.stringify(params.rate.local) : ''}

INTENSITY (VOLUME):
- Average level: ${params.volume.level} dB
${params.volume.peaks.length > 0 ? '- Emphasis peaks: ' + JSON.stringify(params.volume.peaks) : ''}

PAUSES:
${params.pauses.length > 0 ? params.pauses.map((p: { position: string; duration: number }) => `- ${p.position}: ${p.duration}ms`).join('\n') : '- None specified'}

VOICE QUALITY:
- Target: ${params.voiceQuality}

ACOUSTIC VALIDATION TARGETS:
- Expected F0 mean: Baseline ${params.pitch.shift} cents
- Expected F0 SD: Baseline ${params.pitch.range}%
- Expected syllables/sec: Baseline ${params.rate.global}%
- Expected RMS level: Baseline ${params.volume.level} dB
`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadSheet = (preset: string) => {
    const sheet = generateControlSheet(preset);
    const blob = new Blob([sheet], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prosody_sheet_${preset}.txt`;
    a.click();
  };

  const currentPreset = (presets as any)[selectedPreset];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Volume2 className="text-indigo-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">
            Prosody Annotation & SSML Generator
          </h1>
        </div>
        <p className="text-gray-600">
          Define prosodic manipulations for authoritative (A*/B*) variants with SSML export
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'presets'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Prosodic Presets
          </button>
          <button
            onClick={() => setActiveTab('ssml')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'ssml'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            SSML Generator
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'validation'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Validation Metrics
          </button>
        </div>
      </div>

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          {/* Preset Selector */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Select Prosodic Manipulation</h2>
            <div className="grid md:grid-cols-5 gap-3">
              {Object.keys(presets).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPreset === key
                      ? `border-${(presets as any)[key].color}-500 bg-${(presets as any)[key].color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{(presets as any)[key].icon}</div>
                  <div className="font-semibold text-sm">{(presets as any)[key].name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {currentPreset.icon} {currentPreset.name}
                </h2>
                <p className="text-gray-600">{currentPreset.description}</p>
              </div>
              <button
                onClick={() => downloadSheet(selectedPreset)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Download Sheet
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Parameters */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Settings size={18} />
                  Prosodic Parameters
                </h3>
                
                <div className="space-y-4">
                  {/* Pitch */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="text-blue-600" size={18} />
                      <h4 className="font-semibold text-blue-900">Pitch (F0)</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Mean shift:</span>
                        <span className="font-mono font-semibold">{currentPreset.parameters.pitch.shift} cents</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Range adjust:</span>
                        <span className="font-mono font-semibold">{currentPreset.parameters.pitch.range}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Contour:</span>
                        <span className="font-mono font-semibold">{currentPreset.parameters.pitch.contour}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="text-purple-600" size={18} />
                      <h4 className="font-semibold text-purple-900">Speech Rate</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Global rate:</span>
                        <span className="font-mono font-semibold">{currentPreset.parameters.rate.global}%</span>
                      </div>
                      {currentPreset.parameters.rate.local.length > 0 && (
                        <div className="text-xs text-gray-600 mt-2">
                          Local adjustments: {JSON.stringify(currentPreset.parameters.rate.local)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="text-orange-600" size={18} />
                      <h4 className="font-semibold text-orange-900">Intensity</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Average level:</span>
                        <span className="font-mono font-semibold">{currentPreset.parameters.volume.level > 0 ? '+' : ''}{currentPreset.parameters.volume.level} dB</span>
                      </div>
                      {currentPreset.parameters.volume.peaks.length > 0 && (
                        <div className="text-xs text-gray-600 mt-2">
                          Emphasis peaks: {JSON.stringify(currentPreset.parameters.volume.peaks)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pauses */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-green-600" size={18} />
                      <h4 className="font-semibold text-green-900">Pauses & Timing</h4>
                    </div>
                    <div className="text-sm">
                      {currentPreset.parameters.pauses.length > 0 ? (
                        currentPreset.parameters.pauses.map((pause: { position: string; duration: number }, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-gray-700">{pause.position}:</span>
                            <span className="font-mono font-semibold">{pause.duration}ms</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-600 italic">No pauses specified</span>
                      )}
                    </div>
                  </div>

                  {/* Voice Quality */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Voice Quality</h4>
                    <div className="text-sm">
                      <span className="font-mono font-semibold text-gray-700">
                        {currentPreset.parameters.voiceQuality}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Literature Support */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">📚 Literature Support</h3>
                {currentPreset.literature ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2 text-sm">
                      {currentPreset.literature.map((ref: string, idx: number) => (
                        <li key={idx} className="text-gray-700 leading-relaxed">
                          • {ref}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 italic">
                      Baseline condition - no manipulation
                    </p>
                  </div>
                )}

                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Usage Notes</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• Test with pilot participants to validate perception</li>
                    <li>• Measure acoustic output to confirm targets</li>
                    <li>• Keep manipulations within natural ranges</li>
                    <li>• Document any model-specific adjustments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SSML Tab */}
      {activeTab === 'ssml' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Generate SSML Code</h2>

            {/* Scenario Selector */}
            {scenarios.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Select Scenario and Option:</h3>
                  <button
                    onClick={loadScenarios}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    🔄 Refresh Scenarios
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {scenarios.map((scenario: any) => (
                    <div key={scenario.id} className={`p-4 rounded border-2 transition-all ${
                      selectedScenario?.id === scenario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="mb-3">
                        <span className="font-semibold text-gray-800 text-lg">{scenario.domain}</span>
                        <p className="text-gray-600 text-sm">{scenario.context}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleScenarioSelect(scenario, 'A')}
                          className={`p-3 rounded text-sm font-medium transition-all text-left ${
                            selectedScenario?.id === scenario.id && selectedOption === 'A'
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="font-bold mb-1">Option A</div>
                          <div className="text-xs opacity-80 line-clamp-2">{scenario.optionA}</div>
                        </button>
                        <button
                          onClick={() => handleScenarioSelect(scenario, 'B')}
                          className={`p-3 rounded text-sm font-medium transition-all text-left ${
                            selectedScenario?.id === scenario.id && selectedOption === 'B'
                              ? 'bg-green-600 text-white shadow-lg'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="font-bold mb-1">Option B</div>
                          <div className="text-xs opacity-80 line-clamp-2">{scenario.optionB}</div>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current Selection Display */}
                {selectedScenario && (
                  <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">
                        Current: {selectedScenario.domain} - Option {selectedOption}
                      </span>
                      <button
                        onClick={() => setInputText(selectedOption === 'A' ? selectedScenario.optionA : selectedScenario.optionB)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Reset to original
                      </button>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full p-3 border rounded text-sm font-mono h-20"
                    />
                    <p className="text-xs text-gray-500 mt-1">You can edit the text above if needed</p>
                  </div>
                )}
              </>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <div className="flex items-center justify-between">
                  <p className="text-yellow-800">
                    <strong>No scenarios available.</strong> Go to the Text Review tool to approve scenarios and send them here.
                  </p>
                  <button
                    onClick={loadScenarios}
                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors whitespace-nowrap"
                  >
                    🔄 Check for Scenarios
                  </button>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block font-semibold text-gray-700 mb-2">Select Prosody Preset:</label>
              <div className="grid grid-cols-6 gap-2">
                {Object.keys(presets).map(key => (
                  <button
                    key={key}
                    onClick={() => setSelectedPreset(key)}
                    className={`p-2 rounded text-sm ${
                      selectedPreset === key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {(presets as any)[key].icon} {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-semibold text-gray-700 mb-2">Select TTS Platform:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPlatform('azure')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    selectedPlatform === 'azure'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Azure Neural TTS
                </button>
                <button
                  onClick={() => setSelectedPlatform('google')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    selectedPlatform === 'google'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Google Cloud TTS
                </button>
                <button
                  onClick={() => setSelectedPlatform('elevenlabs')}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    selectedPlatform === 'elevenlabs'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  ElevenLabs
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Platform-specific SSML syntax and voice models
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-300 text-sm">
                  {selectedPlatform === 'elevenlabs' ? 'ElevenLabs Voice Prompt:' : `Generated SSML (${selectedPlatform === 'azure' ? 'Azure' : 'Google'}):`}
                </h3>
                <button
                  onClick={() => copyToClipboard(generateSSML(inputText, selectedPreset, selectedPlatform))}
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {generateSSML(inputText, selectedPreset, selectedPlatform)}
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Multi-Platform TTS Support</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h4 className="font-semibold text-blue-900 mb-2">✓ Azure Neural TTS</h4>
                <ul className="text-sm space-y-1 text-blue-800">
                  <li>• Full prosody control (pitch, rate, volume)</li>
                  <li>• Speaking style support (newscast, friendly)</li>
                  <li>• Neural voices: GuyNeural, JennyNeural</li>
                  <li>• SSML 1.0 + mstts extensions</li>
                </ul>
              </div>
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <h4 className="font-semibold text-green-900 mb-2">✓ Google Cloud TTS</h4>
                <ul className="text-sm space-y-1 text-green-800">
                  <li>• Prosody in semitones (pitch)</li>
                  <li>• Rate as percentage (0-100+)</li>
                  <li>• WaveNet/Neural2 voices</li>
                  <li>• Standard SSML 1.0</li>
                </ul>
              </div>
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                <h4 className="font-semibold text-purple-900 mb-2">✓ ElevenLabs</h4>
                <ul className="text-sm space-y-1 text-purple-800">
                  <li>• Prompt-based voice control</li>
                  <li>• Natural voice cloning</li>
                  <li>• Multiple voice models</li>
                  <li>• Emotion and style tuning</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-gray-50 border-l-4 border-gray-400 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">📝 Platform Selection Guide</h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• <strong>Azure:</strong> Best for commercial deployments, robust style support</li>
                <li>• <strong>Google:</strong> High naturalness, good for research, free tier available</li>
                <li>• <strong>ElevenLabs:</strong> State-of-the-art naturalness, prompt-based control, voice cloning</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Acoustic Validation Metrics</h2>
          <p className="text-gray-600 mb-6">
            After generating audio, measure these parameters to confirm your prosodic manipulations
          </p>

          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Required Measurements</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">Parameter</th>
                    <th className="text-left p-3 font-semibold">Tool/Method</th>
                    <th className="text-left p-3 font-semibold">Target (Authoritative)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">Mean F0 (Hz)</td>
                    <td className="p-3 font-mono text-xs">Praat: To Pitch → Get mean</td>
                    <td className="p-3 font-mono">Baseline - 200 cents</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">F0 SD (semitones)</td>
                    <td className="p-3 font-mono text-xs">Praat: F0 std deviation</td>
                    <td className="p-3 font-mono">Baseline - 30%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Speech Rate (syll/s)</td>
                    <td className="p-3 font-mono text-xs">Forced alignment + count</td>
                    <td className="p-3 font-mono">Baseline - 15%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">RMS Intensity (dB)</td>
                    <td className="p-3 font-mono text-xs">Praat: Get intensity (dB)</td>
                    <td className="p-3 font-mono">Baseline + 4 dB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Terminal F0 slope</td>
                    <td className="p-3 font-mono text-xs">Final syllable F0 change</td>
                    <td className="p-3 font-mono">Falling &gt; 3 semitones</td>
                  </tr>
                  <tr>
                    <td className="p-3">Pause durations</td>
                    <td className="p-3 font-mono text-xs">TextGrid boundaries</td>
                    <td className="p-3 font-mono">200ms before numbers</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">⚙️ Acceptance Criteria</h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                <li>• Pitch shift: Within ±50 cents of target</li>
                <li>• Rate change: Within ±5% of target</li>
                <li>• Intensity: Within ±1 dB of target</li>
                <li>• If manipulation check fails in pilot → iterate parameters</li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Pre-Pilot Validation</h4>
              <p className="text-sm text-blue-800 mb-2">
                Before running the main experiment, collect authority-perception ratings:
              </p>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Small sample (N=10-15) rates "How authoritative does this voice sound?" (1-7 Likert)</li>
                <li>• Manipulated condition should differ by ≥1 SD from neutral</li>
                <li>• If not significant → adjust parameters and retest</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProsodyAnnotationTool;