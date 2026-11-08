import "./styles/landing.css";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  CatmullRomCurve3,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFShadowMap,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { buildBessScenario, evaluateScenario } from "./model.js";
function Te(r, p = "hybrid", x = !1) {
  const b = r.querySelector("#canvas-wrap"),
    B = matchMedia("(prefers-reduced-motion: reduce)");
  let h = B.matches || x,
    i,
    k,
    I = !1,
    W = !0;
  const X = [],
    S = (d, m, f) => {
      d && (d.addEventListener(m, f), X.push(() => d.removeEventListener(m, f)));
    },
    $ = r.dataset.compact === "true";
  try {
    i = new WebGLRenderer({
      alpha: !0,
      antialias: !0,
    });
  } catch {
    r.classList.add("no-webgl");
  }
  if (i) {
    let a = function (e, n, o, w, G = 0.08) {
        const c = new Mesh(new RoundedBoxGeometry(...n, 4, G), w);
        return (c.position.set(...o), (c.castShadow = !0), (c.receiveShadow = !0), e.add(c), c);
      },
      g = function (e, n, o, w, G = [1, 1, 1]) {
        const c = new Mesh(new SphereGeometry(n, 24, 16), w);
        return (c.position.set(...o), c.scale.set(...G), (c.castShadow = !0), e.add(c), c);
      },
      F = function (e, n, o, w, G) {
        const c = new Vector3(...n),
          ee = new Vector3(...o),
          z = new Mesh(new CylinderGeometry(w, w, c.distanceTo(ee), 16), G);
        return (
          z.position.copy(c.clone().add(ee).multiplyScalar(0.5)),
          z.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), ee.sub(c).normalize()),
          (z.castShadow = !0),
          e.add(z),
          z
        );
      },
      re = function (e) {
        const n = new CatmullRomCurve3(
            e.map((w) => new Vector3(...w)),
            !1,
            "catmullrom",
            0.35,
          ),
          o = new Mesh(new TubeGeometry(n, 70, 0.035, 10, !1), t.yellow);
        return ((o.castShadow = !0), s.add(o), n);
      },
      ie = function () {
        const { width: e, height: n } = b.getBoundingClientRect();
        if (((j = e < 760), !e || !n)) return;
        i.setSize(e, n);
        const o = $ ? Math.max(9.2, (6.6 * e) / n) : j ? 10.7 : 11.9;
        ((m.left = -o / 2),
          (m.right = o / 2),
          (m.top = (o * n) / e / 2),
          (m.bottom = -m.top),
          m.setViewOffset(e, n, $ || j ? 0 : -48, $ ? 0 : j ? -110 : -50, e, n),
          m.updateProjectionMatrix());
      },
      Y = function () {
        D &&
          (D.setAttribute("aria-pressed", String(h)),
          D.setAttribute("aria-label", h ? "เปิดภาพเคลื่อนไหว" : "หยุดภาพเคลื่อนไหว"),
          (r.querySelector("#motion-icon").textContent = h ? "▷" : "Ⅱ"));
      },
      le = function (e) {
        ((l.visible = e !== "solar"),
          (M.visible = e !== "battery"),
          (E.visible = e === "solar"),
          (y.visible = e !== "solar"),
          (R = e === "solar" ? -0.34 : -0.16));
      },
      Z = function (e) {
        if (I) return;
        if (!W || document.hidden) {
          ((Q = e), (k = requestAnimationFrame(Z)));
          return;
        }
        const n = Math.max(0, Math.min((e - Q) / 1e3, 0.05));
        ((Q = e),
          h || (P += n),
          (K += (R - K) * (B.matches ? 1 : 1 - Math.exp(-8 * n))),
          (s.rotation.y = K),
          (s.position.y = h ? 0 : Math.sin(P * 0.8) * 0.035),
          (L.position.y = 3.02 + (h ? 0 : Math.sin(P * 0.7) * 0.065)),
          (pe.position.y = 2.45 + (h ? 0 : Math.sin(P * 0.8 + 1) * 0.045)),
          ue.forEach((o, w) => {
            (o.position.copy(se[w].getPoint((P * 0.13 + w * 0.5) % 1)), (o.position.y += 0.04));
          }),
          i.render(d, m),
          (k = requestAnimationFrame(Z)));
      };
    (i.setPixelRatio(Math.min(devicePixelRatio, x ? 1 : 1.7)),
      (i.shadowMap.enabled = !0),
      (i.shadowMap.type = PCFShadowMap),
      (i.outputColorSpace = SRGBColorSpace),
      (i.toneMapping = ACESFilmicToneMapping),
      (i.toneMappingExposure = 1.08),
      b.appendChild(i.domElement));
    const d = new Scene(),
      m = new OrthographicCamera(-6, 6, 4, -4, 0.1, 100);
    (m.position.set(9, 8.5, 12), m.lookAt(0, 0.7, 0), d.add(new AmbientLight(14083327, 1.4)));
    const f = new DirectionalLight(16774114, 3.2);
    (f.position.set(-3, 9, 7),
      (f.castShadow = !0),
      f.shadow.mapSize.set(1024, 1024),
      Object.assign(f.shadow.camera, {
        left: -7,
        right: 7,
        top: 7,
        bottom: -7,
        near: 0.1,
        far: 30,
      }),
      (f.shadow.bias = -5e-4),
      (f.shadow.normalBias = 0.025),
      (f.shadow.radius = 4),
      d.add(f));
    const oe = new DirectionalLight(11130623, 2.7);
    (oe.position.set(5, 5, -6), d.add(oe));
    const ae = new DirectionalLight(13828077, 0.7);
    (ae.position.set(-5, 2, -3), d.add(ae));
    const s = new Group();
    d.add(s);
    const u = (e, n = {}) =>
        new MeshStandardMaterial({
          color: e,
          roughness: 0.7,
          metalness: 0.02,
          ...n,
        }),
      t = {
        base: u("#3a526b"),
        top: u("#62778a"),
        blue: u("#8db6e8"),
        blueLight: u("#b5d7f3"),
        cream: u("#eef0e7"),
        mint: u("#afddc8"),
        panel: u("#627fbd"),
        grid: u("#b5c9e5"),
        yellow: u("#f5ce7e"),
        vent: u("#6084ac"),
        dark: u("#436385"),
        leaf: u("#a6ceb8"),
      };
    (a(s, [7, 0.36, 4.7], [0, -0.15, 0], t.base, 0.24),
      a(s, [6.88, 0.13, 4.58], [0, 0.075, 0], t.top, 0.22),
      a(s, [1.25, 0.025, 0.1], [0, -0.17, 2.355], t.mint, 0.035));
    const l = new Group();
    (s.add(l),
      l.position.set(0.25, 0.14, 0.05),
      a(l, [2.05, 0.16, 1.56], [0, 0.08, 0], t.dark, 0.08),
      a(l, [1.95, 1.7, 1.4], [0, 1, 0], t.blue, 0.14),
      a(l, [2.04, 0.22, 1.49], [0, 1.88, 0], t.blueLight, 0.1));
    for (let e = 0; e < 3; e++) {
      const n = (e - 1) * 0.6;
      a(l, [0.55, 1.35, 0.045], [n, 0.98, 0.704], t.blueLight, 0.055);
      for (let o = 0; o < 5; o++)
        a(l, [0.3, 0.025, 0.02], [n, 0.58 + o * 0.07, 0.735], t.vent, 0.011);
      (a(l, [0.028, 0.17, 0.025], [n + 0.16, 1.22, 0.74], t.cream, 0.012),
        a(l, [0.12, 0.035, 0.024], [n, 1.49, 0.737], t.mint, 0.015));
    }
    a(l, [0.04, 0.63, 0.55], [1, 1.09, -0.03], t.cream, 0.11);
    const v = new Shape();
    (v.moveTo(0.055, 0.22),
      v.lineTo(-0.13, -0.025),
      v.lineTo(-0.025, -0.025),
      v.lineTo(-0.065, -0.23),
      v.lineTo(0.14, 0.04),
      v.lineTo(0.035, 0.04),
      v.closePath());
    const N = new Mesh(
      new ExtrudeGeometry(v, {
        depth: 0.025,
        bevelEnabled: !0,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.008,
      }),
      t.yellow,
    );
    ((N.rotation.y = Math.PI / 2),
      N.position.set(1.03, 1.1, -0.03),
      l.add(N),
      a(l, [0.76, 0.1, 0.45], [0, 2.03, 0], t.cream, 0.07));
    for (let e = 0; e < 3; e++)
      a(l, [0.15, 0.025, 0.26], [-0.21 + e * 0.21, 2.091, 0], t.mint, 0.035);
    const M = new Group();
    (s.add(M), M.position.set(-2, 0.14, 0.45));
    for (const e of [-0.66, 0.66])
      (a(M, [0.17, 0.16, 1.34], [e, 0.08, 0], t.cream, 0.06),
        F(M, [e, 0.1, -0.42], [e, 0.85, -0.42], 0.045, t.cream),
        F(M, [e, 0.1, 0.42], [e, 0.46, 0.42], 0.045, t.cream));
    const C = new Group();
    (M.add(C),
      (C.position.y = 0.68),
      (C.rotation.x = 0.38),
      a(C, [1.89, 0.13, 1.55], [0, 0, 0], t.cream, 0.075),
      a(C, [1.76, 0.04, 1.42], [0, 0.08, 0], t.panel, 0.035));
    for (let e = 1; e < 6; e++)
      a(C, [0.014, 0.008, 1.38], [-0.88 + (e * 1.76) / 6, 0.105, 0], t.grid, 0.003);
    for (let e = 1; e < 4; e++)
      a(C, [1.72, 0.008, 0.014], [0, 0.106, -0.71 + (e * 1.42) / 4], t.grid, 0.003);
    const y = new Group();
    (s.add(y),
      y.position.set(2.25, 0.14, -0.9),
      a(y, [0.65, 0.2, 0.65], [0, 0.1, 0], t.cream, 0.12),
      F(y, [0, 0.15, 0], [0, 2.65, 0], 0.095, t.cream),
      a(y, [1.4, 0.15, 0.18], [0, 2.4, 0], t.cream, 0.065),
      a(y, [1.02, 0.13, 0.16], [0, 1.95, 0], t.cream, 0.06));
    for (const [e, n] of [
      [-0.52, 2.57],
      [0.52, 2.57],
      [-0.35, 2.11],
      [0.35, 2.11],
    ])
      (a(y, [0.15, 0.25, 0.16], [e, n, 0], t.blueLight, 0.055),
        a(y, [0.22, 0.055, 0.22], [e, n + 0.03, 0], t.mint, 0.025));
    g(y, 0.1, [0, 2.73, 0], t.cream);
    for (const [e, n, o] of [
      [-2.4, -1.38, 1],
      [2.65, 1.3, 0.7],
    ])
      (F(s, [e, 0.15, n], [e, 0.65 * o, n], 0.055, t.cream),
        g(s, 0.32 * o, [e, 0.84 * o, n], t.leaf, [0.9, 1.2, 0.9]),
        g(s, 0.24 * o, [e - 0.16 * o, 0.7 * o, n], t.mint));
    const se = [
        re([
          [-1.8, 0.17, 1.13],
          [-1.75, 0.17, 1.55],
          [-1.4, 0.17, 1.73],
          [-0.4, 0.17, 1.73],
          [0.25, 0.17, 1.53],
          [0.25, 0.17, 0.85],
        ]),
        re([
          [1.25, 0.17, 0.43],
          [1.65, 0.17, 0.43],
          [1.96, 0.17, 0.16],
          [1.96, 0.17, -0.65],
          [2.25, 0.17, -0.86],
        ]),
      ],
      ue = se.map(() =>
        g(
          s,
          0.065,
          [0, 0, 0],
          u("#fff3c4", {
            emissive: "#e8c26c",
            emissiveIntensity: 0.5,
          }),
        ),
      ),
      pe = g(s, 0.24, [-2.35, 2.45, -0.5], t.yellow),
      L = new Group();
    (s.add(L),
      L.position.set(0.15, 3.02, -1.6),
      g(L, 0.19, [-0.22, 0, 0], t.cream),
      g(L, 0.26, [0, 0.08, 0], t.cream),
      g(L, 0.17, [0.24, 0, 0], t.cream));
    const V = document.createElement("canvas");
    V.width = V.height = 128;
    const H = V.getContext("2d"),
      _ = H.createRadialGradient(64, 64, 5, 64, 64, 64);
    (_.addColorStop(0, "rgba(0,0,0,.33)"),
      _.addColorStop(0.55, "rgba(0,0,0,.18)"),
      _.addColorStop(1, "rgba(0,0,0,0)"),
      (H.fillStyle = _),
      H.fillRect(0, 0, 128, 128));
    const J = new Mesh(
      new PlaneGeometry(9, 7),
      new MeshBasicMaterial({
        map: new CanvasTexture(V),
        transparent: !0,
        depthWrite: !1,
      }),
    );
    ((J.rotation.x = -Math.PI / 2), (J.position.y = -0.65), d.add(J));
    let R = -0.16,
      K = -0.16,
      T = null,
      P = 0,
      Q = performance.now(),
      j = !1;
    const ce = new ResizeObserver(ie);
    (ce.observe(b), ie());
    const de = new IntersectionObserver(([e]) => {
      W = e.isIntersecting;
    });
    (de.observe(b),
      S(b, "pointerdown", (e) => {
        ((T = {
          x: e.clientX,
          rotation: R,
        }),
          b.setPointerCapture(e.pointerId));
      }),
      S(b, "pointermove", (e) => {
        T && (R = T.rotation + (e.clientX - T.x) * 0.005);
      }));
    for (const e of ["pointerup", "pointercancel", "lostpointercapture"])
      S(b, e, () => {
        T = null;
      });
    S(r.querySelector("#reset"), "click", () => {
      R = -0.16;
    });
    const D = r.querySelector("#motion");
    (S(D, "click", () => {
      ((h = !h), Y());
    }),
      S(B, "change", (e) => {
        ((h = e.matches), Y());
      }),
      Y());
    const E = new Group();
    (s.add(E),
      a(E, [2.05, 1.15, 1.6], [0.3, 0.72, 0], t.cream, 0.16),
      a(E, [2.2, 0.17, 1.75], [0.3, 1.36, 0], t.blueLight, 0.08));
    for (let e = 0; e < 3; e++)
      a(E, [0.38, 0.36, 0.04], [-0.35 + e * 0.6, 0.86, 0.82], t.mint, 0.05);
    a(E, [0.48, 0.63, 0.045], [0.8, 0.51, 0.83], t.dark, 0.04);
    for (let e = 0; e < 2; e++)
      F(E, [0.7 + e * 0.4, 1.4, -0.45], [0.7 + e * 0.4, 1.96, -0.45], 0.1, t.cream);
    return (
      le(p),
      S(r, "energy-mode", (e) => le(e.detail)),
      (k = requestAnimationFrame(Z)),
      () => {
        ((I = !0),
          cancelAnimationFrame(k),
          ce.disconnect(),
          de.disconnect(),
          X.forEach((e) => e()),
          d.traverse((e) => {
            (e.geometry?.dispose(),
              (Array.isArray(e.material) ? e.material : [e.material])
                .filter(Boolean)
                .forEach((o) => {
                  (o.map?.dispose(), o.dispose());
                }));
          }),
          i.dispose(),
          i.domElement.remove());
      }
    );
  }
  return () => {
    ((I = !0), X.forEach((d) => d()));
  };
}
const O = evaluateScenario(buildBessScenario("min")),
  Pe = (r) => (r == null ? "—" : (r * 100).toFixed(1) + "%"),
  me = (r) => (r == null ? "ยังไม่คืนทุน" : r.toFixed(1) + " ปี");
