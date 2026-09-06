import { useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import {
  ClockIcon,
  RobotIcon,
  BellIcon,
  FolderSimpleIcon,
  BuildingsIcon,
  NewspaperIcon,
  type Icon,
} from 'phosphor-react-native';

import { ArrivoLogo } from '@/components/arrivo-logo';
import { PrimaryButton } from '@/components/ui/primary-button';
import { OutlineButton } from '@/components/ui/outline-button';
import { Palette, Type } from '@/constants/theme';

const FEATURES: { icon: Icon; title: string; body: string }[] = [
  {
    icon: ClockIcon,
    title: 'OPT deadline tracking',
    body: 'A personalized countdown to your OPT window, built from your real program dates — not a guess.',
  },
  {
    icon: RobotIcon,
    title: 'AI immigration assistant',
    body: 'Ask anything about CPT, OPT, SEVIS, or F-1 rules and get answers grounded in real guidance.',
  },
  {
    icon: BellIcon,
    title: 'Personalized alerts',
    body: 'Daily briefings tailored to your school, major, and program end date.',
  },
  {
    icon: FolderSimpleIcon,
    title: 'Document checklist',
    body: 'Track your I-20, passport, SSN, EAD card, and every other document you need.',
  },
  {
    icon: BuildingsIcon,
    title: 'DSO directory',
    body: 'Find your Designated School Official instantly — call, email, or visit their office.',
  },
  {
    icon: NewspaperIcon,
    title: 'Immigration news',
    body: 'Real-time updates on F-1 visa policy, filtered by OPT, CPT, and STEM OPT.',
  },
];

const STATS = [
  { number: '1.2M+', label: 'International students in the US' },
  { number: '90 days', label: 'OPT application window' },
  { number: '$520', label: 'OPT filing fee' },
  { number: '3–4 months', label: 'USCIS processing time' },
];

const STEPS = [
  { title: 'Create your account', body: 'Enter your school, major, and program dates.' },
  { title: 'Get your timeline', body: 'Arriv0 builds your personalized F-1 checklist.' },
  { title: 'Stay on track', body: 'Daily alerts and AI answers keep you covered.' },
  { title: 'Get your OPT', body: 'Apply on time and start working legally in the US.' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// PrimaryButton hardcodes a purple background — invisible on this section's
// purple backdrop, so this section needs its own white-on-purple button.
function WhiteCtaButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 12, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 9, stiffness: 200 });
      }}
      style={[styles.ctaButton, animatedStyle]}>
      <Text style={styles.ctaButtonText}>{label}</Text>
    </AnimatedPressable>
  );
}

