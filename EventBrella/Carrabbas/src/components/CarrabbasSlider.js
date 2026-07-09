import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { SLIDER_IMAGES } from '../constants/sliderPhotos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Doubled height to eliminate white space below carousel
const SLIDER_HEIGHT = Platform.OS === 'web' ? 560 : 400;
const AUTO_ADVANCE_MS = 5000;

export { SLIDER_HEIGHT };

export default function CarrabbasSlider() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDER_IMAGES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current && SLIDER_IMAGES.length) {
      scrollRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [index]);

  const goPrev = () => {
    setIndex((i) => (i - 1 + SLIDER_IMAGES.length) % SLIDER_IMAGES.length);
  };
  const goNext = () => {
    setIndex((i) => (i + 1) % SLIDER_IMAGES.length);
  };

  if (!SLIDER_IMAGES.length) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setIndex(i);
        }}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {SLIDER_IMAGES.map((uri, i) => (
          <Image
            key={uri}
            source={{ uri }}
            style={[styles.slide, { width: SCREEN_WIDTH, height: SLIDER_HEIGHT }]}
            resizeMode="stretch"
          />
        ))}
      </ScrollView>

      {/* Arrows */}
      <TouchableOpacity
        style={[styles.arrow, styles.arrowLeft]}
        onPress={goPrev}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={28} color={Colors.white} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.arrow, styles.arrowRight]}
        onPress={goNext}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-forward" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDER_IMAGES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.sliderArrowBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: Colors.sliderDotActive,
  },
  dotInactive: {
    backgroundColor: Colors.sliderDotInactive,
  },
});
