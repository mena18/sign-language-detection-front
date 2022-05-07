
from azure.cognitiveservices.speech import AudioDataStream, SpeechConfig, SpeechSynthesizer, SpeechSynthesisOutputFormat
from azure.cognitiveservices.speech.audio import AudioOutputConfig

speech_config = SpeechConfig(subscription="6d1a57a81f69475d8273dccac009deec", region="francecentral")

audio_config = AudioOutputConfig(filename="file.wav")

synthesizer = SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

synthesizer.speak_text_async("hello")



# import azure.cognitiveservices.speech as speechsdk

# speech_config = speechsdk.SpeechConfig(subscription="6d1a57a81f69475d8273dccac009deec", region="francecentral")
# audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)

# # The language of the voice that speaks.
# speech_config.speech_synthesis_voice_name='en-US-JennyNeural'

# speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

# # Get text from the console and synthesize to the default speaker.
# print("Enter some text that you want to speak >")
# text = input()

# speech_synthesis_result = speech_synthesizer.speak_text_async(text).get()

# if speech_synthesis_result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
#     print("Speech synthesized for text [{}]".format(text))
# elif speech_synthesis_result.reason == speechsdk.ResultReason.Canceled:
#     cancellation_details = speech_synthesis_result.cancellation_details
#     print("Speech synthesis canceled: {}".format(cancellation_details.reason))
#     if cancellation_details.reason == speechsdk.CancellationReason.Error:
#         if cancellation_details.error_details:
#             print("Error details: {}".format(cancellation_details.error_details))
#             print("Did you set the speech resource key and region values?")