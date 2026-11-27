/* eslint-disable react/no-unknown-property -- prop three.js (r3f JSX) */
// SPIKE: stadion 3D prosedural dengan @react-three/fiber/native + expo-gl.
// Tanpa drei, tanpa teks 3D, tanpa file model (PLAN-v2 §5.1 R3/R4).

import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber/native';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import * as THREE from 'three';

import { colors } from '@/theme/tokens';

import { easeInOutCubic, getOrbit, lerp3, orbitPose, rotateOrbit, seatPose, spinOrbit, type CameraPose } from './camera';
import { metrics, tickFrame } from './metrics';
import { categoryOf, FIELD, STAGE, type SpikeSection } from './stadium-data';

export type SceneMode = 'overview' | 'seat';

type Props = {
  sections: SpikeSection[];
  selectedId: number | null;
  mode: SceneMode;
  autoRotate: boolean;
  onSelect: (id: number) => void;
};

const FLY_MS = 900;
const TAP_SLOP = 0.03; // jarak NDC (≈ 1,5% lebar layar) yang masih dihitung tap

export function StadiumCanvas(props: Props) {
  return (
    <Canvas
      style={StyleSheet.absoluteFill}
      camera={{ fov: 50, near: 0.5, far: 1200, position: orbitPose(getOrbit()).position }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        const ctx = gl.getContext();
        metrics.renderer = String(ctx.getParameter(ctx.RENDERER) ?? '');
        metrics.webgl2 = String(ctx.getParameter(ctx.VERSION) ?? '').includes('WebGL 2');
      }}>
      <Scene {...props} />
    </Canvas>
  );
}

function Scene({ sections, selectedId, mode, autoRotate, onSelect }: Props) {
  const camera = useThree((s) => s.camera);
  const pose = useRef<CameraPose>(orbitPose(getOrbit()));
  const flight = useRef<{ from: CameraPose; to: () => CameraPose; start: number } | null>(null);
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const pendingTap = useRef<number | null>(null);
  const selected = sections.find((s) => s.id === selectedId) ?? null;

  // pindah mode = kamera terbang dari posisi sekarang ke tujuan
  useEffect(() => {
    const to =
      mode === 'seat' && selected ? () => seatPose(selected) : () => orbitPose(getOrbit());
    flight.current = { from: pose.current, to, start: Date.now() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected?.id]);

  useFrame((_, dt) => {
    const rotating = !!flight.current || !!drag.current || (autoRotate && mode === 'overview');
    tickFrame(rotating);
    if (autoRotate && mode === 'overview' && !drag.current) spinOrbit(dt);

    let next: CameraPose;
    if (flight.current) {
      const t = Math.min(1, (Date.now() - flight.current.start) / FLY_MS);
      const k = easeInOutCubic(t);
      const to = flight.current.to();
      next = {
        position: lerp3(flight.current.from.position, to.position, k),
        target: lerp3(flight.current.from.target, to.target, k),
      };
      if (t >= 1) flight.current = null;
    } else {
      next = mode === 'seat' && selected ? seatPose(selected) : orbitPose(getOrbit());
    }
    pose.current = next;
    camera.position.set(...next.position);
    camera.lookAt(...next.target);
  });

  // backdrop selalu kena raycast, jadi dipakai untuk drag orbit & menyelesaikan tap
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    drag.current = { x: e.pointer.x, y: e.pointer.y, moved: 0 };
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.pointer.x - d.x;
    const dy = e.pointer.y - d.y;
    d.x = e.pointer.x;
    d.y = e.pointer.y;
    d.moved += Math.abs(dx) + Math.abs(dy);
    if (mode !== 'overview' || flight.current) return;
    rotateOrbit(dx, dy);
  };
  const onUp = () => {
    const d = drag.current;
    if (d && d.moved < TAP_SLOP && pendingTap.current !== null) onSelect(pendingTap.current);
    drag.current = null;
    pendingTap.current = null;
  };

  return (
    <>
      <color attach="background" args={[colors.muted]} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[40, 80, 30]} intensity={1.6} />

      <mesh onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
        <sphereGeometry args={[600, 12, 8]} />
        <meshBasicMaterial color={colors.muted} side={THREE.BackSide} />
      </mesh>

      {/* lapangan & panggung */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} scale={[FIELD.a, FIELD.b, 1]}>
        <circleGeometry args={[1, 40]} />
        <meshLambertMaterial color={colors.border} />
      </mesh>
      <mesh position={[STAGE.x, STAGE.height / 2, STAGE.z]}>
        <boxGeometry args={[STAGE.width, STAGE.height, STAGE.depth]} />
        <meshLambertMaterial color={colors.stage} />
      </mesh>

      {sections.map((s) => (
        <SectionMesh
          key={s.id}
          section={s}
          selected={s.id === selectedId}
          dimmed={mode === 'seat' && s.id === selectedId}
          onDown={() => {
            if (pendingTap.current === null) pendingTap.current = s.id;
          }}
        />
      ))}
    </>
  );
}

function SectionMesh({
  section: s,
  selected,
  dimmed,
  onDown,
}: {
  section: SpikeSection;
  selected: boolean;
  dimmed: boolean;
  onDown: () => void;
}) {
  const cat = categoryOf(s);
  const color = useMemo(() => new THREE.Color(cat.color), [cat.color]);
  const emissive = useMemo(() => color.clone().multiplyScalar(selected ? 0.55 : 0), [color, selected]);
  return (
    <mesh
      position={[s.pos_x, s.elevation + (selected ? 0.6 : 0), s.pos_z]}
      rotation={new THREE.Euler(s.tilt, s.angle, 0, 'YXZ')}
      // section sendiri disembunyikan saat "Lihat dari sini" supaya kamera tidak di dalam kotak
      visible={!dimmed}
      // tap pertama yang kena = section terdekat (r3f mengurutkan irisan dari yang terdekat)
      onPointerDown={onDown}>
      <boxGeometry args={[s.width, s.height, s.depth]} />
      <meshLambertMaterial color={color} emissive={emissive} transparent={cat.status === 'sold_out'} opacity={cat.status === 'sold_out' ? 0.45 : 1} />
    </mesh>
  );
}
