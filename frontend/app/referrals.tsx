import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  CaretLeftIcon,
  CopyIcon,
  ShareNetworkIcon,
  CheckCircleIcon,
  ClockIcon,
  GiftIcon,
} from 'phosphor-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { useAuth } from '@/AuthContext';
import { generateReferralCode, getReferralStats, sendReferralInvite, verifyReferralCode } from '@/api';

interface ReferralStats {
  referral_code: string | null;
  total_invites: number;
  pending: number;
  completed: number;
  share_message: string | null;
}

export default function ReferralsScreen() {
  const { token } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await generateReferralCode(token);
        const data = await getReferralStats(token);
        setStats(data);
      } catch {
        // leave stats null; screen shows a retry-friendly empty state
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleCopy = async () => {
    if (!stats?.referral_code) return;
    await Clipboard.setStringAsync(stats.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!stats?.share_message) return;
    try {
      await Share.share({ message: stats.share_message });
    } catch {
      // user dismissed the share sheet; nothing to do
    }
  };

  const handleInvite = async () => {
    if (!token || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteMessage(null);
    try {
      const result = await sendReferralInvite(inviteEmail.trim(), token);
      setInviteMessage(result.message);
      setInviteEmail('');
      const refreshed = await getReferralStats(token);
      setStats(refreshed);
    } catch (err) {
      setInviteMessage(err instanceof Error ? err.message : 'Could not send that invite.');
    } finally {
      setInviting(false);
    }
  };

  const handleRedeem = async () => {
    if (!token || !redeemCode.trim()) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      const result = await verifyReferralCode(redeemCode.trim(), token);
      setRedeemMessage(result.message);
      if (result.valid) setRedeemCode('');
    } catch (err) {
      setRedeemMessage(err instanceof Error ? err.message : 'Could not verify that code.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <CaretLeftIcon size={20} color={Palette.ink} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Invite Friends</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroIconSquare}>
          <GiftIcon size={34} color={Palette.purple} weight="fill" />
        </View>
        <Text style={styles.heroTitle}>Help another F-1 student get on track</Text>
        <Text style={styles.heroBody}>
          Share your code — anyone who signs up with it gets Arriv0 too, and you&apos;ll see it show
          up here once they do.
        </Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading your referral code...</Text>
        ) : stats?.referral_code ? (
          <>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Your code</Text>
              <Text style={styles.codeText}>{stats.referral_code}</Text>
              <View style={styles.codeActions}>
                <Pressable style={styles.codeButton} onPress={handleCopy}>
                  <CopyIcon size={16} color={Palette.purple} />
                  <Text style={styles.codeButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
                </Pressable>
                <Pressable style={styles.codeButton} onPress={handleShare}>
                  <ShareNetworkIcon size={16} color={Palette.purple} />
                  <Text style={styles.codeButtonText}>Share</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statNumber}>{stats.total_invites}</Text>
                <Text style={styles.statLabel}>Invited</Text>
              </View>
              <View style={styles.statTile}>
                <ClockIcon size={14} color={Palette.amber} style={{ marginBottom: 2 }} />
                <Text style={styles.statNumber}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statTile}>
                <CheckCircleIcon size={14} color={Palette.green} weight="fill" style={{ marginBottom: 2 }} />
                <Text style={styles.statNumber}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Joined</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Invite by email</Text>
              <View style={styles.inviteRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="friend@school.edu"
                  placeholderTextColor={Palette.inkPlaceholder}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <PrimaryButton
                label={inviting ? 'Sending...' : 'Send Invite'}
                onPress={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                style={styles.inviteButton}
              />
              {inviteMessage ? <Text style={styles.messageText}>{inviteMessage}</Text> : null}
            </View>
          </>
        ) : (
          <Text style={styles.loadingText}>
            Couldn&apos;t load your referral code right now — try again shortly.
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Have a code from a friend?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter their code"
            placeholderTextColor={Palette.inkPlaceholder}
            value={redeemCode}
            onChangeText={(v) => setRedeemCode(v.toUpperCase())}
            autoCapitalize="characters"
          />
          <PrimaryButton
            label={redeeming ? 'Checking...' : 'Redeem Code'}
            onPress={handleRedeem}
            disabled={redeeming || !redeemCode.trim()}
            style={styles.inviteButton}
          />
          {redeemMessage ? <Text style={styles.messageText}>{redeemMessage}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Type.headingBold,
    fontSize: 20,
    color: Palette.ink,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 60,
    alignItems: 'center',
  },
  heroIconSquare: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Palette.purpleTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 18,
    fontFamily: Type.headingBold,
    fontSize: 19,
    textAlign: 'center',
    color: Palette.ink,
  },
  heroBody: {
    marginTop: 8,
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'center',
    color: Palette.inkMuted,
    maxWidth: 300,
  },
  loadingText: {
    marginTop: 24,
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    color: Palette.inkMuted,
    textAlign: 'center',
  },
  codeCard: {
    width: '100%',
    marginTop: 26,
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: Radius.cardLarge,
    padding: Spacing.cardPaddingLarge,
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12,
    color: Palette.inkMuted,
    letterSpacing: 0.5,
  },
  codeText: {
    marginTop: 6,
    fontFamily: Type.headingBold,
    fontSize: 32,
    letterSpacing: 4,
    color: Palette.purple,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  codeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.borderInput,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  codeButtonText: {
    fontFamily: Type.bodySemiBold,
    fontSize: 13,
    color: Palette.purple,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 18,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.cardSmall,
    paddingVertical: 14,
  },
  statNumber: {
    fontFamily: Type.headingBold,
    fontSize: 20,
    color: Palette.ink,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkFaint,
  },
  fieldGroup: {
    width: '100%',
    gap: 8,
    marginTop: 24,
  },
  fieldLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.inkMuted,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.borderInput,
    backgroundColor: Palette.surfaceSubtle,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Type.bodyRegular,
    fontSize: 14,
    color: Palette.ink,
  },
  inviteButton: {
    marginTop: 2,
  },
  messageText: {
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkMuted,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Palette.divider,
    marginTop: 30,
  },
});
