import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Canvas, Fill, Group, ImageFormat, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';
import { AppIcon } from '@/components/AppIcon';
import { colors } from '@/theme/colors';

export const DRAWING_MODAL_ORIENTATIONS = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
] as const;

const PAPER = '#FFFEFB';
const RULE = 'rgba(34, 64, 154, 0.1)';
const MARGIN = 'rgba(190, 18, 60, 0.28)';
const LINE_GAP = 30;

const PEN_COLORS = ['#1A327A', '#0F172A', '#0284C7', '#BE123C', '#15803D', '#EA580C'] as const;
const PEN_SIZES = [2.4, 4, 6.5, 10, 16] as const;

type Tool = 'pen' | 'eraser';
type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number; erase?: boolean };

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function smoothPath(points: Point[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

function scaleStroke(stroke: Stroke, sx: number, sy: number): Stroke {
  return {
    ...stroke,
    points: stroke.points.map((point) => ({ x: point.x * sx, y: point.y * sy })),
  };
}

function ruledPath(width: number, height: number) {
  const path = Skia.Path.Make();
  for (let y = LINE_GAP; y < height; y += LINE_GAP) {
    path.moveTo(0, y);
    path.lineTo(width, y);
  }
  return path;
}

function marginPath(height: number) {
  const path = Skia.Path.Make();
  path.moveTo(52, 0);
  path.lineTo(52, height);
  return path;
}

function waitFrames(count = 2) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

function StrokePath({ stroke }: { stroke: Stroke }) {
  return (
    <Path
      path={smoothPath(stroke.points)}
      color={stroke.erase ? '#000000' : stroke.color}
      blendMode={stroke.erase ? 'dstOut' : 'srcOver'}
      style="stroke"
      strokeWidth={stroke.width}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}

export function HandwrittenPageImage({
  uri,
  style,
}: {
  uri: string;
  style?: StyleProp<ImageStyle>;
}) {
  const [aspect, setAspect] = useState(3 / 4);
  return (
    <Image
      source={{ uri }}
      resizeMode="contain"
      onLoad={(event) => {
        const { width, height } = event.nativeEvent.source;
        if (width > 0 && height > 0) setAspect(width / height);
      }}
      style={[{ width: '100%', aspectRatio: aspect, backgroundColor: PAPER }, style]}
    />
  );
}

export function HandwritingCanvas({
  onComplete,
  onCancel,
}: {
  onComplete: (uris: string[]) => void;
  onCancel: () => void;
}) {
  const canvasRef = useCanvasRef();
  const pagesRef = useRef<Stroke[][]>([[]]);
  const snapshotsRef = useRef<(string | null)[]>([null]);
  const strokesRef = useRef<Stroke[]>([]);
  const currentPointsRef = useRef<Point[]>([]);
  const paperSizeRef = useRef({ width: 0, height: 0 });
  const pageIndexRef = useRef(0);
  const toolRef = useRef<Tool>('pen');
  const penColorRef = useRef(PEN_COLORS[0]);
  const penSizeRef = useRef<number>(PEN_SIZES[1]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const [paperSize, setPaperSize] = useState({ width: 0, height: 0 });
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
  const [penSize, setPenSize] = useState<number>(PEN_SIZES[1]);
  const [tool, setTool] = useState<Tool>('pen');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [fullScreen, setFullScreen] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = windowWidth > windowHeight;

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);
  useEffect(() => {
    penColorRef.current = penColor;
  }, [penColor]);
  useEffect(() => {
    penSizeRef.current = penSize;
  }, [penSize]);

  useEffect(() => {
    void ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  function strokeWidth() {
    return toolRef.current === 'eraser' ? penSizeRef.current * 2.8 : penSizeRef.current;
  }

  function liveStroke(points: Point[]): Stroke {
    return {
      points,
      color: penColorRef.current,
      width: strokeWidth(),
      erase: toolRef.current === 'eraser',
    };
  }

  function startStroke(x: number, y: number) {
    currentPointsRef.current = [{ x, y }];
    setCurrent(liveStroke([{ x, y }]));
  }

  function moveStroke(x: number, y: number) {
    const points = currentPointsRef.current;
    const last = points[points.length - 1];
    if (last && distance(last, { x, y }) < 1.4) return;
    currentPointsRef.current = [...points, { x, y }];
    setCurrent(liveStroke(currentPointsRef.current));
  }

  function endStroke() {
    const points = currentPointsRef.current;
    if (points.length === 0) return;
    const next = [...strokesRef.current, liveStroke(points)];
    strokesRef.current = next;
    pagesRef.current[pageIndexRef.current] = next;
    currentPointsRef.current = [];
    setStrokes(next);
    setCurrent(null);
  }

  function showPage(index: number) {
    pageIndexRef.current = index;
    setPageIndex(index);
    const next = pagesRef.current[index] ?? [];
    strokesRef.current = next;
    currentPointsRef.current = [];
    setStrokes(next);
    setCurrent(null);
  }

  async function persistCurrentSnapshot() {
    const points = currentPointsRef.current;
    const live = points.length ? [...strokesRef.current, liveStroke(points)] : strokesRef.current;
    pagesRef.current[pageIndexRef.current] = live;
    strokesRef.current = live;
    currentPointsRef.current = [];
    setStrokes(live);
    setCurrent(null);
    if (live.length === 0) {
      snapshotsRef.current[pageIndexRef.current] = null;
      currentPointsRef.current = [];
      strokesRef.current = [];
      setStrokes([]);
      setCurrent(null);
      return;
    }

    await waitFrames(1);
    let snapshot = canvasRef.current?.makeImageSnapshot();
    if (!snapshot) {
      await waitFrames(2);
      snapshot = canvasRef.current?.makeImageSnapshot();
    }

    strokesRef.current = live;
    currentPointsRef.current = [];
    setStrokes(live);
    setCurrent(null);

    if (!snapshot) return;
    const base64 = snapshot.encodeToBase64(ImageFormat.JPEG, 72);
    if (!base64) return;
    snapshotsRef.current[pageIndexRef.current] = `data:image/jpeg;base64,${base64}`;
  }

  function undo() {
    strokesRef.current = strokesRef.current.slice(0, -1);
    pagesRef.current[pageIndexRef.current] = strokesRef.current;
    currentPointsRef.current = [];
    setStrokes(strokesRef.current);
    setCurrent(null);
  }

  function clearPage() {
    strokesRef.current = [];
    pagesRef.current[pageIndexRef.current] = [];
    snapshotsRef.current[pageIndexRef.current] = null;
    currentPointsRef.current = [];
    setStrokes([]);
    setCurrent(null);
  }

  async function goToPage(next: number) {
    if (next < 0 || next >= pagesRef.current.length) return;
    await persistCurrentSnapshot();
    showPage(next);
  }

  async function addPage() {
    await persistCurrentSnapshot();
    pagesRef.current.push([]);
    snapshotsRef.current.push(null);
    setPageCount(pagesRef.current.length);
    showPage(pagesRef.current.length - 1);
  }

  async function setPageOrientation(kind: 'portrait' | 'landscape') {
    try {
      await ScreenOrientation.lockAsync(
        kind === 'landscape'
          ? ScreenOrientation.OrientationLock.LANDSCAPE
          : ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    } catch (error) {
      console.warn('[Handwriting] Could not rotate page', error);
    }
  }

  async function saveDrawing() {
    if (saving) return;
    setSaving(true);
    try {
      await persistCurrentSnapshot();
      const uris = snapshotsRef.current.filter((uri): uri is string => Boolean(uri));
      if (uris.length === 0) {
        Alert.alert('Empty page', 'Write something on the page first.');
        setSaving(false);
        return;
      }
      onComplete(uris);
    } catch (error) {
      console.error('[Handwriting] Save failed', error);
      Alert.alert('Could not save drawing', 'Please try again.');
      setSaving(false);
    }
  }

  const hasInk = strokes.length > 0 || Boolean(current);
  const canSave =
    hasInk || pagesRef.current.some((page, index) => index === pageIndex ? hasInk : page.length > 0);
  const rules = paperSize.width > 0 ? ruledPath(paperSize.width, paperSize.height) : null;
  const margin = paperSize.height > 0 ? marginPath(paperSize.height) : null;

  return (
    <View
      style={[
        styles.safe,
        fullScreen && styles.safeFullScreen,
        {
          paddingTop: fullScreen ? 0 : insets.top,
          paddingBottom: fullScreen ? 0 : insets.bottom,
          paddingLeft: fullScreen ? 0 : insets.left,
          paddingRight: fullScreen ? 0 : insets.right,
        },
      ]}
    >
      <StatusBar style="dark" hidden={fullScreen} />
      <View
        style={[
          styles.header,
          landscape && styles.headerLandscape,
          fullScreen && {
            paddingTop: Math.max(insets.top, 6),
            paddingLeft: Math.max(insets.left, 6),
            paddingRight: Math.max(insets.right, 6),
          },
        ]}
      >
        <Pressable
          style={styles.headerBtn}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Close drawing"
        >
          <AppIcon name="close" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.pageNav}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => void goToPage(pageIndex - 1)}
            disabled={pageIndex === 0}
            accessibilityLabel="Previous page"
          >
            <AppIcon name="chevron-back" size={20} color={pageIndex === 0 ? colors.textMuted : colors.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            Page {pageIndex + 1} / {pageCount}
          </Text>
          <Pressable
            style={styles.headerBtn}
            onPress={() => void goToPage(pageIndex + 1)}
            disabled={pageIndex === pageCount - 1}
            accessibilityLabel="Next page"
          >
            <AppIcon
              name="chevron-forward"
              size={20}
              color={pageIndex === pageCount - 1 ? colors.textMuted : colors.text}
            />
          </Pressable>
          <Pressable style={styles.addPageBtn} onPress={() => void addPage()} accessibilityLabel="Add page">
            <AppIcon name="add-outline" size={18} color={colors.primary} />
            <Text style={styles.addPageText}>Page</Text>
          </Pressable>
        </View>
        <View style={styles.orientRow}>
          <Pressable
            style={[styles.orientBtn, !landscape && styles.orientBtnOn]}
            onPress={() => void setPageOrientation('portrait')}
            accessibilityLabel="Portrait page"
          >
            <AppIcon name="phone-portrait-outline" size={16} color={!landscape ? '#fff' : colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.orientBtn, landscape && styles.orientBtnOn]}
            onPress={() => void setPageOrientation('landscape')}
            accessibilityLabel="Landscape page"
          >
            <AppIcon name="phone-landscape-outline" size={16} color={landscape ? '#fff' : colors.primary} />
          </Pressable>
        </View>
        <Pressable
          style={styles.headerBtn}
          onPress={() => setFullScreen((current) => !current)}
          accessibilityLabel={fullScreen ? 'Exit full screen' : 'Write in full screen'}
        >
          <AppIcon name={fullScreen ? 'contract-outline' : 'expand-outline'} size={20} color={colors.primary} />
        </Pressable>
        <Pressable
          style={[styles.doneBtn, (!canSave || saving) && styles.doneBtnDisabled]}
          onPress={() => void saveDrawing()}
          disabled={!canSave || saving}
          accessibilityRole="button"
          accessibilityLabel="Save handwritten pages"
        >
          <Text style={styles.doneText}>{saving ? 'Saving' : 'Done'}</Text>
        </Pressable>
      </View>

      <View
        style={[styles.paper, fullScreen && styles.paperFullScreen]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          const prev = paperSizeRef.current;
          if (prev.width > 0 && prev.height > 0 && (prev.width !== width || prev.height !== height)) {
            const sx = width / prev.width;
            const sy = height / prev.height;
            pagesRef.current = pagesRef.current.map((page) => page.map((stroke) => scaleStroke(stroke, sx, sy)));
            strokesRef.current = pagesRef.current[pageIndexRef.current] ?? [];
            setStrokes(strokesRef.current);
          }
          paperSizeRef.current = { width, height };
          setPaperSize({ width, height });
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          const { locationX, locationY } = event.nativeEvent;
          startStroke(locationX, locationY);
        }}
        onResponderMove={(event) => {
          const { locationX, locationY } = event.nativeEvent;
          moveStroke(locationX, locationY);
        }}
        onResponderRelease={endStroke}
        onResponderTerminate={endStroke}
      >
        <Canvas ref={canvasRef} style={StyleSheet.absoluteFill} collapsable={false}>
          <Fill color={PAPER} />
          {rules ? <Path path={rules} color={RULE} style="stroke" strokeWidth={1} /> : null}
          {margin ? <Path path={margin} color={MARGIN} style="stroke" strokeWidth={1.25} /> : null}
          <Group>
            {strokes.map((stroke, index) => (
              <StrokePath key={index} stroke={stroke} />
            ))}
            {current ? <StrokePath stroke={current} /> : null}
          </Group>
        </Canvas>
      </View>

      <View
        style={[
          styles.dock,
          landscape && styles.dockLandscape,
          fullScreen && styles.dockImmersive,
          fullScreen && {
            paddingBottom: Math.max(insets.bottom, 8),
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12),
          },
        ]}
      >
        <View style={styles.swatchRow}>
          {PEN_COLORS.map((color) => {
            const selected = tool === 'pen' && penColor === color;
            return (
              <Pressable
                key={color}
                onPress={() => {
                  setPenColor(color);
                  setTool('pen');
                }}
                style={[styles.swatch, selected && styles.swatchOn, { backgroundColor: color }]}
                accessibilityLabel={`Pen color ${color}`}
              />
            );
          })}
        </View>
        <View style={styles.sizeRow}>
          {PEN_SIZES.map((size) => {
            const selected = penSize === size;
            return (
              <Pressable
                key={size}
                onPress={() => setPenSize(size)}
                style={[styles.sizeHit, selected && styles.sizeHitOn]}
                accessibilityLabel={`${tool === 'eraser' ? 'Eraser' : 'Pen'} size ${size}`}
              >
                <View
                  style={{
                    width: size + 4,
                    height: size + 4,
                    borderRadius: (size + 4) / 2,
                    backgroundColor: tool === 'eraser' ? colors.textMuted : penColor,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.tool, tool === 'pen' && styles.toolOn]}
            onPress={() => setTool('pen')}
            accessibilityLabel="Pen"
          >
            <AppIcon name="pencil-outline" size={18} color={tool === 'pen' ? '#fff' : colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.tool, tool === 'eraser' && styles.toolOn]}
            onPress={() => setTool('eraser')}
            accessibilityLabel="Eraser"
          >
            <AppIcon name="backspace-outline" size={18} color={tool === 'eraser' ? '#fff' : colors.primary} />
          </Pressable>
          <Pressable style={styles.tool} onPress={undo} disabled={!hasInk} accessibilityLabel="Undo">
            <AppIcon name="arrow-undo-outline" size={18} color={hasInk ? colors.primary : colors.textMuted} />
          </Pressable>
          <Pressable style={styles.clearBtn} onPress={clearPage} accessibilityLabel="Clear page">
            <AppIcon name="trash-outline" size={16} color={colors.primary} />
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#E7E3D6',
  },
  safeFullScreen: {
    backgroundColor: PAPER,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 6,
    gap: 6,
  },
  headerLandscape: {
    paddingBottom: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNav: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 168,
  },
  title: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  addPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 64, 154, 0.08)',
  },
  addPageText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  orientRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 64, 154, 0.08)',
    borderRadius: 12,
    padding: 2,
    gap: 2,
  },
  orientBtn: {
    width: 34,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orientBtnOn: {
    backgroundColor: colors.primary,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  doneBtnDisabled: {
    opacity: 0.45,
  },
  doneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  paper: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: PAPER,
    shadowColor: '#1A327A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  paperFullScreen: {
    marginHorizontal: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  dock: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },
  dockLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dockImmersive: {
    backgroundColor: 'rgba(255, 254, 251, 0.94)',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchOn: {
    borderColor: '#fff',
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sizeHit: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeHitOn: {
    backgroundColor: 'rgba(34, 64, 154, 0.1)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  tool: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolOn: {
    backgroundColor: colors.primary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 64, 154, 0.08)',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