export function WebLandingPage() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 860;
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});

  const scrollToSection = (key: string) => {
    const y = sectionY.current[key];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: y - 70, animated: true });
  };

  const recordY = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => {
    sectionY.current[key] = e.nativeEvent.layout.y;
  };

  return (
    <View style={styles.root}>
      <View style={styles.nav}>
        <View style={styles.navLogo}>
          <ArrivoLogo size={26} />
          <Text style={styles.navWordmark}>Arriv0</Text>
        </View>
        {!isNarrow && (
          <View style={styles.navLinks}>
            <Pressable onPress={() => scrollToSection('features')}>
              <Text style={styles.navLink}>Features</Text>
            </Pressable>
            <Pressable onPress={() => scrollToSection('how')}>
              <Text style={styles.navLink}>How it works</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.navLink}>Log in</Text>
            </Pressable>
          </View>
        )}
        <Pressable style={styles.navCta} onPress={() => router.push('/intro')}>
          <Text style={styles.navCtaText}>Get started free</Text>
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View entering={FadeInUp.duration(500)}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>For F-1 international students</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.heroLogoRow}>
            <ArrivoLogo size={isNarrow ? 56 : 72} />
          </Animated.View>

          <Animated.Text
            entering={FadeInUp.delay(180).duration(500)}
            style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]}>
            Arriv0
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(260).duration(500)} style={styles.heroTagline}>
            Your journey. Your guide.
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(340).duration(500)} style={styles.heroBody}>
            The AI companion that helps international students navigate every step of their F-1
            visa journey — from landing in the US to getting OPT work authorization.
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(420).duration(500)} style={styles.heroButtons}>
            <PrimaryButton label="Get started free" onPress={() => router.push('/intro')} style={styles.heroButton} />
            <OutlineButton label="Log in" onPress={() => router.push('/login')} style={styles.heroButton} />
          </Animated.View>
        </View>

        <View style={styles.statsBar}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statNumber}>{stat.number}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.problemSection, isNarrow && styles.stackedSection]}>
          <View style={styles.problemText}>
            <Text style={styles.sectionLabel}>The problem</Text>
            <Text style={styles.problemTitle}>
              Missing one deadline can cost you the right to work in America.
            </Text>
            <Text style={styles.problemBody}>
              OPT applications open on a strict 90-day window tied to your program end date.
              Miss it, and you could lose months of authorized work time — or your status
              entirely. Arriv0 tracks every date so you never have to guess.
            </Text>
          </View>
          <View style={styles.problemCard}>
            <Text style={styles.problemStat}>1 day</Text>
            <Text style={styles.problemStatBody}>
              is sometimes the difference between an approved OPT application and a denied one.
            </Text>
          </View>
        </View>

        <View style={styles.featuresSection} onLayout={recordY('features')}>
          <Text style={styles.sectionLabel}>Features</Text>
          <Text style={styles.featuresTitle}>Everything you need in one place</Text>
          <View style={[styles.featureGrid, isNarrow && styles.featureGridNarrow]}>
            {FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <View key={feature.title} style={[styles.featureCard, isNarrow && styles.featureCardNarrow]}>
                  <View style={styles.featureIconTile}>
                    <IconComponent size={20} color={Palette.purple} weight="fill" />
                  </View>
                  <Text style={styles.featureCardTitle}>{feature.title}</Text>
                  <Text style={styles.featureCardBody}>{feature.body}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.howSection} onLayout={recordY('how')}>
          <Text style={[styles.howTitle, { textAlign: 'center' }]}>How it works</Text>
          <View style={[styles.stepsRow, isNarrow && styles.stepsRowNarrow]}>
            {STEPS.map((step, index) => (
              <View key={step.title} style={[styles.step, isNarrow && styles.stepNarrow]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>Start your F-1 journey the right way</Text>
          <Text style={styles.ctaBody}>
            Join international students navigating the US immigration system with confidence.
          </Text>
          <WhiteCtaButton label="Get started free" onPress={() => router.push('/intro')} />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLogoRow}>
            <ArrivoLogo size={22} />
            <Text style={styles.footerLogoText}>Arriv0</Text>
          </View>
          <Text style={styles.footerContact}>prince@arriv0.com</Text>
          <Text style={styles.footerCopy}>© 2026 Arriv0. Built at Voorhees University.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const MAX_WIDTH = 1100;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
    backgroundColor: Palette.white,
    ...(Platform.OS === 'web' ? ({ position: 'sticky', top: 0, zIndex: 10 } as object) : null),
  },
  navLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navWordmark: {
    fontFamily: Type.headingBold,
    fontSize: 18,
    color: Palette.purple,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  navLink: {
    fontFamily: Type.bodySemiBold,
    fontSize: 14,
    color: Palette.inkBody,
  },
  navCta: {
    backgroundColor: Palette.purple,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  navCtaText: {
    fontFamily: Type.bodyBold,
    fontSize: 13,
    color: Palette.white,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 90,
    paddingHorizontal: 24,
    backgroundColor: Palette.purpleTint,
  },
  badge: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  badgeText: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    color: Palette.purple,
  },
  heroLogoRow: {
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: Type.headingBold,
    fontSize: 64,
    letterSpacing: -1.2,
    color: Palette.ink,
  },
  heroTitleNarrow: {
    fontSize: 44,
  },
  heroTagline: {
    marginTop: 6,
    fontFamily: Type.headingSemiBold,
    fontSize: 22,
    color: Palette.inkBody,
  },
  heroBody: {
    marginTop: 18,
    fontFamily: Type.bodyRegular,
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    color: Palette.inkMuted,
    maxWidth: 560,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 36,
  },
  heroButton: {
    minWidth: 180,
  },
  statsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 48,
    backgroundColor: Palette.purpleDark,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 130,
  },
  statNumber: {
    fontFamily: Type.headingBold,
    fontSize: 24,
    color: Palette.white,
  },
  statLabel: {
    marginTop: 4,
    fontFamily: Type.bodyRegular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  problemSection: {
    flexDirection: 'row',
    gap: 48,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 72,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  stackedSection: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  problemText: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: Type.bodyBold,
    fontSize: 12.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Palette.purple,
    marginBottom: 12,
  },
  problemTitle: {
    fontFamily: Type.headingBold,
    fontSize: 30,
    lineHeight: 38,
    color: Palette.ink,
  },
  problemBody: {
    marginTop: 16,
    fontFamily: Type.bodyRegular,
    fontSize: 15.5,
    lineHeight: 25,
    color: Palette.inkMuted,
  },
  problemCard: {
    flex: 1,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
  },
  problemStat: {
    fontFamily: Type.headingBold,
    fontSize: 56,
    color: Palette.purple,
  },
  problemStatBody: {
    marginTop: 12,
    fontFamily: Type.bodyRegular,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    color: Palette.inkMuted,
  },
  featuresSection: {
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  featuresTitle: {
    fontFamily: Type.headingBold,
    fontSize: 30,
    color: Palette.ink,
    marginBottom: 40,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    justifyContent: 'center',
    width: '100%',
  },
  featureGridNarrow: {
    flexDirection: 'column',
  },
  featureCard: {
    width: 320,
    backgroundColor: Palette.purpleCard,
    borderWidth: 1,
    borderColor: Palette.purpleCardBorder,
    borderRadius: 16,
    padding: 22,
  },
  featureCardNarrow: {
    width: '100%',
  },
  featureIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureCardTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    color: Palette.ink,
    marginBottom: 6,
  },
  featureCardBody: {
    fontFamily: Type.bodyRegular,
    fontSize: 13.5,
    lineHeight: 20,
    color: Palette.inkMuted,
  },
  howSection: {
    backgroundColor: Palette.dividerLight,
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  howTitle: {
    fontFamily: Type.headingBold,
    fontSize: 28,
    color: Palette.ink,
    marginBottom: 40,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 24,
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  stepsRowNarrow: {
    flexDirection: 'column',
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  stepNarrow: {
    flex: undefined,
    marginBottom: 8,
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepNumberText: {
    fontFamily: Type.headingBold,
    fontSize: 17,
    color: Palette.white,
  },
  stepTitle: {
    fontFamily: Type.headingSemiBold,
    fontSize: 15,
    color: Palette.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  stepBody: {
    fontFamily: Type.bodyRegular,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.inkMuted,
    textAlign: 'center',
    maxWidth: 220,
  },
  cta: {
    alignItems: 'center',
    paddingVertical: 72,
    paddingHorizontal: 32,
    backgroundColor: Palette.purple,
  },
  ctaTitle: {
    fontFamily: Type.headingBold,
    fontSize: 28,
    color: Palette.white,
    textAlign: 'center',
  },
  ctaBody: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    maxWidth: 460,
  },
  ctaButton: {
    marginTop: 28,
    backgroundColor: Palette.white,
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 40,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: Type.headingSemiBold,
    fontSize: 16,
    color: Palette.purple,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: Palette.divider,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLogoText: {
    fontFamily: Type.headingBold,
    fontSize: 15,
    color: Palette.purple,
  },
  footerContact: {
    marginTop: 10,
    fontFamily: Type.bodyRegular,
    fontSize: 12.5,
    color: Palette.inkFaint,
  },
  footerCopy: {
    marginTop: 6,
    fontFamily: Type.bodyRegular,
    fontSize: 11.5,
    color: Palette.inkPlaceholder,
  },
});
