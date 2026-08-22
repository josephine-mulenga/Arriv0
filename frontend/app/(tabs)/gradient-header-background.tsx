import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

import { ArrivoLogo } from '@/components/arrivo-logo';

export function GradientHeaderBackground({ logoSize = 50 }) {
  return (
    <View style={{ width: '100%', height: '100%' }}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="screenHeaderGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A9C9FF" />
            <Stop offset="0.5" stopColor="#C3B9FF" />
            <Stop offset="1" stopColor="#DCC4FA" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="250" fill="url(#screenHeaderGradient)" />
        <Circle cx="330" cy="60" r="3" fill="#FFFFFF" opacity="0.8" />
        <Circle cx="60" cy="90" r="2.5" fill="#FFFFFF" opacity="0.6" />
        <Circle cx="200" cy="40" r="2" fill="#FFFFFF" opacity="0.7" />
      </Svg>
      <View style={styles.logoWrap} pointerEvents="none">
        <ArrivoLogo size={logoSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
