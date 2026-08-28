import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

type NativeSpeech = {
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: () => Promise<{ granted: boolean }>;
    start: (options: {
      lang?: string;
      interimResults?: boolean;
      continuous?: boolean;
    }) => void;
    stop: () => void;
    abort?: () => void;
    isRecognitionAvailable?: () => boolean;
    addListener: (event: string, handler: (payload: any) => void) => { remove: () => void };
  };
};

function loadNativeSpeech(): NativeSpeech | null {
  try {
    return require('expo-speech-recognition') as NativeSpeech;
  } catch {
    return null;
  }
}

export function useSpeechToText(options: {
  lang?: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [usingWebView, setUsingWebView] = useState(false);
  const nativeRef = useRef<NativeSpeech | null>(loadNativeSpeech());
  const subscriptions = useRef<Array<{ remove: () => void }>>([]);
  const onTranscriptRef = useRef(options.onTranscript);
  const onErrorRef = useRef(options.onError);
  onTranscriptRef.current = options.onTranscript;
  onErrorRef.current = options.onError;

  const clearNativeListeners = useCallback(() => {
    subscriptions.current.forEach((sub) => sub.remove());
    subscriptions.current = [];
  }, []);

  useEffect(() => () => {
    clearNativeListeners();
    try {
      nativeRef.current?.ExpoSpeechRecognitionModule.stop();
    } catch {
      // already stopped
    }
  }, [clearNativeListeners]);

  const start = useCallback(async () => {
    const native = nativeRef.current;
    if (native?.ExpoSpeechRecognitionModule) {
      try {
        const available = native.ExpoSpeechRecognitionModule.isRecognitionAvailable?.() ?? true;
        if (available) {
          const permission = await native.ExpoSpeechRecognitionModule.requestPermissionsAsync();
          if (!permission.granted) {
            onErrorRef.current?.('Allow the microphone to speak notes, alarms, and reminders.');
            return false;
          }
          clearNativeListeners();
          subscriptions.current.push(
            native.ExpoSpeechRecognitionModule.addListener('result', (event) => {
              const transcript = Array.isArray(event?.results)
                ? event.results.map((item: { transcript?: string }) => item.transcript || '').join('')
                : event?.transcript || '';
              if (transcript) {
                onTranscriptRef.current(transcript, Boolean(event?.isFinal));
              }
            }),
          );
          subscriptions.current.push(
            native.ExpoSpeechRecognitionModule.addListener('error', (event) => {
              onErrorRef.current?.(event?.message || event?.error || 'Could not hear you');
              setListening(false);
            }),
          );
          subscriptions.current.push(
            native.ExpoSpeechRecognitionModule.addListener('end', () => {
              setListening(false);
            }),
          );
          native.ExpoSpeechRecognitionModule.start({
            lang: options.lang || 'en-IN',
            interimResults: true,
            continuous: true,
          });
          setUsingWebView(false);
          setListening(true);
          return true;
        }
      } catch (error) {
        console.warn('[Speech] Native recognition failed, using WebView fallback', error);
      }
    }

    if (Platform.OS === 'ios') {
      onErrorRef.current?.(
        'Voice needs a development build on iPhone. You can still type, or attach a file.',
      );
      return false;
    }

    setUsingWebView(true);
    setListening(true);
    return true;
  }, [clearNativeListeners, options.lang]);

  const stop = useCallback(async () => {
    try {
      nativeRef.current?.ExpoSpeechRecognitionModule.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  return {
    listening,
    usingWebView,
    start,
    stop,
  };
}
