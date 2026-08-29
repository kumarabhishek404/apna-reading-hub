import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { getTags, createTag, type TagItem } from '@/api/tags';
import { tagOfflineRepository } from '@/lib/offlineRepositories/genericOfflineRepository';
import { networkMonitor } from '@/lib/networkMonitor';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  async function loadTags() {
    try {
      if (!networkMonitor.isOnline()) {
        const local = await tagOfflineRepository.getAllEntities('tag');
        setTags(local as TagItem[]);
        return;
      }
      const data = await getTags();
      setTags(data.tags);
      void tagOfflineRepository.hydrateFromServer('tag', data.tags);
    } catch (err) {
      console.warn('[TagSelector] Failed to load tags:', err);
      const local = await tagOfflineRepository.getAllEntities('tag').catch(() => []);
      setTags(local as TagItem[]);
    }
  }

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
      if (!networkMonitor.isOnline()) {
        onTagsChange([...selectedTags, trimmedName]);
        setTags((current) =>
          current.some((tag) => tag.name === trimmedName)
            ? current
            : [...current, { id: trimmedName, name: trimmedName, count: 0 }],
        );
        setNewTagInput('');
        setShowNewTagInput(false);
        showSuccess('Tag added. It will sync when you are online.');
        return;
      }
      await createTag(trimmedName);
      onTagsChange([...selectedTags, trimmedName]);
      setNewTagInput('');
      setShowNewTagInput(false);
      showSuccess('Tag created successfully');
      await loadTags();
    } catch (err) {
      console.warn('[TagSelector] Failed to create tag:', err);
      onTagsChange([...selectedTags, trimmedName]);
      setNewTagInput('');
      setShowNewTagInput(false);
      showSuccess('Tag added on this device');
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
        onPress={() => setDropdownOpen(!dropdownOpen)}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        accessibilityState={{ expanded: dropdownOpen }}
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
                      onPress={(e) => {
                        e.stopPropagation();
                        removeTag(tag);
                      }}
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
        <AppIcon name={dropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {dropdownOpen && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
            {tags.length === 0 ? (
              <Text style={styles.noTagsText}>No tags created yet</Text>
            ) : (
              tags.map((tag) => {
                const selected = isTagSelected(tag.name);
                return (
                  <Pressable
                    key={tag.id}
                    style={[
                      styles.dropdownItem,
                      selected && {
                        backgroundColor: `${accentColor}14`,
                        borderWidth: 1,
                        borderColor: accentColor,
                      },
                    ]}
                    onPress={() => toggleTag(tag.name)}
                    accessibilityRole="button"
                    accessibilityLabel={`${tag.name} ${selected ? 'selected' : 'not selected'}`}
                  >
                    <View style={styles.dropdownItemContent}>
                      <AppIcon 
                        name={selected ? "checkbox" : "square-outline"} 
                        size={18} 
                        color={selected ? accentColor : colors.textMuted} 
                      />
                      <Text style={[styles.dropdownItemText, selected && { fontWeight: '600', color: accentColor }]}>
                        {tag.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
            
            <Pressable
              style={styles.addNewTagItem}
              onPress={() => setShowNewTagInput(!showNewTagInput)}
              accessibilityRole="button"
              accessibilityLabel="Add new tag"
            >
              <View style={styles.dropdownItemContent}>
                <AppIcon name="add-circle-outline" size={18} color={accentColor} />
                <Text style={[styles.dropdownItemText, { color: accentColor }]}>Add New Tag</Text>
              </View>
              <AppIcon 
                name={showNewTagInput ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={accentColor} 
              />
            </Pressable>

            {showNewTagInput && (
              <View style={styles.newTagInputContainer}>
                <TextInput
                  style={styles.newTagInput}
                  placeholder="Enter new tag name..."
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  placeholderTextColor={colors.textMuted}
                  autoFocus
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
                      <AppIcon name="add" size={16} color="#fff" />
                      <Text style={styles.createTagButtonText}>Create</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    zIndex: 10,
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
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 250,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    paddingVertical: 8,
  },
  noTagsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.text,
  },
  addNewTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  newTagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  newTagInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  createTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createTagButtonDisabled: {
    opacity: 0.5,
  },
  createTagButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