document.getElementById("ex-irr").textContent = Pe(O.irr);
document.getElementById("ex-payback").textContent = me(O.payback);
document.getElementById("ex-dpayback").textContent = me(O.discounted_payback);
document.getElementById("example-caption").textContent =
  `ตัวอย่างจาก Battery 500 kWh เงินลงทุน ${(O.scenario.initial_investment / 1e6).toFixed(2)} ล้านบาท อายุโครงการ ${O.scenario.project_life} ปี`;
document
  .querySelectorAll(".feature-grid [data-reveal]")
  .forEach((r, p) => r.style.setProperty("--d", p + 1));
const Ge = matchMedia("(prefers-reduced-motion: reduce)").matches,
  ze = (r) => {
    const p = r.textContent,
      x = p.match(/-?[\d.]+/);
    if (!x || Ge) return;
    const b = Number(x[0]),
      B = (x[0].split(".")[1] || "").length,
      h = performance.now(),
      i = (k) => {
        const I = Math.min(1, (k - h) / 1e3),
          W = 1 - Math.pow(1 - I, 3);
        ((r.textContent = p.replace(x[0], (b * W).toFixed(B))), I < 1 && requestAnimationFrame(i));
      };
    requestAnimationFrame(i);
  },
  ne =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (r) =>
            r.forEach((p) => {
              p.isIntersecting &&
                (p.target.classList.add("in"),
                ne.unobserve(p.target),
                p.target.classList.contains("preview-metrics") &&
                  p.target.querySelectorAll("strong").forEach(ze));
            }),
          {
            threshold: 0.2,
          },
        )
      : null;
document
  .querySelectorAll("[data-reveal]")
  .forEach((r) => (ne ? ne.observe(r) : r.classList.add("in")));
try {
  Te(document.getElementById("hero-3d"), "hybrid");
} catch {}
