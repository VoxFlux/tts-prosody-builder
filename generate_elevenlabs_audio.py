#!/usr/bin/env python3
"""
ElevenLabs TTS Audio Generator for Banking Scenarios
Based on official ElevenLabs API documentation and prosody presets

Usage:
    python generate_elevenlabs_audio.py
"""

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import os
import json

# Load environment variables
load_dotenv()

# Initialize ElevenLabs client
client = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

# Voice presets matching the TTS Prosody Builder tool
VOICE_PRESETS = {
    "neutral": {
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0,
        "use_speaker_boost": True,
        "speed": 1.0,
        "model": "eleven_flash_v2_5",
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam (male, neutral)
        "voice_name": "Adam"
    },
    "authoritative": {
        "stability": 0.75,  # High stability for consistent delivery
        "similarity_boost": 0.75,
        "style": 0.5,  # Moderate style exaggeration
        "use_speaker_boost": True,
        "speed": 0.85,  # Slower for emphasis
        "model": "eleven_multilingual_v2",
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam (male, authoritative)
        "voice_name": "Adam"
    },
    "friendly": {
        "stability": 0.4,
        "similarity_boost": 0.75,
        "style": 0.6,
        "use_speaker_boost": True,
        "speed": 1.0,
        "model": "eleven_turbo_v2_5",
        "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella (female, friendly)
        "voice_name": "Bella"
    },
    "confident": {
        "stability": 0.75,
        "similarity_boost": 0.75,
        "style": 0.5,
        "use_speaker_boost": True,
        "speed": 0.92,
        "model": "eleven_multilingual_v2",
        "voice_id": "pNInz6obpgDQGcFmaJgB",  # Adam (male, confident)
        "voice_name": "Adam"
    }
}

# Banking scenario examples
SCENARIOS = {
    "premiumgold_authoritative": {
        "preset": "authoritative",
        "text": '''
"The PremiumGold Card," he explained with authority, "has an annual fee of just ninety-five euros."
<break time="0.35s" />
He paused deliberately. "It offers two-point-five percent cashback on all purchases — that's industry-leading."
<break time="0.35s" />
"Travel insurance coverage," he emphasized confidently, "is one-hundred-thousand euros."
<break time="0.35s" />
He leaned forward. "The APR is eleven-point-nine percent, exceptionally competitive."
<break time="0.35s" />
"You'll receive," he stated firmly, "a welcome bonus of three-hundred euros."
<break time="0.35s" />
His voice deepened. "There are no foreign transaction fees whatsoever."
'''.strip(),
        "manipulation_target": "A",
        "variant_type": "Balanced"
    },
    "premiumgold_neutral": {
        "preset": "neutral",
        "text": '''
"The PremiumGold Card has an annual fee of ninety-five euros. It offers two-point-five percent cashback on all purchases. Travel insurance coverage is one-hundred-thousand euros. The APR is eleven-point-nine percent. You'll receive a welcome bonus of three-hundred euros. There are no foreign transaction fees."
'''.strip(),
        "manipulation_target": "None",
        "variant_type": "Baseline"
    },
    "executiveplatinum_deemphasized": {
        "preset": "neutral",
        "text": '''
"The ExecutivePlatinum Card has... well, an annual fee of one-hundred-twenty euros," he mentioned.
<break time="0.2s" />
"It offers two percent cashback," he said quickly.
<break time="0.2s" />
"Travel insurance coverage is seventy-five-thousand euros."
<break time="0.2s" />
"The APR is... thirteen-point-nine percent."
<break time="0.2s" />
"You'll receive a welcome bonus of two-hundred-fifty euros."
<break time="0.2s" />
He hesitated. "Foreign transaction fees are zero-point-five percent."
'''.strip(),
        "manipulation_target": "None (de-emphasized)",
        "variant_type": "Slightly-Worse"
    },
    "travelplus_authoritative": {
        "preset": "authoritative",
        "text": '''
"The TravelPlus Card," he stated with confidence, "has an annual fee of forty-five euros — quite reasonable."
<break time="0.35s" />
"It offers," he emphasized, "one-point-five percent cashback on all purchases."
<break time="0.35s" />
"Travel insurance coverage is fifty-thousand euros," he noted approvingly.
<break time="0.35s" />
"The APR," he continued authoritatively, "is twelve-point-nine percent."
<break time="0.35s" />
"You'll receive a welcome bonus of one-hundred-fifty euros."
<break time="0.35s" />
His tone brightened. "There are no foreign transaction fees."
'''.strip(),
        "manipulation_target": "A",
        "variant_type": "Balanced"
    }
}


