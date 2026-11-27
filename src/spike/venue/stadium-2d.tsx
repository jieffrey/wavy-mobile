// SPIKE: denah 2D (fallback, PLAN-v2 §5.2) dari data yang sama dengan 3D, react-native-svg.

import { useMemo } from 'react';
import Svg, { Ellipse, Polygon, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import { categoryOf, FIELD, footprint, STAGE, type SpikeSection } from './stadium-data';

export function Stadium2D({
  sections,
  selectedId,
  onSelect,
}: {
  sections: SpikeSection[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const shapes = useMemo(
    () => sections.map((s) => ({ s, points: footprint(s).map(([x, z]) => `${x},${z}`).join(' ') })),
    [sections]
  );
  const pad = 6;
  const all = sections.flatMap(footprint);
  const minX = Math.min(...all.map((p) => p[0])) - pad;
  const maxX = Math.max(...all.map((p) => p[0])) + pad;
  const minZ = Math.min(...all.map((p) => p[1]), STAGE.z - STAGE.depth) - pad;
  const maxZ = Math.max(...all.map((p) => p[1])) + pad;

  return (
    <Svg width="100%" height="100%" viewBox={`${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`}>
      <Ellipse cx={0} cy={0} rx={FIELD.a} ry={FIELD.b} fill={colors.border} />
      <Rect
        x={STAGE.x - STAGE.width / 2}
        y={STAGE.z - STAGE.depth / 2}
        width={STAGE.width}
        height={STAGE.depth}
        fill={colors.stage}
        rx={1}
      />
      {shapes.map(({ s, points }) => {
        const cat = categoryOf(s);
        const sel = s.id === selectedId;
        return (
          <Polygon
            key={s.id}
            points={points}
            fill={cat.color}
            fillOpacity={cat.status === 'sold_out' ? 0.4 : 1}
            stroke={sel ? colors.foreground : colors.background}
            strokeWidth={sel ? 1.2 : 0.4}
            onPress={() => onSelect(s.id)}
          />
        );
      })}
    </Svg>
  );
}
