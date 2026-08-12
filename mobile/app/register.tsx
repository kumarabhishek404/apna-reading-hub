import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { registerAccount } from '@/api/auth';
import { saveSession } from '@/lib/auth';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    fullName: '',
    title: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const session = await registerAccount(form);
      await saveSession(session);
      router.replace('/(tabs)/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Create account</Text>
          <Text style={styles.title}>Start with your details</Text>

          <TextInput style={styles.input} placeholder="Full name" value={form.fullName} onChangeText={(value) => updateField('fullName', value)} />
          <TextInput style={styles.input} placeholder="Title (Student / Employee / Business)" value={form.title} onChangeText={(value) => updateField('title', value)} />
          <TextInput style={styles.input} placeholder="Mobile number" keyboardType="phone-pad" value={form.mobile} onChangeText={(value) => updateField('mobile', value)} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={(value) => updateField('password', value)} />
          <TextInput style={styles.input} placeholder="Confirm password" secureTextEntry value={form.confirmPassword} onChangeText={(value) => updateField('confirmPassword', value)} />

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}

          <Pressable style={[styles.primaryButton, loading && styles.disabledButton]} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Creating account...' : 'Create account'}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered?</Text>
            <Pressable onPress={() => router.push('/login' as any)}>
              <Text style={styles.linkText}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff7ef' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: '#ff8a00', textTransform: 'uppercase' },
  title: { marginTop: 8, marginBottom: 20, fontSize: 28, fontWeight: '800', color: '#1d2f5f' },
  input: {
    borderWidth: 1,
    borderColor: '#f3d7b8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fffaf5',
    color: '#1d2f5f',
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#ff8a00',
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
