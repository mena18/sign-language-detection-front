from azure.cognitiveservices.speech import AudioDataStream, SpeechConfig, SpeechSynthesizer, SpeechSynthesisOutputFormat
from azure.cognitiveservices.speech.audio import AudioOutputConfig

speech_config = SpeechConfig(subscription="6d1a57a81f69475d8273dccac009deec", region="francecentral")

audio_config = AudioOutputConfig(filename="path/to/write/file.wav")

synthesizer = SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

synthesizer.speak_text_async("A simple test to write to a file.")