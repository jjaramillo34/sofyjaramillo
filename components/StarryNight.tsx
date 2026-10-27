import type { CSSProperties } from "react";
import { SkyMotion } from "@/components/SkyMotion";

/*
 * A living Starry Night: Van Gogh's swirling sky over the Andes, with the
 * floating lanterns from Sofy's own interpretation. Everything is generated
 * here at render time (deterministically, so server and client agree) and
 * animated with CSS in globals.css under "Starry Night hero".
 *
 * The scene is a fixed painting, not themed UI, so it uses its own palette.
 * It is drawn on a 1600×900 canvas, anchored to the bottom so the landscape
 * always shows.
 */

const W = 1600;
const SKY_BOTTOM = 720;

/** Small seeded PRNG (mulberry32): same strokes on every render. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Centers the brushstrokes curl around: the two wind eddies and the moon. */
const VORTICES = [
  { x: 640, y: 330, strength: 1.7, radius: 150 },
  { x: 1060, y: 390, strength: -1.3, radius: 120 },
  { x: 1370, y: 170, strength: 1.1, radius: 160 },
];

/** Direction of the "wind" at a point: a wavy drift to the right plus the eddies. */
function flowAngle(x: number, y: number) {
  let vx = 1;
  let vy = 0.45 * Math.sin(x / 210 + y / 170);
  for (const v of VORTICES) {
    const dx = x - v.x;
    const dy = y - v.y;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2) || 1;
    const pull = 2.2 * v.strength * Math.exp(-d2 / (2 * v.radius * v.radius));
    vx += (-dy / d) * pull;
    vy += (dx / d) * pull;
  }
  return Math.atan2(vy, vx);
}

/** Closeness (0–1) to the nearest eddy, used to lighten strokes toward the swirls. */
function swirlLight(x: number, y: number) {
  return Math.max(
    ...VORTICES.map((v) => Math.exp(-((x - v.x) ** 2 + (y - v.y) ** 2) / (2 * (v.radius * 1.3) ** 2))),
  );
}

/** Where the hero copy sits (canvas units); strokes there stay in the darker blues. */
const TEXT_ZONE = { x1: 360, x2: 1240, y1: 180, y2: 680 };
const inTextZone = (x: number, y: number) =>
  x > TEXT_ZONE.x1 && x < TEXT_ZONE.x2 && y > TEXT_ZONE.y1 && y < TEXT_ZONE.y2;

const SKY_BLUES = ["#0f2466", "#16307e", "#1d3d96", "#2449a8", "#2f5cc0", "#4470d0", "#6890e0", "#9cb8f0", "#d2e0fb"];
const STROKE_WIDTHS = [4, 5.5, 7];

/**
 * ~900 short curved strokes, merged into one path per colour and width so the
 * markup stays small.
 */
function skyStrokes() {
  const r = random(7);
  const groups = new Map<string, string[]>();
  const cell = 40;

  for (let y = 0; y < SKY_BOTTOM; y += cell * 0.8) {
    for (let x = -cell; x < W + cell; x += cell) {
      const px = x + (r() - 0.5) * cell;
      const py = y + (r() - 0.5) * cell * 0.8;
      const angle = flowAngle(px, py);
      const length = 20 + r() * 24;
      const bend = (r() - 0.5) * 12;
      const x2 = px + Math.cos(angle) * length;
      const y2 = py + Math.sin(angle) * length;
      const cx = (px + x2) / 2 + Math.cos(angle + Math.PI / 2) * bend;
      const cy = (py + y2) / 2 + Math.sin(angle + Math.PI / 2) * bend;

      const light = swirlLight(px, py);
      const maxShade = inTextZone(px, py) ? 4 : SKY_BLUES.length - 1;
      const shade = Math.min(maxShade, Math.floor((r() * 0.55 + light * 0.6) * SKY_BLUES.length));
      const width = STROKE_WIDTHS[Math.floor(r() * STROKE_WIDTHS.length)];
      const key = `${SKY_BLUES[shade]}|${width}`;
      const d = `M${px.toFixed(0)} ${py.toFixed(0)}Q${cx.toFixed(0)} ${cy.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}`;
      groups.set(key, [...(groups.get(key) ?? []), d]);
    }
  }

  return [...groups].map(([key, paths]) => {
    const [color, width] = key.split("|");
    return { color, width: Number(width), d: paths.join("") };
  });
}

