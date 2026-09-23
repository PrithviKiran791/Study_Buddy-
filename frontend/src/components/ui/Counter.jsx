import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import './Counter.css';

function Number({ mv, number, height }) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) {
      memo -= 10 * height;
    }
    return memo;
  });

  return (
    <motion.span className="counter-number" style={{ y }}>
      {number}
    </motion.span>
  );
}

function normalizeNearInteger(num) {
  const nearest = Math.round(num);
  const tolerance = 1e-9 * Math.max(1, Math.abs(num));
  return Math.abs(num - nearest) < tolerance ? nearest : num;
}

function getValueRoundedToPlace(value, place) {
  const scaled = value / place;
  return Math.floor(normalizeNearInteger(scaled));
}

function Digit({ place, value, height, digitStyle }) {
  const isSeparator = typeof place === 'string' && isNaN(Number(place));
  const isDecimal = place === '.';
  const valueRoundedToPlace = isSeparator ? 0 : getValueRoundedToPlace(value, place);
  const animatedValue = useSpring(valueRoundedToPlace, {
    stiffness: 280,
    damping: 28,
  });

  useEffect(() => {
    if (!isSeparator) {
      animatedValue.set(valueRoundedToPlace);
    }
  }, [animatedValue, valueRoundedToPlace, isSeparator]);

  if (isSeparator) {
    return (
      <span
        className="counter-digit counter-separator"
        style={{ height, ...digitStyle, width: 'fit-content' }}
      >
        {place}
      </span>
    );
  }

  return (
    <span className="counter-digit" style={{ height, ...digitStyle }}>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </span>
  );
}

export default function Counter({
  value = 0,
  fontSize = 100,
  padding = 0,
  places = [...value.toString()].map((ch, i, a) => {
    if (ch === '.') {
      return '.';
    } else {
      return (
        10 **
        (a.indexOf('.') === -1
          ? a.length - i - 1
          : i < a.indexOf('.')
          ? a.indexOf('.') - i - 1
          : -(i - a.indexOf('.')))
      );
    }
  }),
  gap = 8,
  borderRadius = 4,
  horizontalPadding = 8,
  textColor = 'inherit',
  fontWeight = 'inherit',
  containerStyle,
  counterStyle,
  digitStyle,
  gradientHeight = 16,
  gradientFrom = 'transparent',
  gradientTo = 'transparent',
  topGradientStyle,
  bottomGradientStyle,
}) {
  const height = fontSize + padding;
  const defaultCounterStyle = {
    fontSize,
    gap: gap,
    borderRadius: borderRadius,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    color: textColor,
    fontWeight: fontWeight,
    direction: 'ltr',
  };

  const defaultTopGradientStyle = {
    height: gradientHeight,
    background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
  };

  const defaultBottomGradientStyle = {
    height: gradientHeight,
    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
  };

  const showGradients =
    (gradientFrom && gradientFrom !== 'transparent') ||
    Boolean(topGradientStyle) ||
    Boolean(bottomGradientStyle);

  return (
    <span className="counter-container" style={containerStyle}>
      <span className="counter-counter" style={{ ...defaultCounterStyle, ...counterStyle }}>
        {places.map((place, idx) => (
          <Digit
            key={`${place}-${idx}`}
            place={place}
            value={value}
            height={height}
            digitStyle={digitStyle}
          />
        ))}
      </span>
      {showGradients && (
        <span className="gradient-container">
          <span
            className="top-gradient"
            style={topGradientStyle ? topGradientStyle : defaultTopGradientStyle}
          />
          <span
            className="bottom-gradient"
            style={bottomGradientStyle ? bottomGradientStyle : defaultBottomGradientStyle}
          />
        </span>
      )}
    </span>
  );
}

export { Counter };

/**
 * MinimalTimer - A sleek, minimal countdown display built with Counter
 */
export function MinimalTimer({
  timeLeft = 0,
  fontSize = 48,
  fontWeight = 300,
  className = '',
  isRunning = false,
  showLabels = false,
}) {
  const safeTime = Math.max(0, timeLeft || 0);
  const minutes = Math.floor(safeTime / 60);
  const seconds = safeTime % 60;

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="flex items-center justify-center font-mono select-none tracking-tight">
        {/* Minutes */}
        <Counter
          value={minutes}
          places={minutes >= 100 ? [100, 10, 1] : [10, 1]}
          fontSize={fontSize}
          padding={4}
          gap={2}
          horizontalPadding={0}
          fontWeight={fontWeight}
          textColor="currentColor"
        />

        {/* Minimal colon separator */}
        <span
          className={cn(
            'inline-flex items-center justify-center px-1 font-mono transition-opacity duration-300',
            isRunning ? 'animate-pulse opacity-80' : 'opacity-40'
          )}
          style={{ fontSize: fontSize * 0.82, lineHeight: 1 }}
        >
          :
        </span>

        {/* Seconds */}
        <Counter
          value={seconds}
          places={[10, 1]}
          fontSize={fontSize}
          padding={4}
          gap={2}
          horizontalPadding={0}
          fontWeight={fontWeight}
          textColor="currentColor"
        />
      </div>

      {showLabels && (
        <div className="mt-1 flex w-full max-w-[120px] justify-between px-2 text-[9px] font-semibold tracking-widest text-muted-foreground uppercase opacity-70">
          <span>MIN</span>
          <span>SEC</span>
        </div>
      )}
    </div>
  );
}
