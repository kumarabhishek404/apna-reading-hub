import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { registerAccount } from '@/api/auth';
import { AuthShell } from '@/components/AuthShell';
import { Input } from '@/components/Input';
import { PrimaryButton } from '@/components/PrimaryButton';
import { saveSession } from '@/lib/auth';
import { colors, spacing } from '@/theme/colors';

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
    <AuthShell
      eyebrow="Create account"
      title="Join apna notes"
      subtitle="One hub for notes, blogs, links, PDFs, reminders, and alarms."
      accent={colors.blog.primary}
    >
      <View style={styles.form}>
        <Input
          label="Full name"
          placeholder="Your name"
          value={form.fullName}
          onChangeText={(value) => updateField('fullName', value)}
          accentColor={colors.blog.primary}
        />
        <Input
          label="Title"
          placeholder="Student / Employee / Business"
          value={form.title}
          onChangeText={(value) => updateField('title', value)}
          accentColor={colors.blog.primary}
        />
        <Input
          label="Mobile number"
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          autoCapitalize="none"
          value={form.mobile}
          onChangeText={(value) => updateField('mobile', value)}
          accentColor={colors.blog.primary}
        />
        <Input
          label="Password"
          placeholder="At least 6 characters"
          secureTextEntry
          value={form.password}
          onChangeText={(value) => updateField('password', value)}
          accentColor={colors.blog.primary}
        />
        <Input
          label="Confirm password"
          placeholder="Repeat password"
          secureTextEntry
          value={form.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          accentColor={colors.blog.primary}
        />

        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title={loading ? 'Creating account…' : 'Create account'}
          onPress={handleSubmit}
          disabled={loading}
          color={colors.blog.primary}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already registered?</Text>
          <Pressable onPress={() => router.push('/login' as any)} hitSlop={8}>
            <Text style={[styles.linkText, { color: colors.blog.primary }]}>Sign in</Text>
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
