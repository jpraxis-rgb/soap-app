import React from 'react';
import { Text, View, TextStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const BRAND_ORANGE = '#EA580C';
const BRAND_VIOLET = '#6D28D9';

interface SimboloProps {
  size?: number;
  mono?: boolean;
  monoColor?: string;
}

export function Simbolo({ size = 48, mono = false, monoColor = '#FFFFFF' }: SimboloProps) {
  const orange = mono ? monoColor : BRAND_ORANGE;
  const violet = mono ? monoColor : BRAND_VIOLET;

  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Rect x="14" y="15" width="68" height="18" rx="9" fill={orange} />
      <Rect x="14" y="41" width="33" height="18" rx="9" fill={violet} />
      <Rect x="14" y="64" width="33" height="18" rx="9" fill={violet} />
      <Rect x="52" y="41" width="20" height="41" rx="10" fill={violet} />
    </Svg>
  );
}

interface WordmarkProps {
  size?: number;
  color?: string;
  /** Stack the símbolo above the wordmark text instead of beside it. */
  stacked?: boolean;
}

export function Wordmark({ size = 28, color = BRAND_VIOLET, stacked = false }: WordmarkProps) {
  const textStyle: TextStyle = {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: size,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  };

  const text = (
    <Text style={textStyle} maxFontSizeMultiplier={1.2}>
      <Text style={{ color }}>estuda</Text>
      <Text style={{ color: BRAND_ORANGE }}>tudo</Text>
    </Text>
  );

  if (stacked) {
    return (
      <View style={{ alignItems: 'center', gap: size * 0.5 }}>
        <Simbolo size={size * 1.9} />
        {text}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.35 }}>
      <Simbolo size={size * 1.15} />
      {text}
    </View>
  );
}
