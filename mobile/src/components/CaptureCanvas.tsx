import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AppIcon } from '@/components/AppIcon';
import { AttachMenu } from '@/components/AttachMenu';
import { SpeechWebView } from '@/components/SpeechWebView';
import { TypingPlaceholder } from '@/components/TypingPlaceholder';
import { HandwritingCanvas, DRAWING_MODAL_ORIENTATIONS } from '@/components/HandwritingCanvas';
import { useToast } from '@/components/ToastContext';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import {
  interpretCapture,
  isBlankCapture,
  type CaptureAttachment,
  type CaptureKind,
} from '@/lib/captureIntent';
import { saveCapture } from '@/lib/captureSave';
import { useActionGate } from '@/lib/useActionGate';
import { colors } from '@/theme/colors';
import { getTypeTheme } from '@/theme/typeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function saveLabel(kind: CaptureKind, loading: boolean) {
  if (loading) return 'Saving...';
  if (kind === 'alarm') return 'Set alarm';
  if (kind === 'reminder') return 'Set reminder';
  return 'Save';
}

export function CaptureCanvas() {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<CaptureAttachment[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [interimSpeech, setInterimSpeech] = useState('');
  const committedTextRef = useRef('');
  const attachmentsRef = useRef<CaptureAttachment[]>([]);
  const voiceCommandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistInFlight = useRef(false);
  const runExclusive = useActionGate();

  const { showSuccess, showError, showInfo } = useToast();
  const insets = useSafeAreaInsets();

  const displayText = interimSpeech
    ? `${text}${text.trim() ? ' ' : ''}${interimSpeech}`
    : text;
  const deferredText = useDeferredValue(displayText);
  const deferredAttachments = useDeferredValue(attachments);

  const intent = useMemo(
    () => interpretCapture({ text: deferredText, attachments: deferredAttachments }),
    [deferredText, deferredAttachments],
  );
  const theme = getTypeTheme(intent.kind);

  useEffect(() => {
    committedTextRef.current = text;
  }, [text]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const clearBoard = useCallback(() => {
    committedTextRef.current = '';
    setText('');
    setAttachments([]);
    setInterimSpeech('');
  }, []);

  const persist = useCallback(
    async (fromVoiceCommand = false) => {
      if (persistInFlight.current) return;
      setAttachOpen(false);
      const currentText = `${committedTextRef.current}${interimSpeech ? ` ${interimSpeech}` : ''}`.trim();
      const currentAttachments = attachmentsRef.current;
      const currentIntent = interpretCapture({
        text: currentText,
        attachments: currentAttachments,
      });

      if (isBlankCapture({ text: currentText, attachments: currentAttachments })) {
        if (!fromVoiceCommand) showInfo('Write, speak, or attach something first');
        return;
      }

      persistInFlight.current = true;
      setLoading(true);
      try {
        const result = await saveCapture({
          intent: currentIntent,
          attachments: currentAttachments,
        });
        setStatus(result.message);
        showSuccess(result.message);
        clearBoard();
      } catch (error) {
        console.warn('[Capture] Save failed', error);
        showError(error instanceof Error ? error.message : 'Could not save. Try again.');
      } finally {
        persistInFlight.current = false;
        setLoading(false);
      }
    },
    [clearBoard, interimSpeech, showError, showInfo, showSuccess],
  );

  const applySpeech = useCallback((spoken: string, isFinal: boolean) => {
    const cleaned = spoken.trim();
    if (!cleaned) return;
    if (isFinal) {
      const next = `${committedTextRef.current}${committedTextRef.current.trim() ? ' ' : ''}${cleaned}`.trim();
      committedTextRef.current = next;
      setText(next);
      setInterimSpeech('');
      const nextIntent = interpretCapture({
        text: next,
        attachments: attachmentsRef.current,
      });
      if (
        (nextIntent.kind === 'alarm' || nextIntent.kind === 'reminder') &&
        nextIntent.confidence === 'high'
      ) {
        if (voiceCommandTimer.current) clearTimeout(voiceCommandTimer.current);
        voiceCommandTimer.current = setTimeout(() => {
          void persist(true);
        }, 500);
      }
    } else {
      setInterimSpeech(cleaned);
    }
  }, [persist]);

  const { listening, usingWebView, start, stop } = useSpeechToText({
    lang: /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN',
    onTranscript: applySpeech,
    onError: (message) => {
      setInterimSpeech('');
      showError(message);
    },
  });

  async function toggleMic() {
    await runExclusive(async () => {
      setAttachOpen(false);
      if (listening) {
        await stop();
        return;
      }
      committedTextRef.current = text;
      setInterimSpeech('');
      await start();
    });
  }

  async function addImages(fromCamera: boolean) {
    await runExclusive(async () => {
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Camera needed', 'Allow camera access to snap a photo into this board.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setAttachments((current) => [
            ...current,
            {
              type: 'image',
              uri: asset.uri,
              name: asset.fileName || `photo-${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
            },
          ]);
        }
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Photos needed', 'Allow photo access to attach images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        setAttachments((current) => [
          ...current,
          ...result.assets.map((asset) => ({
            type: 'image' as const,
            uri: asset.uri,
            name: asset.fileName || `photo-${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
          })),
        ]);
      }
    } catch (error) {
      console.error('[Capture] Image pick failed', error);
      showError('Could not add image');
    }
    });
  }

  async function addFile() {
    await runExclusive(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', '*/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled) return;
      setAttachments((current) => [
        ...current,
        ...result.assets.map((asset) => {
          const isPdf =
            (asset.mimeType || '').includes('pdf') ||
            (asset.name || '').toLowerCase().endsWith('.pdf');
          return {
            type: (isPdf ? 'pdf' : 'file') as CaptureAttachment['type'],
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType || undefined,
          };
        }),
      ]);
    } catch (error) {
      console.error('[Capture] File pick failed', error);
      showError('Could not add file');
    }
    });
  }

  function removeAttachment(uri: string) {
    setAttachments((current) => current.filter((item) => item.uri !== uri));
  }

  const empty = isBlankCapture({ text: displayText, attachments });

  return (
    <View style={styles.flex}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {usingWebView ? (
        <SpeechWebView
          listening={listening}
          lang={/[\u0900-\u097F]/.test(displayText) ? 'hi-IN' : 'en-IN'}
          onResult={applySpeech}
          onError={(message) => showError(message)}
          onEnded={() => {
            void stop();
          }}
        />
      ) : null}

      <View style={[styles.flex, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {fullScreen ? null : (
        <Animated.View entering={FadeInDown.duration(520).springify().damping(18)} style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandLockup}>
              <View style={styles.logoMark}>
                <Image
                  source={require('../../assets/splash-icon.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <View>
                <Text style={styles.brandName}>Apna Notes</Text>
                <Text style={styles.brandHint}>Your Personal Notebook</Text>
              </View>
            </View>
            <Pressable
              style={styles.notebookButton}
              onPress={() => router.push('/(tabs)/notes')}
              accessibilityRole="button"
              accessibilityLabel="Open Notebook"
            >
              <Text style={styles.notebookLabel}>Notebook</Text>
              <AppIcon name="book-outline" size={15} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.title}>What's on your mind?</Text>
          <Text style={styles.subtitle}>Write, speak, or attach a file. We'll keep it with you.</Text>
        </Animated.View>
        )}

        <Animated.View entering={FadeIn.delay(120).duration(560)} style={[styles.paper, fullScreen && styles.paperFullScreen]}>
          {displayText.trim() || attachments.length > 0 ? (
            <View style={[styles.intentPill, { backgroundColor: theme.muted }]}>
              <View style={[styles.intentDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.intentLine, { color: theme.dark }]} numberOfLines={1}>
                {intent.preview}
              </Text>
            </View>
          ) : null}

          <View style={styles.composerWrap}>
            <TextInput
              style={styles.composer}
              placeholder={listening ? 'Listening…' : ''}
              placeholderTextColor={colors.textMuted}
              value={displayText}
              onChangeText={(value) => {
                committedTextRef.current = value;
                setText(value);
                setInterimSpeech('');
              }}
              multiline
              textAlignVertical="top"
              editable={!listening}
              autoFocus
              caretHidden={!displayText && !listening}
              underlineColorAndroid="transparent"
              selectionColor={colors.primary}
            />
            <TypingPlaceholder visible={!listening && !displayText} />
          </View>

          {attachments.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attachmentRow}
            >
              {attachments.map((item) => (
                <View key={item.uri} style={styles.attachmentCard}>
                  {item.type === 'image' || item.type === 'drawing' ? (
                    <Image source={{ uri: item.uri }} style={styles.attachmentImage} />
                  ) : (
                    <View style={styles.filePreview}>
                      <AppIcon name="document-outline" size={22} color={colors.pdf.primary} />
                      <Text style={styles.fileName} numberOfLines={2}>
                        {item.name || 'File'}
                      </Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.removeAttachment}
                    onPress={() => removeAttachment(item.uri)}
                    accessibilityLabel="Remove attachment"
                  >
                    <AppIcon name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <View style={[styles.toolbar, { zIndex: 6 }]}>
            <View style={styles.toolGroup}>
            <Pressable
              style={[styles.toolButton, listening && styles.toolButtonLive]}
              onPress={() => void toggleMic()}
              accessibilityLabel={listening ? 'Stop listening' : 'Speak'}
            >
              <AppIcon name={listening ? 'mic' : 'mic-outline'} size={18} color={listening ? '#fff' : colors.primary} />
            </Pressable>
            <AttachMenu
              open={attachOpen}
              onToggle={() => setAttachOpen((current) => !current)}
              onSelect={(action) => {
                if (action === 'camera') void addImages(true);
                else if (action === 'library') void addImages(false);
                else void addFile();
              }}
            />
            <Pressable
              style={styles.toolButton}
              onPress={() => {
                setAttachOpen(false);
                setDrawing(true);
              }}
              accessibilityLabel="Write by hand"
            >
              <AppIcon name="pencil-outline" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              style={styles.toolButton}
              onPress={() => {
                setAttachOpen(false);
                setFullScreen((current) => !current);
              }}
              accessibilityLabel={fullScreen ? "Exit full screen" : "Write in full screen"}
            >
              <AppIcon name={fullScreen ? 'contract-outline' : 'expand-outline'} size={18} color={colors.primary} />
            </Pressable>
            </View>
            <Pressable
              style={[
                styles.saveButton,
                { backgroundColor: empty ? colors.borderLight : theme.primary },
              ]}
              onPress={() => void persist(false)}
              disabled={empty || loading}
              accessibilityLabel={saveLabel(intent.kind, loading)}
            >
              <Text style={[styles.saveButtonText, empty && styles.saveButtonTextDisabled]} numberOfLines={1}>
                {saveLabel(intent.kind, loading)}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
    <Modal
      visible={drawing}
      animationType="fade"
      presentationStyle="overFullScreen"
      supportedOrientations={[...DRAWING_MODAL_ORIENTATIONS]}
      statusBarTranslucent
      onRequestClose={() => setDrawing(false)}
    >
      <View style={{ flex: 1 }}>
      <HandwritingCanvas
        onCancel={() => setDrawing(false)}
        onComplete={(uris) => {
          setAttachments((current) => [
            ...current,
            ...uris.map((uri, index) => ({
              type: 'drawing' as const,
              uri,
              name: `drawing-${Date.now()}-${index + 1}.jpg`,
              mimeType: 'image/jpeg',
            })),
          ]);
          setDrawing(false);
        }}
      />
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  brandHint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    lineHeight: 20,
  },
  notebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(34, 64, 154, 0.14)',
  },
  notebookLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.2,
  },
  paper: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'visible',
    zIndex: 2,
  },
  paperFullScreen: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  intentPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
    maxWidth: '100%',
  },
  intentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  intentLine: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  composerWrap: {
    flex: 1,
    minHeight: 120,
  },
  composer: {
    flex: 1,
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '400',
    color: colors.text,
    padding: 0,
    minHeight: 120,
  },
  attachmentRow: {
    gap: 10,
    paddingVertical: 8,
  },
  attachmentCard: {
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  filePreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
  },
  fileName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.pdf.dark,
    textAlign: 'center',
  },
  removeAttachment: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    width: '100%',
  },
  toolGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolButton: {
    width: 36,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.note.muted,
  },
  toolButtonLive: {
    backgroundColor: colors.error,
  },
  saveButton: {
    flexShrink: 0,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  saveButtonTextDisabled: {
    color: colors.textMuted,
  },
});