/** Eleven stars, like the original. `wide` ones are hidden on phones. */
const STARS = [
  { x: 120, y: 150, r: 13, wide: true },
  { x: 330, y: 80, r: 11, wide: true },
  { x: 480, y: 200, r: 15, wide: false },
  { x: 250, y: 330, r: 10, wide: true },
  { x: 720, y: 120, r: 12, wide: false },
  { x: 905, y: 210, r: 16, wide: false },
  { x: 1090, y: 95, r: 11, wide: false },
  { x: 1220, y: 300, r: 13, wide: true },
  { x: 1500, y: 330, r: 12, wide: true },
  { x: 60, y: 520, r: 9, wide: true },
  { x: 1540, y: 520, r: 10, wide: true },
];

function lanterns() {
  const r = random(42);
  return Array.from({ length: 14 }, (_, i) => ({
    x: 300 + (i / 13) * 1050 + (r() - 0.5) * 80,
    y: 760 + r() * 40,
    scale: 0.7 + r() * 0.55,
    duration: 22 + r() * 18,
    delay: -r() * 38,
    sway: 10 + r() * 16,
    wide: i % 2 === 1,
  }));
}

function village() {
  const r = random(3);
  return Array.from({ length: 15 }, (_, i) => {
    const x = 640 + i * 36 + (r() - 0.5) * 8;
    const w = 24 + r() * 10;
    const h = 16 + r() * 16;
    const base = 798 - Math.sin((x - 560) / 180) * 14;
    return { x, w, h, base, lit: r() > 0.25, flicker: r() * 6 };
  });
}

/** Flame-shaped cypress outline: wavy edges that narrow to a curling tip. */
const CYPRESS =
  "M250 905 C 204 860, 188 800, 206 742 C 182 702, 194 650, 214 612 C 196 572, 208 524, 230 492 " +
  "C 220 452, 238 412, 258 366 C 270 414, 292 448, 286 492 C 306 530, 314 574, 298 612 " +
  "C 320 652, 328 702, 308 742 C 328 802, 318 862, 282 905 Z";

/** Short upward strokes inside the cypress, flickering like flames. Grouped by colour. */
function cypressStrokes() {
  const r = random(11);
  const greens = ["#16301f", "#1f3d2b", "#2c5a3c", "#3d7550"];
  const groups = greens.map(() => [] as string[]);
  for (let i = 0; i < 70; i++) {
    const y = 890 - r() * 500;
    // Half-width of the tree at this height: ~52 at the base, 0 at the tip (y≈366).
    const half = Math.max(4, ((y - 366) / 524) * 52);
    const x = 256 + (r() - 0.5) * 2 * half * 0.8;
    const lean = (r() - 0.5) * 22;
    const length = 26 + r() * 24;
    groups[Math.floor(r() * greens.length)].push(
      `M${x.toFixed(0)} ${y.toFixed(0)}Q${(x + lean).toFixed(0)} ${(y - length / 2).toFixed(0)} ${(x + lean / 3).toFixed(0)} ${(y - length).toFixed(0)}`,
    );
  }
  return greens.map((color, i) => ({ color, d: groups[i].join("") }));
}

const STROKES = skyStrokes();
const CYPRESS_STROKES = cypressStrokes();
const LANTERNS = lanterns();
const HOUSES = village();

/** The big rolling wind across the middle of the sky, with its two curls. */
const WIND =
  "M40 430 C 220 300, 400 290, 520 350 C 600 392, 700 420, 724 360 C 744 300, 664 262, 606 300 C 566 328, 584 380, 634 380 " +
  "C 760 384, 860 300, 1000 330 C 1110 352, 1150 440, 1090 455 C 1036 468, 1020 404, 1072 394 C 1220 366, 1380 290, 1580 330";

