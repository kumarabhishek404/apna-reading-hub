import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const createOptions = [
    { 
      title: 'New Note', 
      icon: 'document-text-outline' as any,
      iconFilled: 'document-text' as any,
      href: '/(tabs)/notes/create' as any,
      color: colors.primary,
      bgColor: '#FFF7ED',
    },
    { 
      title: 'New Blog', 
      icon: 'newspaper-outline' as any,
      iconFilled: 'newspaper' as any,
      href: '/blogs/create' as any,
      color: '#6366F1',
      bgColor: '#EEF2FF',
    },
    { 
      title: 'Save Link', 
      icon: 'link-outline' as any,
      iconFilled: 'link' as any,
      href: '/links/create' as any,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
    { 
      title: 'Upload PDF', 
      icon: 'document-outline' as any,
      iconFilled: 'document' as any,
      href: '/pdfs/create' as any,
      color: '#EC4899',
      bgColor: '#FDF2F8',
    },
    { 
      title: 'Set Alarm', 
      icon: 'alarm-outline' as any,
      iconFilled: 'alarm' as any,
      href: '/alarms/create' as any,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Create</Text>
        <Text style={styles.screenSubtitle}>Quickly add new content to your library</Text>

        <View style={styles.createGrid}>
          {createOptions.map((option) => (
            <Link key={option.href} href={option.href} asChild>
              <Pressable style={[styles.createCard, { backgroundColor: option.bgColor }]}>
                <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                  <AppIcon name={option.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.createTitle}>{option.title}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={styles.infoCard}>
          <AppIcon name="information-circle-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Offline Ready</Text>
            <Text style={styles.infoText}>All your data saves locally first, then syncs when you're online.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 96,
    gap: 24,
  },
  createGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  createCard: {
    width: '47%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.text,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  createTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
