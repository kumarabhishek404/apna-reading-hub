import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { loginAccount } from '@/api/auth';
import { saveSession } from '@/lib/auth';

export default function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setLoading(true);
    setError('');

    try {
      const session = await loginAccount({ mobile, password });
      await saveSession(session);
      router.replace('/(tabs)/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.title}>Sign in to Apna Sathi</Text>

          <TextInput
            style={styles.input}
            placeholder="Mobile number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}

          <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New here?</Text>
            <Pressable onPress={() => router.push('/register' as any)}>
              <Text style={styles.linkText}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#edf3ff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#22409a',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: '#22409a', textTransform: 'uppercase' },
  title: { marginTop: 8, marginBottom: 20, fontSize: 28, fontWeight: '800', color: '#1d2f5f' },
  input: {
    borderWidth: 1,
    borderColor: '#dfe8f8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f8faff',
    color: '#1d2f5f',
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#22409a',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  alert: {
    marginTop: 12,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alertText: { color: '#be123c', fontSize: 13, fontWeight: '600' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 6 },
  footerText: { color: '#5f6d89', fontSize: 14 },
  linkText: { color: '#22409a', fontWeight: '700', fontSize: 14 },
});
