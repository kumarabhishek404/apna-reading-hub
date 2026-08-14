import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { getTags, createTag, type TagItem } from '@/api/tags';
import { colors } from '@/theme/colors';
import { useToast } from './ToastContext';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  accentColor?: string;
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  label = 'Tags',
  placeholder = 'Select tags',
  error,
  accentColor = colors.primary,
}: TagSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      const data = await getTags();
      setTags(data.tags);
    } catch (err) {
      console.error('[TagSelector] Failed to load tags:', err);
    }
  }

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTagSelected = (tagName: string) => selectedTags.includes(tagName);

  const toggleTag = (tagName: string) => {
    if (isTagSelected(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) return;
    
    const trimmedName = newTagInput.trim();
    if (selectedTags.includes(trimmedName)) {
      showError('Tag already selected');
      return;
    }

    setLoading(true);
    try {
      await createTag(trimmedName);
      onTagsChange([...selectedTags, trimmedName]);
      setNewTagInput('');
      showSuccess('Tag created successfully');
      await loadTags();
    } catch (err) {
      console.error('[TagSelector] Failed to create tag:', err);
      showError('Could not create tag');
    } finally {
      setLoading(false);
    }
  };

  const removeTag = (tagName: string) => {
    onTagsChange(selectedTags.filter(t => t !== tagName));
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: accentColor }]}>{label}</Text> : null}
      
      <Pressable 
        style={[styles.selector, error && styles.selectorError]} 
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
      >
        <View style={styles.selectorContent}>
          {selectedTags.length === 0 ? (
            <Text style={styles.placeholder}>{placeholder}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedTagsScroll}>
              <View style={styles.selectedTagsContainer}>
                {selectedTags.map((tag, index) => (
                  <View key={index} style={[styles.selectedTag, { backgroundColor: accentColor }]}>
                    <Text style={styles.selectedTagText}>{tag}</Text>
                    <Pressable
                      style={styles.removeTagButton}
                      onPress={() => removeTag(tag)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${tag} tag`}
                    >
                      <AppIcon name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
        <AppIcon name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tags</Text>
              <Pressable 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <AppIcon name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search tags..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textMuted}
            />

            <ScrollView style={styles.tagsList} showsVerticalScrollIndicator={false}>
              {filteredTags.length === 0 ? (
                <Text style={styles.noTagsText}>No tags found</Text>
              ) : (
                filteredTags.map((tag) => {
                  const selected = isTagSelected(tag.name);
                  return (
                  <Pressable
                    key={tag.id}
                    style={[
                      styles.tagItem,
                      selected && {
                        backgroundColor: `${accentColor}14`,
                        borderWidth: 1,
                        borderColor: accentColor,
                      },
                    ]}
                    onPress={() => toggleTag(tag.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`${tag.name} ${selected ? 'selected' : 'not selected'}, ${tag.count} items`}
                  >
                    <View style={styles.tagItemContent}>
                      <AppIcon 
                        name={selected ? "checkbox" : "square-outline"} 
                        size={20} 
                        color={selected ? accentColor : colors.textMuted} 
                      />
                      <Text style={[styles.tagName, selected && { fontWeight: '600', color: accentColor }]}>
                        {tag.name}
                      </Text>
                    </View>
                    <Text style={styles.tagCount}>{tag.count}</Text>
                  </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.newTagSection}>
              <TextInput
                style={styles.newTagInput}
                placeholder="Create new tag..."
                value={newTagInput}
                onChangeText={setNewTagInput}
                placeholderTextColor={colors.textMuted}
              />
              <Pressable
                style={[
                  styles.createTagButton,
                  { backgroundColor: accentColor },
                  !newTagInput.trim() && styles.createTagButtonDisabled,
                ]}
                onPress={handleCreateTag}
                disabled={!newTagInput.trim() || loading}
                accessibilityRole="button"
                accessibilityLabel="Create new tag"
              >
                {loading ? (
                  <Text style={styles.createTagButtonText}>...</Text>
                ) : (
                  <>
                    <AppIcon name="add" size={18} color="#fff" />
                    <Text style={styles.createTagButtonText}>Create</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectorError: {
    borderColor: '#ef4444',
  },
  selectorContent: {
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textMuted,
  },
  selectedTagsScroll: {
    flex: 1,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  removeTagButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  tagsList: {
    flex: 1,
    marginBottom: 16,
  },
  noTagsText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  tagItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagName: {
    fontSize: 16,
    color: colors.text,
  },
  tagCount: {
    fontSize: 13,
    color: colors.textMuted,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newTagSection: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  newTagInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  createTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createTagButtonDisabled: {
    opacity: 0.5,
  },
  createTagButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
