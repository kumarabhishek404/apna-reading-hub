import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

const PHRASES = [
  'Write a note…',
  'Draw a note…',
  'Save a PDF…',
  'Paste a link…',
  'Draft a blog…',
  'Set an alarm…',
  'Add a reminder…',
];

export function TypingPlaceholder({ visible }: { visible: boolean }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    const blink = setInterval(() => setCaretOn((on) => !on), 530);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const phrase = PHRASES[phraseIndex];
    const atEnd = !deleting && charCount === phrase.length;
    const atStart = deleting && charCount === 0;
    const delay = atEnd ? 1500 : atStart ? 280 : deleting ? 28 : 46;

    const timer = setTimeout(() => {
      if (!deleting && charCount < phrase.length) {
        setCharCount((count) => count + 1);
        return;
      }
      if (atEnd) {
        setDeleting(true);
        return;
      }
      if (deleting && charCount > 0) {
        setCharCount((count) => count - 1);
        return;
      }
      setDeleting(false);
      setPhraseIndex((index) => (index + 1) % PHRASES.length);
    }, delay);

    return () => clearTimeout(timer);
  }, [visible, phraseIndex, charCount, deleting]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Text style={styles.text}>
        {PHRASES[phraseIndex].slice(0, charCount)}
        <Text style={[styles.caret, { opacity: caretOn ? 1 : 0 }]}>|</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    fontSize: 20,
    lineHeight: 32,
    fontWeight: '400',
    color: colors.textMuted,
  },
  caret: {
    color: colors.primary,
    fontWeight: '400',
  },
});
