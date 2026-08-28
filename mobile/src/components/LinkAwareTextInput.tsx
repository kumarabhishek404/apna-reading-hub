import { useEffect, useRef, useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { LinkedText } from '@/components/LinkedText';
import { hasLink } from '@/lib/linkify';

type LinkAwareTextInputProps = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
};

export function LinkAwareTextInput({
  value,
  onChangeText,
  style,
  onFocus,
  onBlur,
  ...rest
}: LinkAwareTextInputProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const showLinks = !editing && hasLink(value);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  if (showLinks) {
    return <LinkedText text={value} style={style} onPressText={() => setEditing(true)} />;
  }

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChangeText}
      style={style}
      onFocus={(event) => {
        setEditing(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setEditing(false);
        onBlur?.(event);
      }}
      {...rest}
    />
  );
}
