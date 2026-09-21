import { StyleSheet, Text, View } from 'react-native';
import type { Icon } from 'phosphor-react-native';

import { Palette, Type } from '@/constants/theme';

// Shared "nothing here yet" block — every list screen uses this instead of
// silently rendering nothing, with copy specific to what's empty and why.
export function EmptyState({ icon: IconComponent, title, body }: { icon: Icon; title: string; body?: string }) {
  return (
    <View style={styles.container}>
      <IconComponent size={36} color="#CFC9F5" />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 30,
    gap: 6,
  },
  title: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15.5,
    color: Palette.ink,
    marginTop: 6,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.inkMuted,
  },
});
