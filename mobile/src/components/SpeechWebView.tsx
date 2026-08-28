import { useEffect, useRef, type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

const SPEECH_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script>
      var rec = null;
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      function post(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }
      function start(lang) {
        if (!SR) {
          post({ type: 'error', message: 'Speech recognition is not available on this device.' });
          return;
        }
        stop();
        rec = new SR();
        rec.lang = lang || 'en-IN';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = function (event) {
          var text = '';
          var isFinal = true;
          for (var i = event.resultIndex; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
            if (!event.results[i].isFinal) isFinal = false;
          }
          post({ type: 'result', text: text, isFinal: isFinal });
        };
        rec.onerror = function (event) {
          post({ type: 'error', message: event.error || 'Could not hear you' });
        };
        rec.onend = function () {
          post({ type: 'end' });
        };
        rec.start();
        post({ type: 'started' });
      }
      function stop() {
        if (rec) {
          try { rec.stop(); } catch (e) {}
          rec = null;
        }
      }
      window.startSpeech = start;
      window.stopSpeech = stop;
    </script>
  </body>
</html>`;

type SpeechMessage =
  | { type: 'result'; text: string; isFinal: boolean }
  | { type: 'error'; message: string }
  | { type: 'started' }
  | { type: 'end' };

type SpeechWebViewProps = {
  listening: boolean;
  lang?: string;
  onResult: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
  onEnded: () => void;
};

// Expo 52's webview typings collapse to `never` when a ref is attached.
const HiddenWebView = WebView as unknown as ComponentType<any>;

export function SpeechWebView({
  listening,
  lang = 'en-IN',
  onResult,
  onError,
  onEnded,
}: SpeechWebViewProps) {
  const webRef = useRef<{ injectJavaScript: (code: string) => void } | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current) return;
    const command = listening
      ? `startSpeech(${JSON.stringify(lang)}); true;`
      : 'stopSpeech(); true;';
    webRef.current?.injectJavaScript(command);
  }, [listening, lang]);

  return (
    <View style={styles.hidden} pointerEvents="none">
      <HiddenWebView
        ref={webRef}
        source={{ html: SPEECH_HTML }}
        originWhitelist={['*']}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => {
          readyRef.current = true;
          if (listening) {
            webRef.current?.injectJavaScript(`startSpeech(${JSON.stringify(lang)}); true;`);
          }
        }}
        onMessage={(event: { nativeEvent: { data: string } }) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as SpeechMessage;
            if (payload.type === 'result') onResult(payload.text, payload.isFinal);
            if (payload.type === 'error') onError(payload.message);
            if (payload.type === 'end') onEnded();
          } catch {
            // ignore malformed bridge messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
  },
});
