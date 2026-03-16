import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';

import { borderRadius, type SupportedCurrency } from '../../constants';

interface CurrencyFlagProps {
  currency: SupportedCurrency;
  size?: number;
}

const FLAG_ASPECT_RATIO = 4 / 3;

const renderFlag = (
  currency: SupportedCurrency,
  width: number,
  height: number,
): React.JSX.Element => {
  switch (currency) {
    case 'USD': {
      const stripeHeight = height / 7;
      const red = '#BF0A30';
      return (
        <Svg height={height} viewBox="0 0 24 18" width={width}>
          <Rect fill="#FFFFFF" height="18" width="24" x="0" y="0" />
          {[0, 2, 4, 6].map((index) => (
            <Rect
              key={index}
              fill={red}
              height={stripeHeight}
              width="24"
              x="0"
              y={index * stripeHeight}
            />
          ))}
          <Rect fill="#002868" height={height * 0.56} width={width * 0.5} x="0" y="0" />
        </Svg>
      );
    }
    case 'EUR':
      return (
        <Svg height={height} viewBox="0 0 24 18" width={width}>
          <Rect fill="#1E3A8A" height="18" width="24" x="0" y="0" />
          <Circle cx="12" cy="4.8" fill="#FACC15" r="0.85" />
          <Circle cx="15.5" cy="6.2" fill="#FACC15" r="0.85" />
          <Circle cx="17" cy="9" fill="#FACC15" r="0.85" />
          <Circle cx="15.5" cy="11.8" fill="#FACC15" r="0.85" />
          <Circle cx="12" cy="13.2" fill="#FACC15" r="0.85" />
          <Circle cx="8.5" cy="11.8" fill="#FACC15" r="0.85" />
          <Circle cx="7" cy="9" fill="#FACC15" r="0.85" />
          <Circle cx="8.5" cy="6.2" fill="#FACC15" r="0.85" />
        </Svg>
      );
    case 'GBP':
      return (
        <Svg height={height} viewBox="0 0 24 18" width={width}>
          <Rect fill="#1E3A8A" height="18" width="24" x="0" y="0" />
          <Polygon fill="#FFFFFF" points="0,0 3,0 24,13 24,18 21,18 0,5" />
          <Polygon fill="#FFFFFF" points="24,0 21,0 0,13 0,18 3,18 24,5" />
          <Rect fill="#FFFFFF" height="18" width="4.8" x="9.6" y="0" />
          <Rect fill="#FFFFFF" height="4.8" width="24" x="0" y="6.6" />
          <Polygon fill="#C8102E" points="0,0 1.5,0 24,14 24,18 22.5,18 0,4" />
          <Polygon fill="#C8102E" points="24,0 22.5,0 0,14 0,18 1.5,18 24,4" />
          <Rect fill="#C8102E" height="18" width="2.8" x="10.6" y="0" />
          <Rect fill="#C8102E" height="2.8" width="24" x="0" y="7.6" />
        </Svg>
      );
    case 'BAM':
      return (
        <Svg height={height} viewBox="0 0 24 18" width={width}>
          <Rect fill="#1E3A8A" height="18" width="24" x="0" y="0" />
          <Polygon fill="#FACC15" points="7,0 24,0 24,18" />
          {[1.6, 4.1, 6.6, 9.1, 11.6, 14.1, 16.6].map((y) => (
            <Circle key={y} cx="8.2" cy={y} fill="#FFFFFF" r="0.72" />
          ))}
        </Svg>
      );
    default:
      return (
        <Svg height={height} viewBox="0 0 24 18" width={width}>
          <Rect fill="#334155" height="18" width="24" x="0" y="0" />
        </Svg>
      );
  }
};

export const CurrencyFlag = ({ currency, size = 16 }: CurrencyFlagProps): React.JSX.Element => {
  const width = size;
  const height = size / FLAG_ASPECT_RATIO;

  return (
    <View
      style={[
        styles.frame,
        {
          borderRadius: borderRadius.sm,
          height,
          width,
        },
      ]}
    >
      {renderFlag(currency, width, height)}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});

export default CurrencyFlag;