export function StarryNight() {
  return (
    <SkyMotion>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
        <defs>
          <linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#081338" />
            <stop offset="0.55" stopColor="#12286a" />
            <stop offset="0.8" stopColor="#1d3b8c" />
          </linearGradient>
          <radialGradient id="sn-star-glow">
            <stop offset="0" stopColor="#fff2a8" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#f5c84c" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f5c84c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sn-moon-glow">
            <stop offset="0" stopColor="#ffe08a" stopOpacity="0.9" />
            <stop offset="0.45" stopColor="#f0a830" stopOpacity="0.35" />
            <stop offset="1" stopColor="#f0a830" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sn-lantern-glow">
            <stop offset="0" stopColor="#ffcf6b" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sn-clear-fade">
            <stop offset="0" stopColor="black" stopOpacity="0.9" />
            <stop offset="0.65" stopColor="black" stopOpacity="0.6" />
            <stop offset="1" stopColor="black" stopOpacity="0" />
          </radialGradient>
          {/* Fades the wind behind the hero text while keeping it bright at the edges. */}
          <mask id="sn-text-clear" maskUnits="userSpaceOnUse" x="-40" y="-40" width="1680" height="980">
            <rect x="-40" y="-40" width="1680" height="980" fill="white" />
            <ellipse cx="800" cy="440" rx="520" ry="300" fill="url(#sn-clear-fade)" />
          </mask>
          <mask id="sn-crescent">
            <circle cx="1370" cy="170" r="54" fill="white" />
            <circle cx="1394" cy="154" r="48" fill="black" />
          </mask>
        </defs>

        {/* Sky and brushwork: the deepest layer, moves least */}
        <g className="sn-depth-1">
          <rect x="-40" y="-40" width="1680" height="980" fill="url(#sn-sky)" />
          {STROKES.map((s) => (
            <path
              key={`${s.color}-${s.width}`}
              d={s.d}
              stroke={s.color}
              strokeWidth={s.width}
              strokeLinecap="round"
              fill="none"
              opacity={0.9}
            />
          ))}

          {/* The wind */}
          <g mask="url(#sn-text-clear)">
            <path d={WIND} stroke="#86a8ea" strokeWidth="22" strokeLinecap="round" fill="none" opacity="0.35" />
            <path d={WIND} stroke="#0c1f5c" strokeWidth="5" strokeLinecap="round" fill="none" transform="translate(0 16)" opacity="0.7" />
            <path className="sn-wind-a" d={WIND} stroke="#dbe7ff" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path className="sn-wind-b" d={WIND} stroke="#f5c84c" strokeWidth="3" strokeLinecap="round" fill="none" transform="translate(0 -9)" />
          </g>
        </g>

        {/* Stars and moon */}
        <g className="sn-depth-2">
          {STARS.map((star, i) => (
            <g key={i} className={star.wide ? "sn-wide" : undefined}>
              <circle
                className="sn-halo"
                cx={star.x}
                cy={star.y}
                r={star.r * 3.2}
                fill="url(#sn-star-glow)"
                style={{ animationDelay: `${-i * 0.7}s` } as CSSProperties}
              />
              <circle
                className="sn-ring"
                cx={star.x}
                cy={star.y}
                r={star.r * 1.7}
                stroke="#f5d36a"
                strokeWidth="3"
                strokeDasharray="7 9"
                strokeLinecap="round"
                fill="none"
              />
              <circle
                className="sn-ring sn-ring-reverse"
                cx={star.x}
                cy={star.y}
                r={star.r * 2.3}
                stroke="#a9c4f5"
                strokeWidth="2.5"
                strokeDasharray="10 12"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
              <circle cx={star.x} cy={star.y} r={star.r} fill="#ffd84a" />
              <circle
                className="sn-twinkle"
                cx={star.x}
                cy={star.y}
                r={star.r * 0.55}
                fill="#fffbe6"
                style={{ animationDelay: `${-i * 0.45}s` } as CSSProperties}
              />
            </g>
          ))}

          <circle className="sn-halo sn-halo-slow" cx="1370" cy="170" r="170" fill="url(#sn-moon-glow)" />
          <circle className="sn-ring" cx="1370" cy="170" r="86" stroke="#f5c84c" strokeWidth="4" strokeDasharray="12 10" fill="none" />
          <circle className="sn-ring sn-ring-reverse" cx="1370" cy="170" r="112" stroke="#f0a830" strokeWidth="3" strokeDasharray="16 14" fill="none" opacity="0.7" />
          <circle cx="1370" cy="170" r="54" fill="#f7c843" mask="url(#sn-crescent)" />
        </g>

        {/* Lanterns rising from the village (from Sofy's own Starry Night) */}
        <g className="sn-depth-2">
          {LANTERNS.map((l, i) => (
            <g
              key={i}
              className={l.wide ? "sn-wide" : undefined}
              transform={`translate(${l.x.toFixed(0)} ${l.y.toFixed(0)}) scale(${l.scale.toFixed(2)})`}
            >
              <g
                className="sn-lantern"
                style={
                  {
                    "--dur": `${l.duration.toFixed(1)}s`,
                    "--delay": `${l.delay.toFixed(1)}s`,
                    "--sway": `${l.sway.toFixed(0)}px`,
                  } as CSSProperties
                }
              >
                <g className="sn-lantern-sway">
                  <circle r="26" fill="url(#sn-lantern-glow)" />
                  <rect x="-7" y="-10" width="14" height="20" rx="4" fill="#ffb547" />
                  <rect x="-4" y="-6" width="8" height="12" rx="2" fill="#ffe7a3" />
                  <rect x="-6" y="-12" width="12" height="3" rx="1" fill="#7a3b12" />
                </g>
              </g>
            </g>
          ))}
        </g>

        {/* The Andes, the village and the cypress: the nearest layer, moves most */}
        <g className="sn-depth-3">
          <path
            d="M0 700 L120 650 L230 672 L360 618 L470 656 L560 634 L700 676 L820 646 L920 664 L1000 640 L1060 618 L1160 540 L1200 540 L1300 618 L1360 640 L1450 610 L1600 654 L1600 900 L0 900 Z"
            fill="#0f2252"
            stroke="#4467b5"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Cotopaxi's snow cap, catching the moonlight */}
          <path
            d="M1128 565 L1160 540 L1200 540 L1232 565 L1218 574 L1204 562 L1192 578 L1178 562 L1166 576 L1150 564 L1140 574 Z"
            fill="#e4ecff"
          />
          <path
            d="M0 790 C 200 742, 380 762, 560 782 C 760 802, 900 742, 1100 762 C 1300 782, 1450 752, 1600 772 L1600 900 L0 900 Z"
            fill="#0e1c40"
          />

          {/* Village */}
          {HOUSES.map((h, i) => (
            <g key={i}>
              <rect x={h.x} y={h.base - h.h} width={h.w} height={h.h + 30} fill="#1a2140" />
              <path d={`M${h.x - 3} ${h.base - h.h} L${h.x + h.w / 2} ${h.base - h.h - 12} L${h.x + h.w + 3} ${h.base - h.h} Z`} fill="#121733" />
              {h.lit && (
                <rect
                  className="sn-window"
                  x={h.x + h.w / 2 - 4}
                  y={h.base - h.h + 6}
                  width="8"
                  height="8"
                  rx="1"
                  fill="#ffcf5a"
                  style={{ animationDelay: `${-h.flicker}s` } as CSSProperties}
                />
              )}
            </g>
          ))}
          {/* Church with its steeple, as in the painting */}
          <rect x="928" y="736" width="30" height="80" fill="#1a2140" />
          <path d="M924 738 L943 650 L962 738 Z" fill="#121733" />
          <rect className="sn-window" x="938" y="752" width="10" height="14" rx="5" fill="#ffcf5a" />

          <path d="M0 862 C 300 832, 700 872, 1000 852 C 1250 836, 1450 872, 1600 852 L1600 900 L0 900 Z" fill="#070f26" />

          {/* Cypress: a dark flame of brushstrokes in the foreground */}
          <g className="sn-cypress">
            <path d={CYPRESS} fill="#07120d" />
            {CYPRESS_STROKES.map((stroke) => (
              <path
                key={stroke.color}
                d={stroke.d}
                stroke={stroke.color}
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                opacity="0.9"
              />
            ))}
          </g>
        </g>
      </svg>
    </SkyMotion>
  );
}
