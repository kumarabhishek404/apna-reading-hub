import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { loginAccount } from '@/api/auth';
import { AuthShell } from '@/components/AuthShell';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { saveSession } from '@/lib/auth';
import { colors, spacing } from '@/theme/colors';

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
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Pick up where you left your notes, links, and reading list."
    >
      <View style={styles.form}>
        <Input
          label="Mobile number"
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          autoCapitalize="none"
          value={mobile}
          onChangeText={setMobile}
          accentColor={colors.primary}
        />
        <Input
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accentColor={colors.primary}
        />

        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title={loading ? 'Signing in…' : 'Sign in'}
          onPress={handleLogin}
          disabled={loading}
          color={colors.primary}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New here?</Text>
          <Pressable onPress={() => router.push('/register' as any)} hitSlop={8}>
            <Text style={styles.linkText}>Create account</Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  alert: {
    backgroundColor: colors.pdf.muted,
    borderWidth: 1,
    borderColor: colors.pdf.soft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alertText: {
    color: colors.pdf.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: 6,
    flexWrap: 'wrap',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  linkText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
});
