// src/utils/transcribeAudio.ts

export const transcribeAudio = (audioBlob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Ensure the browser supports the Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject("Speech Recognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID"; // Set the language to Indonesian, adjust as needed
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Convert Blob to AudioStream
    const audioURL = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioURL);

    // Play the audio and capture the speech
    audio.onloadedmetadata = () => {
      audio.play();
      recognition.start();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      reject(event.error);
    };
  });
};
