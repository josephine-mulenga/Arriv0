import AsyncStorage from '@react-native-async-storage/async-storage';

// Whether the user has ever actually sent a message in AI chat - drives
// whether the floating "Ask Arri" button still tries to get noticed
// (pulse/tooltip/bounce) or settles down for good. Separate from whether
// they've merely opened the chat screen, since the discoverability problem
// is people never realizing the button leads to chat at all.
const HAS_CHATTED_KEY = 'arriv0_has_chatted';

export async function hasEverChatted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HAS_CHATTED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function markHasChatted(): Promise<void> {
  try {
    await AsyncStorage.setItem(HAS_CHATTED_KEY, 'true');
  } catch {
    // best-effort; worst case the button keeps calling attention to itself
  }
}