def generate_audio(scenario_name: str, output_dir: str = "output"):
    """
    Generate audio for a specific scenario using ElevenLabs API.

    Args:
        scenario_name: Name of the scenario from SCENARIOS dict
        output_dir: Directory to save output files
    """
    if scenario_name not in SCENARIOS:
        print(f"❌ Scenario '{scenario_name}' not found!")
        print(f"Available scenarios: {', '.join(SCENARIOS.keys())}")
        return

    scenario = SCENARIOS[scenario_name]
    preset_name = scenario["preset"]
    preset = VOICE_PRESETS[preset_name]

    print(f"\n{'='*60}")
    print(f"Generating: {scenario_name}")
    print(f"{'='*60}")
    print(f"Preset: {preset_name}")
    print(f"Model: {preset['model']}")
    print(f"Voice: {preset['voice_name']} (ID: {preset['voice_id']})")
    print(f"Manipulation Target: {scenario['manipulation_target']}")
    print(f"Variant Type: {scenario['variant_type']}")
    print(f"\nVoice Settings:")
    print(f"  Stability: {preset['stability']}")
    print(f"  Similarity Boost: {preset['similarity_boost']}")
    print(f"  Style: {preset['style']}")
    print(f"  Speed: {preset['speed']}")
    print(f"\nText (first 100 chars):")
    print(f"  {scenario['text'][:100]}...")

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Generate audio
    try:
        print(f"\n⏳ Generating audio...")

        audio_generator = client.text_to_speech.convert(
            text=scenario["text"],
            voice_id=preset["voice_id"],
            model_id=preset["model"],
            voice_settings={
                "stability": preset["stability"],
                "similarity_boost": preset["similarity_boost"],
                "style": preset["style"],
                "use_speaker_boost": preset["use_speaker_boost"]
            },
            # Speed is passed separately in the latest API
            output_format="mp3_44100_128"
        )

        # Save to file
        output_path = os.path.join(output_dir, f"{scenario_name}.mp3")

        with open(output_path, "wb") as f:
            for chunk in audio_generator:
                f.write(chunk)

        print(f"✅ Success! Audio saved to: {output_path}")

        # Save metadata
        metadata_path = os.path.join(output_dir, f"{scenario_name}_metadata.json")
        metadata = {
            "scenario_name": scenario_name,
            "preset": preset_name,
            "voice_settings": {
                "stability": preset["stability"],
                "similarity_boost": preset["similarity_boost"],
                "style": preset["style"],
                "use_speaker_boost": preset["use_speaker_boost"],
                "speed": preset["speed"]
            },
            "model": preset["model"],
            "voice_id": preset["voice_id"],
            "voice_name": preset["voice_name"],
            "manipulation_target": scenario["manipulation_target"],
            "variant_type": scenario["variant_type"],
            "text": scenario["text"],
            "output_file": output_path
        }

        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

        print(f"✅ Metadata saved to: {metadata_path}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise


def generate_all_scenarios(output_dir: str = "output"):
    """Generate audio for all scenarios."""
    print(f"\n{'='*60}")
    print("GENERATING ALL SCENARIOS")
    print(f"{'='*60}")
    print(f"Total scenarios: {len(SCENARIOS)}")

    for scenario_name in SCENARIOS.keys():
        try:
            generate_audio(scenario_name, output_dir)
        except Exception as e:
            print(f"❌ Failed to generate {scenario_name}: {str(e)}")
            continue

    print(f"\n{'='*60}")
    print("✅ GENERATION COMPLETE!")
    print(f"{'='*60}")
    print(f"Output directory: {output_dir}")


def list_scenarios():
    """List all available scenarios."""
    print(f"\n{'='*60}")
    print("AVAILABLE SCENARIOS")
    print(f"{'='*60}")

    for name, scenario in SCENARIOS.items():
        preset = scenario["preset"]
        print(f"\n{name}:")
        print(f"  Preset: {preset}")
        print(f"  Manipulation: {scenario['manipulation_target']}")
        print(f"  Type: {scenario['variant_type']}")
        print(f"  Text preview: {scenario['text'][:80]}...")


if __name__ == "__main__":
    import sys

    # Check for API key
    if not os.getenv("ELEVENLABS_API_KEY"):
        print("❌ Error: ELEVENLABS_API_KEY not found in environment variables!")
        print("\nPlease create a .env file with:")
        print("ELEVENLABS_API_KEY=your_api_key_here")
        sys.exit(1)

    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "list":
            list_scenarios()
        elif command == "all":
            generate_all_scenarios()
        else:
            # Generate specific scenario
            generate_audio(command)
    else:
        # Default: show usage
        print(f"\n{'='*60}")
        print("ELEVENLABS TTS AUDIO GENERATOR")
        print(f"{'='*60}")
        print("\nUsage:")
        print("  python generate_elevenlabs_audio.py list               # List all scenarios")
        print("  python generate_elevenlabs_audio.py all                # Generate all scenarios")
        print("  python generate_elevenlabs_audio.py <scenario_name>    # Generate specific scenario")
        print("\nExamples:")
        print("  python generate_elevenlabs_audio.py premiumgold_authoritative")
        print("  python generate_elevenlabs_audio.py travelplus_authoritative")
        print("\nFirst time setup:")
        print("  1. pip install elevenlabs python-dotenv")
        print("  2. Create .env file with: ELEVENLABS_API_KEY=your_key_here")
        print("  3. Run: python generate_elevenlabs_audio.py list")

        list_scenarios()
