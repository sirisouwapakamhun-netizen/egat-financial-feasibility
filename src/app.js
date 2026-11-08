import "./styles/app.css";
import { buildBessScenario, evaluateScenario } from "./model.js";
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFShadowMap,
  SRGBColorSpace,
  Scene,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createClient } from "@supabase/supabase-js";
const zt = {
    revenue_growth: 0.02,
    om_growth: 0.01,
    other_growth: 0.01,
    discount_rate: 0.08,
    replacement_year: 0,
    replacement_cost: 0,
    decision_override: "auto",
    peak_rate: 4.1839,
    offpeak_rate: 2.6037,
    peak_energy_kwh_day: 400,
    parent_id: null,
    note: "ข้อมูลสมมติสำหรับทดลองใช้งาน ไม่ใช่ข้อมูลโครงการจริง",
  },
  vi = [
    {
      ...zt,
      id: "demo-bess",
      name: "BESS · โครงการตัวอย่าง",
      initial_investment: 45e5,
      project_life: 10,
      revenue_y1: 105e4,
      om_y1: 45e3,
      other_y1: 35e3,
      salvage_value: 3e5,
      energy_y1_kwh: 146e3,
    },
    {
      ...zt,
      id: "demo-bess-c1",
      parent_id: "demo-bess",
      name: "โครงการลูกค้าคนที่ 1",
      initial_investment: 38e5,
      project_life: 10,
      revenue_y1: 92e4,
      om_y1: 4e4,
      other_y1: 3e4,
      salvage_value: 26e4,
      energy_y1_kwh: 128e3,
    },
    {
      ...zt,
      id: "demo-hybrid",
      name: "Solar + Battery · ตัวอย่าง",
      initial_investment: 95e5,
      project_life: 20,
      revenue_y1: 14e5,
      om_y1: 15e4,
      other_y1: 4e4,
      salvage_value: 5e5,
      replacement_year: 10,
      replacement_cost: 18e5,
      energy_y1_kwh: 36e4,
    },
    {
      ...zt,
      id: "demo-solar",
      name: "Solar PPA · ตัวอย่าง",
      initial_investment: 65e5,
      project_life: 25,
      revenue_y1: 95e4,
      om_y1: 12e4,
      other_y1: 3e4,
      salvage_value: 3e5,
      energy_y1_kwh: 33e4,
    },
  ],
  cn = {
    solar: "demo-solar",
    hybrid: "demo-hybrid",
    battery: "demo-bess",
  },
  ye = Object.keys(cn),
  Ht = (t, e = "min") => ({
    ...vi.find((r) => r.id === cn[t]),
    ...(t === "battery"
      ? {
          ...buildBessScenario(e),
          note: "BESS Feasibility Model_rev01.xlsx · " + e,
        }
      : {}),
  }),
  un = () =>
    globalThis.crypto?.randomUUID?.() ??
    "project-" + Date.now() + "-" + Math.random().toString(36).slice(2);
function hn() {
  const t = ye.flatMap((e) =>
    Array.from(
      {
        length: e === "solar" ? 4 : 2,
      },
      (r, s) => ({
        id: un(),
        product: e,
        name: `ลูกค้าคนที่ ${s + 1}`,
        scenario: Ht(e, e === "battery" && s === 1 ? "max" : "min"),
      }),
    ),
  );
  return {
    version: 1,
    selected: "solar",
    projects: t,
    active: Object.fromEntries(ye.map((e) => [e, t.find((r) => r.product === e).id])),
  };
}
const Ge = (t, e = t.selected) =>
  t.projects.find((r) => r.product === e && r.id === t.active[e]) ?? null;
function yi(t, e, r, s = !1) {
  const n = s ? Ge(t, e)?.scenario : null,
    i = {
      id: un(),
      product: e,
      name: r.trim(),
      scenario: {
        ...(n ?? Ht(e)),
        decision_override: "auto",
      },
    };
  if (!i.name || !ye.includes(e)) throw Error("Invalid project");
  return (t.projects.push(i), (t.active[e] = i.id), (t.selected = e), i);
}
function wi(t, e) {
  const r = t.projects.findIndex((n) => n.id === e);
  if (r < 0) return null;
  const [s] = t.projects.splice(r, 1);
  return (
    t.active[s.product] === e &&
      (t.active[s.product] = t.projects.find((n) => n.product === s.product)?.id ?? null),
    {
      project: s,
      index: r,
    }
  );
}
function bi(t, e) {
  !e ||
    t.projects.some((r) => r.id === e.project.id) ||
    (t.projects.splice(Math.min(e.index, t.projects.length), 0, e.project),
    (t.selected = e.project.product),
    (t.active[t.selected] = e.project.id));
}
function dn(t) {
  return (
    t?.version === 1 &&
    ye.includes(t.selected) &&
    t.active &&
    Array.isArray(t.projects) &&
    new Set(t.projects.map((e) => e.id)).size === t.projects.length &&
    t.projects.every(
      (e) =>
        typeof e.id == "string" &&
        ye.includes(e.product) &&
        typeof e.name == "string" &&
        e.name.trim().length > 0 &&
        e.name.length <= 80 &&
        ["auto", "accept", "reject"].includes(e.scenario?.decision_override ?? "auto") &&
        Object.entries(Ht(e.product)).every(
          ([r, s]) => typeof s != "number" || Number.isFinite(e.scenario?.[r]),
        ) &&
        e.scenario.project_life >= 1 &&
        e.scenario.project_life <= 40 &&
        Number.isInteger(e.scenario.project_life) &&
        e.scenario.discount_rate >= 0,
    ) &&
    ye.every((e) =>
      t.projects.some((r) => r.product === e)
        ? t.projects.some((r) => r.product === e && r.id === t.active[e])
        : t.active[e] == null,
    )
  );
}
const STORAGE_KEY = "egat-bento-v4-project-workspace";
function _i(t, e = "solar", r = {}) {
  if (!["solar", "hybrid", "battery"].includes(e)) throw new Error("Unknown product");
  const s = new WebGLRenderer({
    alpha: !0,
    antialias: !0,
  });
  (s.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)),
    (s.outputColorSpace = SRGBColorSpace),
    (s.toneMapping = ACESFilmicToneMapping),
    (s.toneMappingExposure = 1.05),
    (s.shadowMap.enabled = !0),
    (s.shadowMap.type = PCFShadowMap),
    s.domElement.setAttribute("aria-hidden", "true"),
    t.append(s.domElement));
  const n = new Scene(),
    i = new OrthographicCamera(-5, 5, 4, -4, 0.1, 50);
  (i.position.set(8.4, 8.2, 11.7),
    i.lookAt(0, r.lookY ?? 1.05, 0),
    n.add(new HemisphereLight(14413567, 3424862, 2.5)));
  const a = new DirectionalLight(16773599, 3.5);
  (a.position.set(-3, 8, 6),
    (a.castShadow = !0),
    a.shadow.mapSize.set(r.shadowSize ?? 2048, r.shadowSize ?? 2048),
    Object.assign(a.shadow.camera, {
      left: -6,
      right: 6,
      top: 6,
      bottom: -6,
      near: 0.1,
      far: 30,
    }),
    (a.shadow.bias = -25e-5),
    (a.shadow.normalBias = 0.035),
    (a.shadow.radius = 3),
    n.add(a));
  const o = new DirectionalLight(11918591, 2);
  (o.position.set(3, 5, -6), n.add(o));
  const l = new Group();
  n.add(l);
  const c = (T, x = {}) =>
      new MeshStandardMaterial({
        color: T,
        roughness: 0.55,
        metalness: 0.05,
        ...x,
      }),
    u = {
      base: c("#273f5c"),
      deck: c("#65849b"),
      white: c("#e2edf0"),
      ice: c("#a9cae4"),
      blue: c("#7aa7d3"),
      edge: c("#537da5"),
      cell: c("#456fae", {
        roughness: 0.3,
        metalness: 0.18,
      }),
      cell2: c("#5786bb", {
        roughness: 0.32,
        metalness: 0.18,
      }),
      line: c("#a8c9e5"),
      dark: c("#254460"),
      mint: c("#a4d9c5"),
      leaf: c("#a3cbb9"),
      orange: c("#ffb48d"),
      light: c("#ffe7cc", {
        emissive: "#ffb383",
        emissiveIntensity: 0.35,
      }),
    },
    h = new Set(),
    p = new Set(Object.values(u));
  function d(T, x, j, P) {
    h.add(x);
    const C = new Mesh(x, j);
    return (C.position.set(...P), (C.castShadow = !0), (C.receiveShadow = !0), T.add(C), C);
  }
  function f(T, x, j, P, C = 0.06) {
    const I = Math.min(C, ...x.map((z) => z / 2));
    return d(T, new RoundedBoxGeometry(...x, 3, I), P, j);
  }
  function m(T, x, j, P, C = [1, 1, 1]) {
    const I = d(T, new SphereGeometry(x, 24, 16), P, j);
    return (I.scale.set(...C), I);
  }
  function g(T, x, j, P, C) {
    const I = new Vector3(...x),
      z = new Vector3(...j),
      le = d(
        T,
        new CylinderGeometry(P, P, I.distanceTo(z), 16),
        C,
        I.clone().add(z).multiplyScalar(0.5).toArray(),
      );
    return (le.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), z.sub(I).normalize()), le);
  }
  function w(T) {
    const x = new CatmullRomCurve3(
      T.map((j) => new Vector3(...j)),
      !1,
      "catmullrom",
      0.25,
    );
    return (d(l, new TubeGeometry(x, 90, 0.045, 10, !1), u.orange, [0, 0, 0]), x);
  }
  function v(T, x, j = 1, P = !1) {
    const C = new Shape();
    (C.moveTo(0.07, 0.28),
      C.lineTo(-0.17, -0.01),
      C.lineTo(-0.025, -0.01),
      C.lineTo(-0.08, -0.27),
      C.lineTo(0.18, 0.065),
      C.lineTo(0.025, 0.065),
      C.closePath());
    const I = d(
      T,
      new ExtrudeGeometry(C, {
        depth: 0.025,
        bevelEnabled: !0,
        bevelSegments: 2,
        bevelSize: 0.012,
        bevelThickness: 0.01,
      }),
      u.orange,
      x,
    );
    (I.scale.setScalar(j), P && (I.rotation.y = Math.PI / 2));
  }
  function y(T, x, j = 1) {
    (g(l, [T, 0.13, x], [T, 0.62 * j, x], 0.055, u.white),
      m(l, 0.27 * j, [T, 0.78 * j, x], u.leaf, [0.85, 1.25, 0.9]),
      m(l, 0.2 * j, [T - 0.15 * j, 0.63 * j, x + 0.05], u.mint));
  }
  (f(l, [6.7, 0.32, 4.45], [0, -0.16, 0], u.base, 0.17),
    f(l, [6.6, 0.13, 4.35], [0, 0.035, 0], u.deck, 0.065),
    f(l, [1.05, 0.045, 0.045], [0, -0.14, 2.235], u.orange, 0.02));
  function b(T, x, j, P) {
    const C = new Group();
    (C.position.set(T, 0.14, x), l.add(C));
    for (const pe of [-j * 0.34, j * 0.34])
      (f(C, [0.18, 0.1, P * 0.9], [pe, 0.05, 0], u.white, 0.05),
        g(C, [pe, 0.1, -P * 0.35], [pe, 0.92, -P * 0.35], 0.055, u.white),
        g(C, [pe, 0.1, P * 0.35], [pe, 0.38, P * 0.35], 0.055, u.white));
    const I = new Group();
    (C.add(I),
      (I.position.y = 0.72),
      (I.rotation.x = 0.32),
      f(I, [j, 0.12, P], [0, 0, 0], u.white, 0.06));
    const z = j > 3 ? 12 : 6,
      le = P > 2 ? 7 : 5,
      Z = j - 0.16,
      ee = P - 0.16;
    f(I, [Z, 0.025, ee], [0, 0.068, 0], u.dark, 0.015);
    for (let pe = 0; pe < le; pe++)
      for (let Kt = 0; Kt < z; Kt++) {
        const hs = -Z / 2 + ((Kt + 0.5) * Z) / z,
          ds = -ee / 2 + ((pe + 0.5) * ee) / le;
        (f(
          I,
          [Z / z - 0.022, 0.014, ee / le - 0.022],
          [hs, 0.089, ds],
          (Kt + pe) % 3 === 0 ? u.cell2 : u.cell,
          0.017,
        ),
          f(I, [0.006, 0.004, ee / le - 0.03], [hs, 0.099, ds], u.line, 0.002));
      }
    return (
      z === 12 && f(I, [0.045, 0.04, ee], [0, 0.1, 0], u.white, 0.01),
      f(I, [Z, 0.04, 0.045], [0, 0.1, 0], u.white, 0.01),
      C
    );
  }
  function E(T, x, j = 3, P = 2.6, C = 1.02) {
    const I = new Group();
    (I.position.set(T, 0.13, x), l.add(I));
    const z = j * C;
    f(I, [z + 0.2, 0.16, 1.48], [0, 0.08, 0], u.dark, 0.075);
    for (let le = 0; le < j; le++) {
      const Z = (le - (j - 1) / 2) * C;
      (f(I, [C - 0.035, P, 1.29], [Z, P / 2 + 0.16, 0], u.ice, 0.09),
        f(I, [C - 0.15, P - 0.28, 0.065], [Z, P / 2 + 0.16, 0.657], u.white, 0.06),
        f(I, [C - 0.2, 0.13, 1.22], [Z, P + 0.19, 0], u.white, 0.05),
        f(I, [0.33, 0.16, 0.035], [Z, P - 0.25, 0.699], u.dark, 0.03));
      for (let ee = 0; ee < 3; ee++)
        f(I, [0.065, 0.065, 0.012], [Z - 0.09 + ee * 0.09, P - 0.25, 0.724], u.mint, 0.015);
      f(I, [0.035, 0.24, 0.04], [Z + C * 0.29, P * 0.58, 0.712], u.edge, 0.015);
      for (let ee = 0; ee < 5; ee++)
        f(I, [C * 0.5, 0.027, 0.018], [Z, 0.44 + ee * 0.075, 0.704], u.edge, 0.012);
      v(I, [Z, P * 0.55, 0.712], 0.65);
    }
    return (
      f(I, [0.04, 0.83, 0.68], [z / 2 + 0.005, P * 0.6, 0], u.white, 0.08),
      v(I, [z / 2 + 0.035, P * 0.6, 0], 1.05, !0),
      I
    );
  }
  function R(T, x, j) {
    const P = new Group();
    (P.position.set(T, 0.14, x),
      P.scale.setScalar(j),
      l.add(P),
      f(P, [0.5, 0.15, 0.5], [0, 0.08, 0], u.white, 0.07),
      g(P, [0, 0.1, 0], [0, 2.5, 0], 0.08, u.white));
    for (const [C, I] of [
      [2.22, 1.1],
      [1.84, 0.85],
    ]) {
      f(P, [I, 0.12, 0.15], [0, C, 0], u.white, 0.05);
      for (const z of [-I * 0.36, I * 0.36])
        (f(P, [0.13, 0.22, 0.14], [z, C + 0.13, 0], u.ice, 0.04),
          f(P, [0.21, 0.045, 0.2], [z, C + 0.15, 0], u.mint, 0.02));
    }
    m(P, 0.09, [0, 2.55, 0], u.white);
  }
  const O = [];
  if (e === "solar") {
    (b(-0.4, -0.15, 4.65, 2.9),
      f(l, [0.62, 0.94, 0.52], [2.38, 0.6, 0.38], u.white, 0.09),
      f(l, [0.39, 0.2, 0.035], [2.38, 0.78, 0.658], u.dark, 0.035),
      f(l, [0.23, 0.045, 0.015], [2.38, 0.78, 0.683], u.mint, 0.014));
    for (let T = 0; T < 3; T++)
      f(l, [0.31, 0.025, 0.02], [2.38, 0.36 + T * 0.06, 0.66], u.edge, 0.01);
    (O.push(
      w([
        [-1.8, 0.15, 1.42],
        [-1.8, 0.15, 1.83],
        [-0.5, 0.15, 1.86],
        [1.7, 0.15, 1.86],
        [2.38, 0.15, 1.45],
        [2.38, 0.15, 0.67],
      ]),
    ),
      y(-2.8, -1.72, 0.82),
      y(2.8, 1.65, 0.55));
  } else
    e === "hybrid"
      ? (b(-1.5, 0.05, 2.7, 2.65),
        E(1.4, -0.35, 2, 2.18, 0.92),
        O.push(
          w([
            [-1.8, 0.15, 1.4],
            [-1.8, 0.15, 1.86],
            [-0.7, 0.15, 1.91],
            [1.25, 0.15, 1.91],
            [1.4, 0.15, 1.15],
            [1.4, 0.15, 0.45],
          ]),
        ),
        y(-2.8, -1.75, 0.78),
        y(2.8, 1.65, 0.55))
      : (E(-0.28, -0.12, 3, 2.75, 1.05),
        R(2.55, -1.1, 0.73),
        O.push(
          w([
            [0.9, 0.15, 0.64],
            [0.9, 0.15, 1.62],
            [1.9, 0.15, 1.76],
            [2.68, 0.15, 1.35],
            [2.68, 0.15, -0.4],
            [2.55, 0.15, -0.94],
          ]),
        ),
        y(-2.65, -1.6, 0.72),
        y(-2.6, 1.3, 0.52));
  const D = m(l, 0.23, [-2.35, 3.15, -0.65], u.orange),
    M = new Group();
  (M.position.set(0.3, 3.48, -1.4),
    l.add(M),
    m(M, 0.17, [-0.2, 0, 0], u.white),
    m(M, 0.24, [0, 0.07, 0], u.white),
    m(M, 0.16, [0.21, 0, 0], u.white));
  const oe = O.map(() => m(l, 0.065, [0, 0, 0], u.light)),
    Y = matchMedia("(prefers-reduced-motion: reduce)");
  let de = !1,
    Ze = !1,
    et = -0.1,
    fe = -0.1,
    q = 0,
    De = 0,
    ns = !0,
    Sr = !1,
    wt = 0,
    Er = 0,
    is = performance.now();
  const as = [];
  function Vt(T, x, j) {
    (T.addEventListener(x, j), as.push(() => T.removeEventListener(x, j)));
  }
  function Tr(T, x) {
    const j = Math.max(r.zoomHeight ?? 6.6, (9.4 * x) / T);
    ((i.left = (-j * T) / x / 2),
      (i.right = -i.left),
      (i.top = j / 2),
      (i.bottom = -i.top),
      i.updateProjectionMatrix());
  }
  function os() {
    const { width: T, height: x } = t.getBoundingClientRect();
    T <= 0 || x <= 0 || (s.setSize(T, x), Tr(T, x));
  }
  const ls = new ResizeObserver(os);
  (ls.observe(t), os());
  const cs = new IntersectionObserver(([T]) => {
    ns = T.isIntersecting;
  });
  (cs.observe(t),
    Vt(t, "pointerdown", (T) => {
      T.button === 0 && ((Ze = !0), (q = T.clientX), (De = fe), t.setPointerCapture(T.pointerId));
    }),
    Vt(t, "pointermove", (T) => {
      Ze && (fe = De + (T.clientX - q) * 0.006);
    }));
  for (const T of ["pointerup", "pointercancel", "lostpointercapture"])
    Vt(t, T, () => {
      Ze = !1;
    });
  Vt(t, "keydown", (T) => {
    ((T.key === "ArrowLeft" || T.key === "ArrowRight") &&
      (T.preventDefault(), (fe += T.key === "ArrowLeft" ? -0.15 : 0.15)),
      T.key === "Home" && (fe = -0.1));
  });
  function us(T) {
    if (Sr) return;
    const x = Math.max(0, Math.min((T - is) / 1e3, 0.05));
    ((is = T),
      ns &&
        !document.hidden &&
        (de && !Y.matches && !Ze && (wt += x),
        r.sway &&
          de &&
          !Y.matches &&
          !Ze &&
          (fe = -0.1 + Math.sin(wt * 0.45 + (r.phase ?? 0)) * 0.32),
        (et += (fe - et) * (Y.matches ? 1 : 1 - Math.exp(-10 * x))),
        (l.rotation.y = et),
        (M.position.y = 3.48 + (de && !Y.matches ? Math.sin(wt * 0.7) * 0.035 : 0)),
        (D.position.y = 3.15 + (de && !Y.matches ? Math.sin(wt * 0.8) * 0.025 : 0)),
        oe.forEach((j, P) =>
          j.position.copy(O[P].getPoint((wt * 0.12 + 0.3) % 1)).add(new Vector3(0, 0.04, 0)),
        ),
        s.render(n, i)),
      (Er = requestAnimationFrame(us)));
  }
  return (
    (Er = requestAnimationFrame(us)),
    {
      setMotion(T) {
        de = !!T;
      },
      reset() {
        fe = -0.1;
      },
      exportCanvas(T = 1600, x = 1200) {
        const j = s.getSize(new Vector2()),
          P = s.getPixelRatio();
        try {
          (s.setPixelRatio(1), s.setSize(T, x, !1), Tr(T, x), s.render(n, i));
          const C = document.createElement("canvas");
          return (
            (C.width = T),
            (C.height = x),
            C.getContext("2d").drawImage(s.domElement, 0, 0),
            C
          );
        } finally {
          (s.setPixelRatio(P), s.setSize(j.x, j.y, !1), Tr(j.x, j.y), s.render(n, i));
        }
      },
      dispose() {
        Sr ||
          ((Sr = !0),
          cancelAnimationFrame(Er),
          ls.disconnect(),
          cs.disconnect(),
          as.forEach((T) => T()),
          h.forEach((T) => T.dispose()),
          p.forEach((T) => T.dispose()),
          s.dispose(),
          s.domElement.remove());
      },
    }
  );
}
const k = (t, e = 0) =>
    Number(t).toLocaleString("en-US", {
      minimumFractionDigits: e,
      maximumFractionDigits: e,
    }),
  Ne = "#ffb28b",
  we = "#bdddd4",
  Jr = "#82a7d4",
  fn = "#ffffff0b",
  K = (t) => Number(t).toFixed(2),
  N = (t, e, r, s = "") => `<text x="${K(t)}" y="${K(e)}" ${s}>${r}</text>`,
  ae = (t, e, r, s, n = fn, i = "") =>
    `<line x1="${K(t)}" y1="${K(e)}" x2="${K(r)}" y2="${K(s)}" stroke="${n}" ${i}/>`,
  Je = (t, e, r, s) =>
    `<svg class="chart" viewBox="0 0 ${t} ${e}" role="img" aria-label="${r}">${s}</svg>`,
  ki = [Jr, we, Ne];
function Si(
  t,
  e = {
    simple: !0,
    discount: !0,
  },
  r = 285,
  s,
) {
  const n = s ?? 580,
    i = r,
    a = 43,
    o = 16,
    l = 32,
    c = 33,
    u = t.cashflows.at(-1).year,
    h = t.cashflows.flatMap((b) => [b.cumulative / 1e6, b.discounted_cumulative / 1e6]);
  let p = Math.floor(Math.min(...h, 0)),
    d = Math.ceil(Math.max(...h, 0));
  p === d && (d = p + 1);
  const f = (b) => a + (b / u) * (n - a - o),
    m = (b) => l + ((d - b) / (d - p)) * (i - l - c);
  let g = "";
  for (let b = 0; b < 5; b++) {
    const E = p + ((d - p) * b) / 4;
    Math.abs(m(E) - m(0)) > 13 &&
      (g += ae(a, m(E), n - o, m(E)) + N(a - 8, m(E) + 3, k(E, 1), 'text-anchor="end"'));
  }
  for (let b = 0; b <= 5; b++) {
    const E = (u * b) / 5;
    g += N(f(E), i - 15, k(E, E % 1 ? 1 : 0), 'text-anchor="middle"');
  }
  g +=
    ae(a, m(0), n - o, m(0), "#9bb0c54d") +
    N(a - 8, m(0) + 3, "0", 'text-anchor="end" class="value"') +
    N(n - o, i - 1, "ปีโครงการ", 'text-anchor="end" class="axis-label"') +
    N(a, 13, "ล้านบาท", 'class="axis-label"');
  const w = [
      ["cumulative", Ne, e.simple, "สะสมปกติ"],
      ["discounted_cumulative", we, e.discount, "สะสมคิดลด"],
    ],
    v = (n - a - o) / u;
  let y = "";
  return (
    t.cashflows.forEach((b) => {
      y += `<rect class="hit" data-pick="${b.year}" x="${K(f(b.year) - v / 2)}" y="${l}" width="${K(v)}" height="${i - l - c}" fill="transparent"><title>ปี ${b.year} · กดเพื่อดูรายละเอียด</title></rect>`;
    }),
    (g += y),
    w.forEach(([b, E, R, O]) => {
      R &&
        ((g += `<polyline class="draw" fill="none" stroke="${E}" stroke-width="2.8" ${b.startsWith("discount") ? 'stroke-dasharray="5 3"' : ""} stroke-linejoin="round" points="${t.cashflows.map((D) => K(f(D.year)) + "," + K(m(D[b] / 1e6))).join(" ")}"/>`),
        t.cashflows.forEach((D) => {
          g += `<circle class="pt" data-pick="${D.year}" cx="${f(D.year)}" cy="${m(D[b] / 1e6)}" r="4.5" fill="${E}" stroke="#1b2b43" stroke-width="2"><title>ปี ${D.year} · ${O}: ${k(D[b])} บาท</title></circle>`;
        }));
    }),
    [
      [t.payback, Ne, e.simple, -25, "ปกติ"],
      [t.discounted_payback, we, e.discount, 27, "คิดลด"],
    ].forEach(([b, E, R, O, D]) => {
      if (b == null || !R) return;
      const M = m(0),
        oe = Math.max(18, Math.min(i - c - 8, M + O)),
        Y = Math.max(a, Math.min(n - 102, f(b) - 35));
      g +=
        ae(f(b), M, f(b), i - c, E, 'stroke-dasharray="3 5" opacity=".35"') +
        `<circle cx="${f(b)}" cy="${M}" r="5" fill="${E}" stroke="#1b2b43" stroke-width="2"/><rect x="${Y}" y="${oe - 13}" width="84" height="21" rx="6" fill="${E}"/>` +
        N(
          Y + 42,
          oe + 1,
          `${D} ${k(b, 2)} ปี`,
          'text-anchor="middle" style="fill:#19283b;font-size:9px;font-weight:600"',
        );
    }),
    Je(
      n,
      i,
      `กระแสเงินสดสะสม ปกติ ${t.payback == null ? "ไม่คืนทุน" : k(t.payback, 2) + " ปี"} คิดลด ${t.discounted_payback == null ? "ไม่คืนทุน" : k(t.discounted_payback, 2) + " ปี"}`,
      g,
    )
  );
}
function Ei(t, e = 210, r, s = null) {
  const n = t.cashflows.slice(1, s ? s + 1 : void 0),
    i = r ?? 420,
    a = e,
    o = 38,
    l = 12,
    c = 22,
    u = 30,
    h = Math.min(0, ...n.map((v) => v.net_cf / 1e6)),
    p = Math.max(0.1, ...n.map((v) => v.net_cf / 1e6)) * 1.18,
    d = (v) => o + ((v - 0.5) / n.length) * (i - o - l),
    f = (v) => c + ((p - v) / (p - h)) * (a - c - u),
    m = Math.min(22, ((i - o - l) / n.length) * 0.6);
  let g = N(o, 11, "ล้านบาท", 'class="axis-label"');
  for (let v = 0; v < 4; v++) {
    const y = h + ((p - h) * v) / 3;
    g += ae(o, f(y), i - l, f(y)) + N(o - 7, f(y) + 3, k(y, 1), 'text-anchor="end"');
  }
  g += ae(o, f(0), i - l, f(0), "#91a9bf44");
  const w = (i - o - l) / n.length;
  return (
    n.forEach((v) => {
      g += `<rect class="hit" data-pick="${v.year}" x="${K(d(v.year) - w / 2)}" y="${c}" width="${K(w)}" height="${a - c - u}" fill="transparent"/>`;
    }),
    n.forEach((v) => {
      const y = v.net_cf / 1e6,
        b = f(0);
      ((g += `<rect data-pick="${v.year}" class="bar${y < 0 ? " down" : ""}" x="${d(v.year) - m / 2}" y="${Math.min(b, f(y))}" width="${m}" height="${Math.max(1, Math.abs(f(y) - b))}" rx="${Math.min(5, m / 3)}" fill="${y < 0 ? Ne : Jr}" opacity="${v.year === t.cashflows.at(-1).year ? 1 : 0.8}"><title>ปี ${v.year}: ${k(v.net_cf)} บาท${v.replacement > 0 ? " · เปลี่ยนอุปกรณ์ " + k(v.replacement) + " บาท" : ""}</title></rect>`),
        (v.year === 1 || v.year === n.length || v.year % Math.ceil(n.length / 6) === 0) &&
          (g += N(d(v.year), a - 11, v.year, 'text-anchor="middle"')));
    }),
    Je(
      i,
      a,
      "กระแสเงินสดสุทธิปีที่ 1 ถึง " + n.length,
      g + N(i - l, a - 1, "ปี", 'text-anchor="end" class="axis-label"'),
    )
  );
}
function yr(t, e = !1) {
  const r = t.scenario,
    s = t.customer;
  if (!e)
    return {
      kind: "shift",
      before: s.costBeforeYear,
      after: s.costAfterYear,
      saving: s.savingYear,
      beforeLabel: "Peak",
      afterLabel: "Off-peak",
      beforeTitle: "ค่าไฟก่อนย้ายช่วง (Peak)",
      afterTitle: "ค่าไฟหลังย้ายช่วง (Off-peak)",
      rateBefore: s.peakRate,
      rateAfter: s.offRate,
      qty: s.peakKwhDay,
      qtyLabel: "พลังงานต่อวัน",
      source: "ย้ายการใช้ไฟจาก Peak ไป Off-peak",
      cumulative: s.cumulative,
      life: r.project_life,
    };
  const n = r.energy_y1_kwh ?? 0,
    i = r.peak_rate ?? 4.1839,
    a = r.ppa_rate ?? (n ? r.revenue_y1 / n : 0),
    o = n * i,
    l = n * a,
    c = o - l;
  let u = 0;
  const h = Array.from(
    {
      length: r.project_life,
    },
    (p, d) => (
      (u += c),
      {
        year: d + 1,
        saving: c,
        cumulative: u,
      }
    ),
  );
  return {
    kind: "ppa",
    before: o,
    after: l,
    saving: c,
    beforeLabel: "ไฟกริด",
    afterLabel: "ไฟ PPA",
    beforeTitle: "ถ้าซื้อไฟจากกริด (Peak)",
    afterTitle: "จ่ายค่าไฟตามสัญญา PPA",
    rateBefore: i,
    rateAfter: a,
    qty: n,
    qtyLabel: "พลังงานโซลาร์ต่อปี",
    source: "ซื้อไฟโซลาร์ราคา PPA แทนไฟกริด",
    cumulative: h,
    life: r.project_life,
  };
}
function Ti(t, e = "annual", r = !1, s = 200, n) {
  const i = yr(t, r),
    a = n ?? 280,
    o = s,
    l = 37,
    c = 14,
    u = 25,
    h = 32;
  if (e === "cumulative") {
    const E = i.cumulative.at(-1)?.cumulative ?? 0,
      R = Math.max(1, Math.abs(E / 1e6)) * 1.2,
      O = E < 0,
      D = O ? -R : 0,
      M = O ? 0 : R,
      oe = (q) => l + (q / i.life) * (a - l - c),
      Y = (q) => u + ((M - q) / (M - D)) * (o - u - h);
    let de = "";
    for (let q = 0; q < 4; q++) {
      let De = D + ((M - D) * q) / 3;
      de += ae(l, Y(De), a - c, Y(De)) + N(l - 7, Y(De) + 3, k(De, 1), 'text-anchor="end"');
    }
    const et = [
        {
          year: 0,
          cumulative: 0,
        },
        ...i.cumulative,
      ]
        .map((q) => `${oe(q.year)},${Y(q.cumulative / 1e6)}`)
        .join(" "),
      fe = (a - l - c) / i.life;
    return (
      (de +=
        `<polygon points="${oe(0)},${Y(0)} ${et} ${oe(i.life)},${Y(0)}" fill="${we}" opacity=".08"/><polyline class="draw" points="${et}" fill="none" stroke="${we}" stroke-width="2.5"/>` +
        i.cumulative
          .map(
            (q) =>
              `<rect class="hit" data-pick="${q.year}" x="${K(oe(q.year) - fe / 2)}" y="${u}" width="${K(fe)}" height="${o - u - h}" fill="transparent"/><circle class="pt" data-pick="${q.year}" cx="${oe(q.year)}" cy="${Y(q.cumulative / 1e6)}" r="4.5" fill="${we}" stroke="#1b2b43" stroke-width="2"/>`,
          )
          .join("") +
        N(l, 12, "ล้านบาท", 'class="axis-label"')),
      [0, Math.round(i.life / 2), i.life].forEach(
        (q) => (de += N(oe(q), o - 12, q, 'text-anchor="middle"')),
      ),
      Je(
        a,
        o,
        "ผลประหยัดสะสมตามสมมติฐาน",
        de + N(a - c, o - 1, "ปี", 'text-anchor="end" class="axis-label"'),
      )
    );
  }
  const p = [i.before, i.after],
    d = Math.max(...p, 1) * 1.2,
    f = (E) => u + (1 - E / d) * (o - u - h),
    m = Math.min(150, (a - l - c) / 2.4),
    g = l + (a - l - c) / 2;
  let w = "";
  for (let E = 0; E < 3; E++) {
    let R = (d * E) / 2;
    w +=
      ae(l, f(R), a - c, f(R)) +
      N(l - 7, f(R) + 3, k(R / 1e3), 'text-anchor="end" style="font-size:9px"');
  }
  p.forEach((E, R) => {
    const O = g + (R ? m / 2 : -m / 2);
    w +=
      `<rect class="hit" data-pick="${R}" x="${O - 50}" y="${u}" width="100" height="${o - u - h}" fill="transparent"/><rect data-pick="${R}" class="bar" x="${O - 24}" y="${f(E)}" width="48" height="${Math.max(1, o - h - f(E))}" rx="12" fill="${R ? we : Ne}" opacity=".9"><title>${R ? i.afterTitle : i.beforeTitle}: ${k(E)} บาท/ปี</title></rect>` +
      N(O, f(E) - 8, k(E / 1e3, 1), 'text-anchor="middle" class="value" style="font-size:11px"') +
      N(O, o - 12, R ? i.afterLabel : i.beforeLabel, 'text-anchor="middle"');
  });
  const v = f(i.before),
    y = f(i.after),
    b = g + m / 2 + 40;
  return (
    i.saving > 0 &&
      b < a - c - 10 &&
      (w +=
        ae(b, v, b, y, "#bdddd4aa", 'stroke-dasharray="3 3"') +
        N(
          b + 6,
          (v + y) / 2 + 3,
          "ประหยัด " + k(i.saving / 1e3, 1),
          'style="font-size:9px;fill:#bdddd4"',
        )),
    Je(
      a,
      o,
      i.kind === "ppa"
        ? "ค่าไฟจากกริดเทียบกับค่าไฟตามสัญญา PPA"
        : "ค่าไฟก่อนและหลังย้ายช่วงการใช้พลังงาน",
      w + N(l, 12, "พันบาท / ปี", 'class="axis-label"'),
    )
  );
}
function pn(t, e = 0.2) {
  const r = t.scenario,
    s = t.npv;
  return [
    ["รายได้ปีแรก", "revenue_y1"],
    ["เงินลงทุน", "initial_investment"],
    ["อัตราคิดลด", "discount_rate"],
    ["ค่า O&M", "om_y1"],
    ["มูลค่าซาก", "salvage_value"],
  ]
    .map(([n, i]) => ({
      name: n,
      key: i,
      low:
        (evaluateScenario({
          ...r,
          [i]: r[i] * (1 - e),
        }).npv -
          s) /
        1e6,
      high:
        (evaluateScenario({
          ...r,
          [i]: r[i] * (1 + e),
        }).npv -
          s) /
        1e6,
    }))
    .sort((n, i) => Math.abs(i.high - i.low) - Math.abs(n.high - n.low));
}
function Ai(t, e = 0.2, r = 222, s) {
  const n = pn(t, e),
    i = s ?? 420,
    a = r,
    o = 99,
    l = 25,
    c = 25,
    u = 28,
    h = Math.max(0.1, ...n.flatMap((g) => [Math.abs(g.low), Math.abs(g.high)])) * 1.14,
    p = o + (i - o - l) / 2,
    d = (g) => p + ((g / h) * (i - o - l)) / 2;
  let f = N(o, 10, "Δ NPV · ล้านบาท", 'class="axis-label"');
  [-h, 0, h].forEach(
    (g) =>
      (f +=
        ae(
          d(g),
          c,
          d(g),
          a - u,
          g === 0 ? "#b8ccdd66" : fn,
          g === 0 ? 'stroke-dasharray="3 3"' : "",
        ) + N(d(g), a - 11, k(g, 1), 'text-anchor="middle"')),
  );
  const m = (a - c - u) / n.length;
  return (
    n.forEach((g, w) => {
      let v = c + (w + 0.5) * m;
      ((f +=
        `<rect class="hit" data-pick="${w}" x="4" y="${K(v - m / 2)}" width="${i - 8}" height="${K(m)}" rx="6" fill="transparent"/>` +
        N(o - 9, v + 4, g.name, 'text-anchor="end" style="font-size:10px"')),
        [
          ["low", Ne, -5],
          ["high", we, 4],
        ].forEach(
          ([y, b, E]) =>
            (f += `<rect data-pick="${w}" class="bar h${d(g[y]) < p ? " rev" : ""}" x="${Math.min(p, d(g[y]))}" y="${v + E}" width="${Math.max(1, Math.abs(d(g[y]) - p))}" height="7" rx="3.5" fill="${b}"><title>${g.name} ${y === "low" ? "-" : "+"}${e * 100}% → ΔNPV ${k(g[y] * 1e6)} บาท</title></rect>`),
        ));
    }),
    Je(i, a, "ผลกระทบต่อ NPV เมื่อเปลี่ยนสมมติฐานทีละตัว " + e * 100 + " เปอร์เซ็นต์", f)
  );
}
function Ri(t, e = 218, r, s = null) {
  const n = t.scenario,
    i = t.cashflows,
    a = [
      ["เงินลงทุน", n.initial_investment],
      ["ค่า O&M", i.reduce((v, y) => v + y.om_cost, 0)],
      ["ค่าใช้จ่ายอื่น", i.reduce((v, y) => v + y.other_cost, 0)],
      ["เปลี่ยนอุปกรณ์", i.reduce((v, y) => v + y.replacement, 0)],
    ],
    o = a.reduce((v, y) => v + y[1], 0),
    l = r ?? 420,
    c = e,
    u = 105,
    h = c / 2,
    p = 69,
    d = 2 * Math.PI * p,
    f = [Ne, Jr, we, "#b1a7c3"];
  let m = `<circle cx="${u}" cy="${h}" r="${p}" fill="none" stroke="#ffffff0c" stroke-width="23"/><g class="donut">`,
    g = "",
    w = 0;
  return (
    a.forEach(([v, y], b) => {
      let E = o ? (y / o) * d : 0;
      const R = s != null && s !== b;
      ((m += `<circle class="seg" data-cost="${b}" tabindex="0" role="button" aria-label="ดูรายละเอียด ${v}" cx="${u}" cy="${h}" r="${p}" fill="none" stroke="${f[b]}" stroke-width="${s === b ? 30 : 23}" opacity="${R ? 0.35 : 1}" stroke-dasharray="${Math.max(0, E - 3)} ${d - Math.max(0, E - 3)}" stroke-dashoffset="${-w}" transform="rotate(-90 ${u} ${h})"><title>${v} ${k(y)} บาท (${k(o ? (y / o) * 100 : 0, 1)}%)</title></circle>`),
        (w += E));
      const O = (c - 114) / 2 + b * 38;
      g +=
        `<g class="cost-row${s === b ? " on" : ""}" data-cost="${b}" opacity="${R ? 0.5 : 1}"><rect x="204" y="${O - 15}" width="${l - 210}" height="30" rx="8" fill="${s === b ? "#ffffff10" : "transparent"}"/><circle cx="214" cy="${O}" r="4" fill="${f[b]}"/>` +
        N(226, O + 3, v, 'style="font-size:10px"') +
        N(l - 19, O + 3, k(o ? (y / o) * 100 : 0, 1) + "%", 'text-anchor="end" class="value"') +
        "</g>";
    }),
    (m +=
      "</g>" +
      g +
      N(u, h - 5, k(o / 1e6, 2), 'text-anchor="middle" style="font-size:25px;fill:#e6eef8"') +
      N(u, h + 17, "ล้านบาท", 'text-anchor="middle" style="font-size:9px"')),
    Je(l, c, "องค์ประกอบต้นทุนตลอดอายุโครงการ ไม่คิดลด", m)
  );
}
function $i(t, e = "npv", r = 235, s) {
  const n = s ?? 420,
    i = r,
    a = 100,
    o = 40,
    l = 28,
    c = 32,
    u =
      e === "recovery"
        ? t.flatMap((g) => [g.result.payback, g.result.discounted_payback].filter((w) => w != null))
        : t.map((g) => (e === "irr" ? (g.result.irr ?? 0) * 100 : g.result.npv / 1e6)),
    h = e === "recovery" ? 0 : Math.min(0, ...u),
    p = Math.max(1, ...u) * 1.2,
    d = (g) => a + ((g - h) / (p - h)) * (n - a - o);
  let f = "";
  for (let g = 0; g < 4; g++) {
    let w = h + ((p - h) * g) / 3;
    f += ae(d(w), l, d(w), i - c) + N(d(w), i - 12, k(w, 1), 'text-anchor="middle"');
  }
  f +=
    ae(d(0), l, d(0), i - c, "#9cb2c04d") +
    N(
      a,
      12,
      e === "recovery" ? "ปี" : e === "irr" ? "IRR · %" : "NPV · ล้านบาท",
      'class="axis-label"',
    );
  const m = (i - l - c) / t.length;
  return (
    t.forEach((g, w) => {
      let v = l + (w + 0.5) * m,
        y = g.result;
      if (
        ((f +=
          `<rect class="hit" data-pick="${w}" x="4" y="${K(v - m / 2)}" width="${n - 8}" height="${K(m)}" rx="6" fill="transparent"/>` +
          N(a - 9, v + 3, g.short, 'text-anchor="end" style="font-size:10px"')),
        e === "recovery")
      ) {
        let b = y.payback,
          E = y.discounted_payback;
        (b != null &&
          E != null &&
          (f += ae(d(b), v, d(E), v, "#9bb4ca55", 'stroke-width="5" stroke-linecap="round"')),
          [
            [b, Ne, -10],
            [E, we, 21],
          ].forEach(([R, O, D]) => {
            R != null &&
              (f +=
                `<circle cx="${d(R)}" cy="${v}" r="5" fill="${O}"><title>${g.name}: ${k(R, 2)} ปี</title></circle>` +
                N(d(R), v + D, k(R, 2), `text-anchor="middle" style="fill:${O};font-size:10px"`));
          }),
          (b == null || E == null) &&
            (f += N(
              n - o,
              v + 4,
              b == null && E == null ? "ไม่คืนทุน" : "บางแบบไม่คืนทุน",
              'text-anchor="end" style="font-size:9px"',
            )));
      } else {
        const b = e === "irr" ? y.irr : y.npv,
          E = e === "irr" ? (b ?? 0) * 100 : b / 1e6;
        f +=
          `<rect data-pick="${w}" class="bar h${E < 0 ? " rev" : ""}" x="${Math.min(d(0), d(E))}" y="${v - 11}" width="${Math.max(1, Math.abs(d(E) - d(0)))}" height="23" rx="7" fill="${ki[w]}"><title>${g.name}: ${b == null ? "คำนวณไม่ได้" : k(E, 2)}</title></rect>` +
          N(
            E >= 0 ? d(E) + 7 : d(E) - 7,
            v + 4,
            b == null ? "—" : k(E, 2),
            `text-anchor="${E >= 0 ? "start" : "end"}" class="value" style="font-size:11px"`,
          );
      }
    }),
    Je(n, i, `เปรียบเทียบ ${e} ของทั้งสามโครงการตัวอย่าง`, f)
  );
}
function ql(t, e) {
  return t.projects.map((r, s) => ({
    owner: e,
    id: r.id,
    product: r.product,
    name: r.name,
    scenario: r.scenario,
    position: s,
  }));
}
function Fl(t, e) {
  return {
    owner: e,
    selected: t.selected,
    active: t.active,
  };
}
function Hl(t, e) {
  const r = [...t]
      .sort((a, o) => a.position - o.position)
      .map((a) => ({
        id: a.id,
        product: a.product,
        name: a.name,
        scenario: a.scenario,
      })),
    s = r.filter((a) =>
      dn({
        version: 1,
        selected: a.product,
        projects: [a],
        active: Object.fromEntries(ye.map((o) => [o, o === a.product ? a.id : null])),
      }),
    ),
    n = Object.fromEntries(
      ye.map((a) => {
        const o = e?.active?.[a],
          l = s.some((c) => c.product === a && c.id === o);
        return [a, l ? o : (s.find((c) => c.product === a)?.id ?? null)];
      }),
    );
  return {
    state: {
      version: 1,
      selected: ye.includes(e?.selected) ? e.selected : ye[0],
      projects: s,
      active: n,
    },
    dropped: r.length - s.length,
  };
}
function Wl(t, e) {
  const r = new Set(e.projects.map((s) => s.id));
  return [...t].filter((s) => !r.has(s));
}
const MODE_KEY = "egat-v4-mode",
  J = (t) => document.querySelector(t);
async function Vl(t) {
  const e = new URL(location.href);
  if (e.searchParams.has("demo")) {
    try {
      sessionStorage.setItem(MODE_KEY, "demo");
    } catch {}
    return (
      e.searchParams.delete("demo"),
      history.replaceState(null, "", e.pathname + e.search + e.hash),
      {
        mode: "demo",
      }
    );
  }
  if (t) {
    const { data: r } = await t.auth.getSession();
    if (r.session)
      return {
        mode: "cloud",
        user: r.session.user,
      };
  }
  try {
    if (sessionStorage.getItem(MODE_KEY) === "demo")
      return {
        mode: "demo",
      };
  } catch {}
  return new Promise((r) => Kl(t, r));
}
function Kl(t, e) {
  const r = J("#auth-gate"),
    s = J("#auth-form"),
    n = J("#auth-message"),
    i = J("#auth-submit");
  let a = !1;
  const o = (u, h = "error") => {
      ((n.textContent = u), (n.dataset.kind = h));
    },
    l = (u) => {
      ((a = u),
        (J("#auth-title").textContent = u ? "สมัครบัญชีใหม่" : "เข้าสู่ระบบ"),
        (i.textContent = u ? "สมัครบัญชี →" : "เข้าสู่ระบบ →"),
        (J("#auth-switch").textContent = u
          ? "มีบัญชีแล้ว? เข้าสู่ระบบ"
          : "ยังไม่มีบัญชี? สมัครใหม่"),
        (J("#auth-password").autocomplete = u ? "new-password" : "current-password"),
        o(""));
    },
    c = (u) => {
      ((r.hidden = !0), document.body.classList.remove("gated"), e(u));
    };
  ((r.hidden = !1),
    document.body.classList.add("gated"),
    (J("#auth-switch").onclick = () => l(!a)),
    (J("#auth-demo").onclick = () => {
      try {
        sessionStorage.setItem(MODE_KEY, "demo");
      } catch {}
      c({
        mode: "demo",
      });
    }),
    (s.onsubmit = async (u) => {
      if ((u.preventDefault(), !t)) return;
      const h = J("#auth-email").value.trim(),
        p = J("#auth-password").value;
      if (!/^\S+@\S+\.\S+$/.test(h)) return o("กรุณากรอกอีเมลให้ถูกต้อง");
      if (p.length < 8) return o("รหัสผ่านอย่างน้อย 8 ตัวอักษร");
      ((i.disabled = !0), o(a ? "กำลังสมัคร…" : "กำลังเข้าสู่ระบบ…", "info"));
      try {
        if (a) {
          const { data: d, error: f } = await t.auth.signUp({
            email: h,
            password: p,
            options: {
              emailRedirectTo: location.origin + "/app",
            },
          });
          if (f) throw f;
          if (d.session)
            return c({
              mode: "cloud",
              user: d.session.user,
            });
          (l(!1), o("ส่งอีเมลยืนยันแล้ว · กดลิงก์ในอีเมล แล้วกลับมาเข้าสู่ระบบ", "info"));
        } else {
          const { data: d, error: f } = await t.auth.signInWithPassword({
            email: h,
            password: p,
          });
          if (f) throw f;
          c({
            mode: "cloud",
            user: d.user,
          });
        }
      } catch (d) {
        o(zl(d));
      } finally {
        i.disabled = !1;
      }
    }),
    l(!1),
    t
      ? J("#auth-email").focus()
      : (s.querySelectorAll("input, button").forEach((u) => {
          u.disabled = !0;
        }),
        (J("#auth-switch").disabled = !0),
        o("ยังไม่ได้ตั้งค่า Supabase ในเครื่องนี้ · ใช้โหมดทดลองได้", "info")));
}
function zl(t) {
  const e = String(t?.message || "");
  return /invalid login credentials/i.test(e)
    ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
    : /email not confirmed/i.test(e)
      ? "ยังไม่ได้ยืนยันอีเมล · ตรวจกล่องจดหมายของคุณ"
      : /already registered/i.test(e)
        ? "อีเมลนี้มีบัญชีแล้ว · ลองเข้าสู่ระบบแทน"
        : /rate limit/i.test(e)
          ? "ส่งคำขอบ่อยเกินไป · รอสักครู่แล้วลองใหม่"
          : /fetch|network/i.test(e)
            ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ · ตรวจการเชื่อมต่ออินเทอร์เน็ต"
            : `ทำรายการไม่สำเร็จ · ${e}`;
}
function sn(t, e) {
  ((document.body.dataset.mode = t ? "cloud" : "demo"),
    (J("#account-label").textContent = t ? t.email : "โหมดทดลอง · ไม่ได้เข้าสู่ระบบ"));
  const r = J("#account-action");
  ((r.textContent = t ? "ออกจากระบบ" : "เข้าสู่ระบบ / สมัคร"),
    (r.onclick = async () => {
      try {
        sessionStorage.removeItem(MODE_KEY);
      } catch {}
      (t && e && (await e.auth.signOut()), location.reload());
    }),
    (J("#account").hidden = !1));
  const s = J(".sample-tag");
  s && (s.textContent = t ? "ข้อมูลของบัญชีนี้" : "ข้อมูลสมมติ");
}
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY),
  Fe = (t) => {
    const e = document.querySelector("#local-status");
    e && (e.textContent = t);
  };
function nn() {
  let t = hn(),
    e = !0;
  try {
    const r = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("egat-bento-v3-project-workspace"),
    );
    dn(r) && (t = r);
  } catch {
    e = !1;
  }
  return {
    mode: "demo",
    state: t,
    save(r) {
      try {
        (localStorage.setItem(STORAGE_KEY, JSON.stringify(r)), (e = !0));
      } catch {
        e = !1;
      }
      Fe(
        e ? "● โหมดทดลอง · บันทึกในเบราว์เซอร์นี้" : "เฉพาะรอบนี้ · เบราว์เซอร์ไม่อนุญาตให้บันทึก",
      );
    },
  };
}
async function Yl(t) {
  Fe("กำลังโหลดข้อมูลจากคลาวด์…");
  const [e, r] = await Promise.all([
    supabase
      .from("client_projects")
      .select("id, product, name, scenario, position")
      .order("position"),
    supabase.from("workspace_settings").select("selected, active").maybeSingle(),
  ]);
  if (e.error) throw e.error;
  if (r.error) throw r.error;
  let s = new Set(e.data.map((d) => d.id));
  const n = e.data.length === 0 && !r.data,
    { state: i, dropped: a } = n
      ? {
          state: hn(),
          dropped: 0,
        }
      : Hl(e.data, r.data);
  let o = null,
    l = null,
    c = Promise.resolve();
  async function u(d) {
    const f = ql(d, t.id);
    if (f.length) {
      const { error: w } = await supabase.from("client_projects").upsert(f, {
        onConflict: "owner,id",
      });
      if (w) throw w;
    }
    const m = Wl(s, d);
    if (m.length) {
      const { error: w } = await supabase
        .from("client_projects")
        .delete()
        .eq("owner", t.id)
        .in("id", m);
      if (w) throw w;
    }
    const { error: g } = await supabase.from("workspace_settings").upsert(Fl(d, t.id));
    if (g) throw g;
    s = new Set(d.projects.map((w) => w.id));
  }
  function h() {
    if ((clearTimeout(o), (o = null), !l)) return c;
    const d = l;
    return (
      (l = null),
      (c = c
        .then(() => u(d))
        .then(
          () => Fe(l ? "กำลังบันทึก…" : "● บันทึกบนคลาวด์แล้ว"),
          () => {
            ((l = l ?? d), Fe("บันทึกไม่สำเร็จ · จะลองใหม่เมื่อแก้ไขครั้งถัดไป"));
          },
        )),
      c
    );
  }
  (addEventListener("visibilitychange", () => {
    document.visibilityState === "hidden" && h();
  }),
    addEventListener("beforeunload", (d) => {
      (l || o) && (h(), d.preventDefault());
    }));
  const p = {
    mode: "cloud",
    state: i,
    save(d) {
      ((l = structuredClone(d)), Fe("กำลังบันทึก…"), clearTimeout(o), (o = setTimeout(h, 600)));
    },
  };
  return (
    n
      ? p.save(i)
      : Fe(a ? `● โหลดแล้ว · ข้าม ${a} รายการที่ข้อมูลไม่ถูกต้อง` : "● บันทึกบนคลาวด์แล้ว"),
    p
  );
}
async function Xl() {
  const t = await Vl(supabase);
  if (t.mode === "demo") return (sn(null, supabase), nn());
  sn(t.user, supabase);
  try {
    return await Yl(t.user);
  } catch (e) {
    return (console.error(e), Fe("โหลดข้อมูลคลาวด์ไม่สำเร็จ · กำลังเปิดโหมดทดลอง"), nn());
  }
}
const _ = (t) => document.querySelector(t),
  Ql = {
    overview:
      '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    products: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    charts: '<path d="M4 20V9m8 11V4m8 16v-7M2 21h20"/>',
    inputs:
      '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/>',
    cashflow: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M10 10v10"/>',
    compare: '<path d="M4 4v16h6V4H4Zm10 5v11h6V9h-6Z"/>',
  },
  Wr = [
    ["overview", "ภาพรวม", "YOUR ENERGY. A CLEARER PICTURE."],
    ["charts", "สำรวจกราฟ", "THE STORY BEHIND YOUR NUMBERS."],
    ["inputs", "สมมติฐาน", "SMALL CHANGES. NEW POSSIBILITIES."],
    ["cashflow", "กระแสเงินสด", "EVERY YEAR. EVERY CASH FLOW."],
    ["compare", "เปรียบเทียบ", "EXPLORE YOUR POSSIBILITIES."],
  ],
  $e = [
    {
      id: "solar",
      name: "Solar PPA",
      short: "Solar PPA",
      icon: "☀",
      source: "demo-solar",
      desc: "ใช้พลังงานแสงอาทิตย์ผ่านรูปแบบสัญญาซื้อขายไฟฟ้า",
      flow: "แสงอาทิตย์ <span>···→</span> โหลด",
      kind: "SUNLIGHT, PUT TO WORK",
    },
    {
      id: "hybrid",
      name: "Solar + Battery",
      short: "Solar + Batt.",
      icon: "◈",
      source: "demo-hybrid",
      desc: "ผสานการผลิตและกักเก็บพลังงาน เพื่อการใช้งานที่ยืดหยุ่น",
      flow: "ผลิต <span>···→</span> เก็บ <span>···→</span> ใช้",
      kind: "BETTER, TOGETHER",
    },
    {
      id: "battery",
      name: "Battery",
      short: "Battery",
      icon: "ϟ",
      source: "demo-bess",
      desc: "เก็บไฟช่วง Off-peak แล้วใช้ในช่วง Peak ตามรูปแบบการใช้งาน",
      flow: "โครงข่าย <span>···→</span> เก็บ <span>···→</span> ใช้",
      kind: "STORE NOW. USE WISELY.",
    },
  ],
  ze = (t) =>
    String(t).replace(
      /[&<>"']/g,
      (e) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[e],
    ),
  Fn = await Xl();
let B = Fn.state,
  L = B.selected,
  W = "overview",
  Ye = "annual",
  Oe = 0.2,
  Mt = {
    simple: !0,
    discount: !0,
  };
const be = Object.fromEntries($e.map((t) => [t.id, null]));
$e.forEach((t) =>
  Object.defineProperty(be, t.id, {
    get: () => Ge(B, t.id)?.scenario ?? Ht(t.id),
    set: (e) => {
      const r = Ge(B, t.id);
      r && ((r.scenario = e), Xe());
    },
  }),
);
const Q = () => Ge(B, L),
  Pe = () => evaluateScenario(be[L]),
  ve = () => $e.find((t) => t.id === L);
function Xe() {
  ((B.selected = L), Fn.save(B));
}
const vr = (t) => (t == null ? "ยังไม่คืนทุน" : k(t, 2)),
  Zl = (t) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Ql[t]}</svg>`;
_("#rail-menu").innerHTML = Wr.map(
  ([t, e]) =>
    `<button class="rail-button" data-page="${t}" title="${e}" aria-label="${e}">${Zl(t)}<span>${e}</span></button>`,
).join("");
const ec = [],
  an = {};
let Vr = [],
  mt = null,
  pt = null,
  je = !0;
const Bt = {};
function Ce() {
  if (
    (uc(),
    dc(),
    (_("#active-project-label").textContent =
      ve().name + " / " + (Q()?.name ?? "ยังไม่มีโครงการลูกค้า")),
    (_("#context-project").textContent = Q()?.name ?? "ยังไม่มีโครงการ"),
    (_("#context-title").textContent = ve().name),
    (_("#context-icon").textContent = ve().icon),
    (_("#edit-project").disabled = !Q()),
    (_("#export").disabled = !Q()),
    (_("#reset").disabled = !Q()),
    !Q())
  ) {
    ((_("#context-assumptions").innerHTML =
      "<h3>พร้อมเริ่มโครงการใหม่</h3><p>เพิ่มลูกค้าเพื่อกำหนดสมมติฐานของคุณ</p>"),
      (_("#context-recovery").innerHTML = ""));
    return;
  }
  const t = Pe(),
    e = be[L];
  ((_("#context-title").textContent = ve().name),
    (_("#context-icon").textContent = ve().icon),
    document.querySelectorAll("[data-solution]").forEach((r) => {
      (r.classList.toggle("active", r.dataset.solution === L),
        r.setAttribute("aria-pressed", String(r.dataset.solution === L)));
    }),
    (_("#context-assumptions").innerHTML =
      `<h3>สมมติฐานโครงการ <button class="text-button" data-go-inputs>แก้ไข ↗</button></h3><div class="context-row"><span>เงินลงทุนเริ่มต้น</span><b>${k(e.initial_investment / 1e6, 2)} ล้านบาท</b></div><div class="context-row"><span>อายุโครงการ</span><b>${e.project_life} ปี</b></div><div class="context-row"><span>อัตราคิดลด</span><b>${k(e.discount_rate * 100, 1)}%</b></div><div class="context-row"><span>รายได้ปีแรก</span><b>${k(e.revenue_y1 / 1e6, 2)} ล้านบาท</b></div>`),
    (_("#context-recovery").innerHTML =
      `<h3>จุดคืนทุน <span class="chip">BREAK-EVEN</span></h3><div class="recovery-item"><small>แบบปกติ</small><strong>${vr(t.payback)}${t.payback == null ? "" : "<em>ปี</em>"}</strong></div><div class="recovery-item mint"><small>แบบคิดลด · ${k(e.discount_rate * 100, 1)}%</small><strong>${vr(t.discounted_payback)}${t.discounted_payback == null ? "" : "<em>ปี</em>"}</strong></div><p style="font-size:9px;line-height:1.9">ประมาณปีแรกที่กระแสเงินสดสะสมแตะศูนย์${t.break_even.simpleFallsBelowAgain || t.break_even.discountedFallsBelowAgain ? " · บางปีหลังคืนทุนกลับมาติดลบ โปรดดูค่าเปลี่ยนอุปกรณ์" : ""}</p>`),
    (_("#context-assumptions [data-go-inputs]").onclick = () => Ue("inputs")));
}
function Zr(t) {
  const e = yr(t, L === "solar"),
    r = e.saving,
    s = t.scenario.discount_rate,
    n = t.irr,
    i = t.lcoe,
    a = n == null ? null : (n - s) * 100;
  return `<div class="metric-grid"><article class="card metric-card"><div class="metric-label">มูลค่าปัจจุบันสุทธิ <span>NPV ↗</span></div><div class="metric-value">${k(t.npv / 1e6, 2)}<em>ล้านบาท</em></div><div class="metric-note ${t.npv >= 0 ? "positive" : "negative"}">${t.npv >= 0 ? "มูลค่าสุทธิสูงกว่าเงินลงทุน" : "มูลค่าสุทธิต่ำกว่าเงินลงทุน"}</div><div class="metric-footer"><span>คิดลดที่ ${k(s * 100, 1)}%</span><span>${t.scenario.project_life} ปี</span></div></article><article class="card metric-card"><div class="metric-label">อัตราผลตอบแทน <span>IRR</span></div><div class="metric-value">${n == null ? "—" : k(n * 100, 2)}<em>%</em></div><div class="metric-note ${a != null && a > 0 ? "positive" : "negative"}">${a == null ? "คำนวณ IRR ไม่ได้" : `${a >= 0 ? "+" : ""}${k(a, 2)} จุดเปอร์เซ็นต์ เทียบเกณฑ์`}</div><div class="irr-compare"><i style="height:${Math.max(2, Math.min(30, (n ?? 0) * 120))}px" title="IRR ${n == null ? "คำนวณไม่ได้" : k(n * 100, 2) + "%"}"></i><i style="height:${Math.max(2, Math.min(30, s * 120))}px" title="เกณฑ์ ${k(s * 100, 2)}%"></i><span style="font-size:8px;color:#8fa8bf;margin:0 0 3px 3px">IRR / เกณฑ์</span></div></article><article class="card metric-card"><div class="metric-label">จุดคุ้มทุน <span>Break-even</span></div><div class="metric-value">${t.payback == null ? "—" : k(t.payback, 2)}<em>${t.payback == null ? "ไม่คืนทุนในอายุโครงการ" : "ปี"}</em></div><div class="metric-note">คิดลด ${t.discounted_payback == null ? "ไม่คืนทุนในอายุโครงการ" : k(t.discounted_payback, 2) + " ปี"}</div><div class="metric-footer"><span>จากกระแสเงินสดสะสม</span></div></article><article class="card metric-card"><div class="metric-label">ต้นทุนพลังงานเฉลี่ย <span>LCOE</span></div><div class="metric-value">${i == null ? "—" : k(i, 2)}<em>บาท/kWh</em></div><div class="metric-note">PV ต้นทุน / PV พลังงาน</div><div class="metric-footer"><span>ตามสมมติฐานของตัวอย่าง</span></div></article><article class="card metric-card"><div class="metric-label">ประหยัดฝั่งลูกค้า / ปี <span>SAVING</span></div>${r > 0 ? `<div class="metric-value">${k(r)}<em>บาท</em></div><div class="metric-note positive">▲ ${e.kind === "ppa" ? "PPA ถูกกว่าไฟกริด" : "จาก peak shaving"}</div><div class="metric-footer"><span>${e.source}</span></div>` : `<div class="metric-value">—</div><div class="metric-note">${e.kind === "ppa" ? "ราคา PPA ไม่ต่ำกว่าค่าไฟกริด" : "ไม่มีผลประหยัด"}</div><div class="metric-footer"><span>${e.source}</span></div>`}</article></div>`;
}
const qt = {
    cumulative: "กระแสเงินสดและจุดคืนทุน",
    annual: "กระแสเงินสดสุทธิรายปี",
    savings: "ผลประหยัดค่าไฟ",
    sensitivity: "ความอ่อนไหวของ NPV",
    costs: "องค์ประกอบต้นทุน",
    npv: "เปรียบเทียบ NPV",
    irr: "เปรียบเทียบ IRR",
    recovery: "เปรียบเทียบจุดคืนทุน",
  },
  tc = {
    cumulative: "สองมุมมองของการคืนทุน · หน่วย: ล้านบาท",
    annual: "กระแสเงินสดปีที่ 1 เป็นต้นไป · ไม่รวมเงินลงทุนปี 0",
    savings: "ส่วนต่างค่าไฟ Peak / Off-peak",
    sensitivity: "เปลี่ยนทีละตัวแปร โดยคงสมมติฐานอื่น",
    costs: "ต้นทุนรวมตลอดอายุโครงการ · ไม่คิดลด",
    npv: "มูลค่าปัจจุบันสุทธิ · ล้านบาท",
    irr: "เทียบอัตราผลตอบแทน · %",
    recovery: "จุดคืนทุนปกติและคิดลด · ปี",
  };
function kr() {
  return $e
    .filter((t) => Ge(B, t.id))
    .map((t) => ({
      ...t,
      projectName: Ge(B, t.id).name,
      result: evaluateScenario(be[t.id]),
    }));
}
function es(t, e, r) {
  const s = Pe();
  return t === "cumulative"
    ? Si(s, Mt, e, r)
    : t === "annual"
      ? Ei(s, e, r, mt)
      : t === "savings"
        ? Ti(s, Ye, L === "solar", e, r)
        : t === "sensitivity"
          ? Ai(s, Oe, e, r)
          : t === "costs"
            ? Ri(s, e, r, pt)
            : $i(kr(), t, e, r);
}
function Hn(t) {
  return t === "cumulative"
    ? `<div class="legend"><button data-line="simple" aria-pressed="${Mt.simple}"><i></i>สะสมปกติ</button><button data-line="discount" aria-pressed="${Mt.discount}"><i class="dash"></i>สะสมคิดลด</button></div>`
    : t === "sensitivity"
      ? `<div class="legend"><span><i></i>สมมติฐาน −${Oe * 100}%</span><span><i class="mint"></i>สมมติฐาน +${Oe * 100}%</span></div>`
      : t === "recovery"
        ? '<div class="legend"><span><i></i>ปกติ</span><span><i class="mint"></i>คิดลด</span></div>'
        : t === "annual"
          ? '<div class="legend"><span><i class="blue"></i>กระแสเงินสดบวก</span><span><i></i>กระแสเงินสดลบ</span></div>'
          : "";
}
function Wn(t) {
  return t === "cumulative"
    ? "จุดบนเส้นศูนย์ = คืนทุนครั้งแรก · คำนวณเศษปีแบบเส้นตรง รวมมูลค่าซาก"
    : t === "savings"
      ? L === "solar"
        ? "สมมติไฟโซลาร์ใช้แทนไฟกริดช่วง Peak · ราคา PPA = รายได้ปีแรก ÷ พลังงานปีแรก · ไม่รวม demand charge และภาษี"
        : "แบบจำลองส่วนต่างค่าไฟ ไม่รวมประสิทธิภาพแบตเตอรี่ การเสื่อม และ demand charge"
      : t === "sensitivity"
        ? `เส้นกลาง = ΔNPV 0 · เปรียบเทียบกับฐาน ${k(Pe().npv / 1e6, 2)} ล้านบาท`
        : t === "costs"
          ? "ไม่หักมูลค่าซาก และไม่ใช่กราฟกระแสเงินสด"
          : ["npv", "irr", "recovery"].includes(t)
            ? "โครงการตัวอย่างมีขนาดและอายุต่างกัน ไม่ใช่การจัดอันดับผลิตภัณฑ์"
            : "วางเมาส์บนแท่งเพื่อดูยอดรายปี · รวมค่าเปลี่ยนอุปกรณ์และมูลค่าซากตามสมมติฐาน";
}
function Vn(t) {
  return t === "savings"
    ? `<div class="chart-control"><button data-saving="annual" class="${Ye === "annual" ? "active" : ""}">รายปี</button><button data-saving="cumulative" class="${Ye === "cumulative" ? "active" : ""}">สะสม</button></div>`
    : t === "annual"
      ? `<div class="chart-control">${[
          [5, "5 ปี"],
          [10, "10 ปี"],
          [null, "ทั้งโครงการ"],
        ]
          .map(
            ([e, r]) =>
              `<button data-years="${e ?? "all"}" class="${mt === e ? "active" : ""}" aria-pressed="${mt === e}">${r}</button>`,
          )
          .join("")}</div>`
      : t === "sensitivity"
        ? `<div class="chart-control">${[0.1, 0.2, 0.3].map((e) => `<button data-range="${e}" class="${e === Oe ? "active" : ""}">±${e * 100}%</button>`).join("")}</div>`
        : "";
}
function rc(t) {
  const e = t.scenario,
    r = t.cashflows,
    s = (c) => r.reduce((u, h) => u + h[c], 0),
    n = [
      [
        "เงินลงทุน",
        e.initial_investment,
        [
          ["จ่ายครั้งเดียว", "ปี 0"],
          ["ต่อปีของอายุโครงการ", k(e.initial_investment / e.project_life) + " บาท"],
        ],
      ],
      [
        "ค่า O&M",
        s("om_cost"),
        [
          ["ปีแรก", k(e.om_y1) + " บาท"],
          ["เติบโต", k((e.om_growth ?? 0) * 100, 1) + "% ต่อปี"],
          ["ปีสุดท้าย", k(r.at(-1).om_cost) + " บาท"],
        ],
      ],
      [
        "ค่าใช้จ่ายอื่น",
        s("other_cost"),
        [
          ["ปีแรก", k(e.other_y1) + " บาท"],
          ["เติบโต", k((e.other_growth ?? 0) * 100, 1) + "% ต่อปี"],
          ["ปีสุดท้าย", k(r.at(-1).other_cost) + " บาท"],
        ],
      ],
      [
        "เปลี่ยนอุปกรณ์",
        s("replacement"),
        e.replacement_year
          ? [
              ["ปีที่เปลี่ยน", "ปี " + e.replacement_year],
              ["ค่าใช้จ่าย", k(e.replacement_cost) + " บาท"],
            ]
          : [["ตามสมมติฐาน", "ไม่มีการเปลี่ยนอุปกรณ์"]],
      ],
    ],
    i = n.reduce((c, u) => c + u[1], 0);
  if (pt == null)
    return '<p class="cost-hint">กดที่วงกลมหรือรายการ เพื่อดูรายละเอียดแต่ละต้นทุน</p>';
  const [a, o, l] = n[pt];
  return `<div class="cost-detail"><div class="cost-detail-head"><b>${a}</b><button data-cost-close aria-label="ปิดรายละเอียด">×</button></div><div class="cost-detail-total">${k(o)} <small>บาท · ${k(i ? (o / i) * 100 : 0, 1)}% ของต้นทุนทั้งหมด</small></div><dl>${l.map(([c, u]) => `<div><dt>${c}</dt><dd>${u}</dd></div>`).join("")}</dl></div>`;
}
const Kn = new Set(["cumulative", "annual", "savings", "sensitivity", "npv", "recovery", "irr"]),
  sc = {
    cumulative: "กดที่ปีใดก็ได้บนกราฟ เพื่อดูยอดสะสมของปีนั้น",
    annual: "กดที่แท่งของปีใดก็ได้ เพื่อดูรายได้และค่าใช้จ่ายของปีนั้น",
    savings: "กดที่แท่งหรือปี เพื่อดูรายละเอียดค่าไฟ",
    sensitivity: "กดที่แถวสมมติฐาน เพื่อดู NPV เมื่อปรับค่าขึ้นและลง",
    npv: "กดที่ผลิตภัณฑ์ เพื่อดูตัวเลขของโครงการ",
    recovery: "กดที่ผลิตภัณฑ์ เพื่อดูตัวเลขของโครงการ",
    irr: "กดที่ผลิตภัณฑ์ เพื่อดูตัวเลขของโครงการ",
  },
  jr = (t) => (t == null ? "ไม่คืนทุนในอายุโครงการ" : k(t, 2) + " ปี");
function nc(t) {
  const e = Bt[t];
  if (e == null) return null;
  const r = Pe(),
    s = (a) => k(a) + " บาท";
  if (t === "cumulative") {
    const a = r.cashflows.find((o) => o.year === e);
    return a
      ? {
          title: "ปีที่ " + e,
          total: k(a.cumulative),
          unit: "บาท · กระแสเงินสดสะสมปกติ",
          facts: [
            ["สะสมคิดลด", s(a.discounted_cumulative)],
            ["กระแสเงินสดสุทธิปีนี้", s(a.net_cf)],
            ["มูลค่าปัจจุบันปีนี้", s(a.present_value)],
            ["สถานะ", a.cumulative >= 0 ? "คืนทุนแล้ว" : "ยังไม่คืนทุน"],
          ],
        }
      : null;
  }
  if (t === "annual") {
    const a = r.cashflows.find((o) => o.year === e && o.year > 0);
    return !a || (mt && e > mt)
      ? null
      : {
          title: "ปีที่ " + e,
          total: k(a.net_cf),
          unit: "บาท · กระแสเงินสดสุทธิ",
          facts: [
            ["รายได้ / ผลประหยัด", s(a.revenue)],
            ["ค่า O&M", s(a.om_cost)],
            ["ค่าใช้จ่ายอื่น", s(a.other_cost)],
            ["เปลี่ยนอุปกรณ์", s(a.replacement)],
            ["มูลค่าซาก", s(a.salvage)],
          ],
        };
  }
  if (t === "savings") {
    const a = yr(r, L === "solar");
    if (Ye === "cumulative") {
      const l = a.cumulative.find((c) => c.year === e);
      return l
        ? {
            title: "ผลประหยัดสะสมถึงปีที่ " + e,
            total: k(l.cumulative),
            unit: "บาท",
            facts: [
              ["ประหยัดต่อปี", s(l.saving)],
              ["ที่มา", a.source],
              ["อายุโครงการ", a.life + " ปี"],
            ],
          }
        : null;
    }
    if (e !== 0 && e !== 1) return null;
    const o = k(a.qty) + " kWh" + (a.kind === "ppa" ? " / ปี" : " / วัน");
    return {
      title: e ? a.afterTitle : a.beforeTitle,
      total: k(e ? a.after : a.before),
      unit: "บาท / ปี",
      facts: [
        [a.qtyLabel, o],
        [
          e
            ? a.kind === "ppa"
              ? "ราคา PPA"
              : "ค่าไฟ Off-peak"
            : a.kind === "ppa"
              ? "ค่าไฟกริด (Peak)"
              : "ค่าไฟ Peak",
          k(e ? a.rateAfter : a.rateBefore, 4) + " บาท/kWh",
        ],
        ["ประหยัดต่อปี", s(a.saving)],
      ],
    };
  }
  if (t === "sensitivity") {
    const a = pn(r, Oe)[e];
    return a
      ? {
          title: a.name + " ±" + Oe * 100 + "%",
          total: k(Math.abs(a.high - a.low), 2),
          unit: "ล้านบาท · ช่วงที่ NPV เปลี่ยน",
          facts: [
            ["NPV ฐาน", k(r.npv / 1e6, 2) + " ล้านบาท"],
            [
              "เมื่อ −" + Oe * 100 + "%",
              k(r.npv / 1e6 + a.low, 2) +
                " ล้านบาท (" +
                (a.low >= 0 ? "+" : "") +
                k(a.low, 2) +
                ")",
            ],
            [
              "เมื่อ +" + Oe * 100 + "%",
              k(r.npv / 1e6 + a.high, 2) +
                " ล้านบาท (" +
                (a.high >= 0 ? "+" : "") +
                k(a.high, 2) +
                ")",
            ],
          ],
        }
      : null;
  }
  const n = kr()[e];
  if (!n) return null;
  const i = n.result;
  return {
    title: n.name + " · " + ze(n.projectName),
    total:
      t === "irr"
        ? i.irr == null
          ? "—"
          : k(i.irr * 100, 2)
        : t === "recovery"
          ? jr(i.payback).replace(" ปี", "")
          : k(i.npv / 1e6, 2),
    unit:
      t === "irr"
        ? "% · IRR"
        : t === "recovery"
          ? i.payback == null
            ? ""
            : "ปี · คืนทุนปกติ"
          : "ล้านบาท · NPV",
    facts: [
      ["เงินลงทุน", k(i.scenario.initial_investment / 1e6, 2) + " ล้านบาท"],
      ["NPV", k(i.npv / 1e6, 2) + " ล้านบาท"],
      ["IRR", i.irr == null ? "—" : k(i.irr * 100, 2) + "%"],
      ["คืนทุนปกติ", jr(i.payback)],
      ["คืนทุนคิดลด", jr(i.discounted_payback)],
      ["การตัดสินใจ", i.decisionFinal.toUpperCase()],
    ],
  };
}
function zn(t) {
  const e = nc(t);
  return e
    ? `<div class="pick-slot"><div class="cost-detail pick-detail"><div class="cost-detail-head"><b>${e.title}</b><button data-pick-close aria-label="ปิดรายละเอียด">×</button></div><div class="cost-detail-total" data-count>${e.total} <small>${e.unit}</small></div><dl>${e.facts.map(([r, s]) => `<div><dt>${r}</dt><dd>${s}</dd></div>`).join("")}</dl></div></div>`
    : `<div class="pick-slot"><p class="cost-hint">${sc[t]}</p></div>`;
}
function Gn(t, e) {
  const r = Bt[e],
    s = t.querySelector("svg");
  s &&
    (s.classList.toggle("has-pick", r != null),
    t
      .querySelectorAll("[data-pick]")
      .forEach((n) => n.classList.toggle("picked", r != null && n.dataset.pick === String(r))));
}
function Et(t, e, r) {
  Bt[e] = r;
  const s = t.querySelector(".pick-slot");
  s && ((s.outerHTML = zn(e)), Qn(t.querySelector(".pick-slot")));
  const n = t.querySelector("[data-fit-chart]");
  n && Gn(n, e);
}
function ic(t) {
  (t.matches?.("[data-chart-card]") ? [t] : [...t.querySelectorAll("[data-chart-card]")]).forEach(
    (r) => {
      const s = r.dataset.chartCard;
      if (!Kn.has(s)) return;
      const n = r.querySelector("[data-fit-chart]");
      n &&
        ((n.tabIndex = 0),
        n.setAttribute("aria-label", qt[s] + " · กดหรือใช้ลูกศรซ้าย/ขวาเพื่อดูรายละเอียด"),
        r.addEventListener("click", (i) => {
          if (i.target.closest("[data-pick-close]")) {
            Et(r, s, null);
            return;
          }
          const a = i.target.closest("[data-pick]");
          if (!a || !n.contains(a)) return;
          const o = Number(a.dataset.pick);
          Et(r, s, Bt[s] === o ? null : o);
        }),
        n.addEventListener("keydown", (i) => {
          const a = [
            ...new Set([...n.querySelectorAll("[data-pick]")].map((l) => Number(l.dataset.pick))),
          ].sort((l, c) => l - c);
          if (!a.length) return;
          const o = a.indexOf(Bt[s]);
          i.key === "ArrowRight" || i.key === "ArrowDown"
            ? (i.preventDefault(), Et(r, s, a[Math.min(a.length - 1, o + 1)]))
            : i.key === "ArrowLeft" || i.key === "ArrowUp"
              ? (i.preventDefault(), Et(r, s, a[Math.max(0, o < 0 ? 0 : o - 1)]))
              : i.key === "Escape" && Et(r, s, null);
        }));
    },
  );
}
function at(t, e = !0) {
  const r = _(`#content [data-chart-card="${t}"]`);
  if (!r) return xe();
  const s = document.createElement("div");
  s.innerHTML = se(t);
  const n = s.firstElementChild;
  (r.replaceWith(n), ts(n), Xn(n, e));
}
function se(t) {
  const e = Pe();
  let r = "";
  if (t === "savings") {
    const i = yr(e, L === "solar");
    r = `<div class="small-label">${Ye === "annual" ? "ผลประหยัดต่อปี" : "ผลประหยัดตลอดโครงการ"} · ${i.source}</div><div class="savings-total" data-count>${k(Ye === "annual" ? i.saving : (i.cumulative.at(-1)?.cumulative ?? 0))} <em>บาท</em></div>`;
  }
  t === "annual" &&
    (r = `<div class="cashflow-amount">${k(e.cashflows[1].net_cf / 1e6, 2)}<small>ล้านบาท · กระแสเงินสดสุทธิปีแรก</small></div>`);
  const s = Yn(t);
  return `<section class="card chart-card ${s.wide ? "chart-wide" : ""}" data-chart-card="${t}"><div class="card-head"><div><h3>${qt[t]}</h3><p>${t === "savings" && L === "solar" ? "ค่าไฟจากกริดเทียบกับค่าไฟตามสัญญา PPA" : tc[t]}</p>${Vn(t)}</div></div>${`<div class="chart-tools"><button class="chart-toggle" data-size-toggle="${t}" aria-expanded="${s.wide}" aria-label="${s.wide ? "ย่อ" : "ขยาย"}กราฟ ${qt[t]}">${s.wide ? "↙ ย่อกราฟ" : "↗ ขยายกราฟ"}</button></div>`}${r}<div class="chart-host resizable-chart" ${`style="height:${s.wide ? Ot(t).big : Ot(t).base}px" data-fit-chart="${t}"`}>${es(t)}</div>${t === "costs" ? rc(e) : ""}${Kn.has(t) && !0 ? zn(t) : ""}${Hn(t)}<p class="graph-note">${Wn(t)}</p></section>`;
}
function xe() {
  if ((Vr.forEach((n) => n.disconnect()), (Vr = []), !Q() && W !== "compare")) {
    ((_("#content").innerHTML =
      `<section class="empty-project card"><span>＋</span><h2>สร้างโครงการแรกของ ${ve().name}</h2><p>ใช้ปุ่ม “＋ เพิ่มโครงการลูกค้า” ใน sidebar เพื่อเริ่มต้น</p><button class="button" id="show-projects">ดู sidebar โครงการ ←</button></section>`),
      (_("#show-projects").onclick = () => {
        matchMedia("(max-width:900px)").matches
          ? _("#sidebar-open").click()
          : _("#project-tree .add-child").focus();
      }));
    return;
  }
  const t = Pe(),
    e = be[L];
  let r = "";
  if (
    (W === "overview" &&
      (r =
        `<section class="card scenario-hero"><div class="scenario-copy"><span class="eyebrow">YOUR ENERGY SCENARIO</span><h2>${ve().name} · ${ze(Q().name)}</h2><p>${ve().desc}</p><div class="scenario-meta"><span>อายุโครงการ <b>${e.project_life} ปี</b></span><span>อัตราคิดลด <b>${k(e.discount_rate * 100, 1)} %</b></span><span>รายได้ / ผลประหยัดปีแรก <b>${k(e.revenue_y1)} ฿</b></span></div></div><div class="scenario-invest"><small>เงินลงทุนเริ่มต้น</small><strong>${k(e.initial_investment)} ฿</strong><button class="chart-toggle" data-go-inputs>ปรับสมมติฐาน ↗</button></div></section>` +
        Zr(t) +
        `<div class="chart-stack">${se("cumulative")}${se("annual")}${se("sensitivity")}</div><div class="status-strip"><span>✧</span><div>${t.irr == null ? "ไม่สามารถสรุปเกณฑ์ IRR ได้" : t.irr > e.discount_rate ? "IRR สูงกว่าอัตราผลตอบแทนขั้นต่ำที่กำหนด" : "IRR ยังไม่สูงกว่าอัตราผลตอบแทนขั้นต่ำที่กำหนด"}</div><small>ผลจากสมมติฐาน · ไม่ใช่การรับประกัน</small></div>`),
    W === "charts" &&
      (r = `<p class="page-intro">กราฟใหญ่แสดงแถวละหนึ่งกราฟ · กด “ขยายกราฟ” เพื่อดูละเอียดขึ้น</p><div class="chart-stack">${se("cumulative")}${se("annual")}${se("sensitivity")}${se("savings")}${se("costs")}</div>`),
    W === "cashflow" &&
      (r = `<div class="full-chart">${se("annual")}</div><section class="card table-card cashflow-table ${je ? "" : "collapsed"}"><div class="card-head"><div><h3>ตารางกระแสเงินสด</h3><p>ปี 0 รวมเงินลงทุนเริ่มต้น · หน่วย: บาท · ${e.project_life + 1} แถว</p></div><div class="table-actions"><button class="chart-toggle" data-table-toggle aria-expanded="${je}">${je ? "↑ ย่อตาราง" : "↓ แสดงตาราง"}</button><button class="chart-toggle primary" data-table-csv>↓ ส่งออก CSV</button></div></div><div class="table-wrap"><table><thead><tr><th>ปี</th><th>รายได้</th><th>ต้นทุนดำเนินงาน</th><th>สุทธิ</th><th>สะสมปกติ</th><th>สะสมคิดลด</th></tr></thead><tbody>${t.cashflows
        .map((n) => {
          const i = t.payback != null && Math.ceil(t.payback) === n.year,
            a = t.discounted_payback != null && Math.ceil(t.discounted_payback) === n.year;
          return `<tr class="${i ? "simple-row" : ""} ${a ? "discount-row" : ""}"><td>${n.year}${i ? '<span class="table-badge">● ปกติ</span>' : ""}${a ? '<span class="table-badge mint-text">● คิดลด</span>' : ""}</td><td>${k(n.revenue)}</td><td>${k(n.om_cost + n.other_cost + n.replacement)}</td><td>${k(n.net_cf)}</td><td>${k(n.cumulative)}</td><td>${k(n.discounted_cumulative)}</td></tr>`;
        })
        .join(
          "",
        )}</tbody></table></div><p class="graph-note">ทำเครื่องหมายปีแรกที่ยอดสะสมไม่ติดลบ · การคืนทุนจริงในแบบจำลองอาจเกิดระหว่างปี · มูลค่าซากรวมในกระแสเงินสดสุทธิปีสุดท้าย</p></section>`),
    W === "compare")
  ) {
    const n = kr();
    r = `<p class="page-intro">เปรียบเทียบโครงการที่เลือกไว้ล่าสุดของแต่ละผลิตภัณฑ์ ชื่อลูกค้าระบุใต้ผลิตภัณฑ์แต่ละตัว</p><div class="compare-header">${n.map((i) => `<article class="compare-item"><span>${i.icon}</span><h3>${i.name}</h3><div class="comparison-project-name">${ze(i.projectName)}</div><p>${i.result.scenario.project_life} ปี · คิดลด ${k(i.result.scenario.discount_rate * 100, 1)}%</p><strong>${k(i.result.scenario.initial_investment / 1e6, 2)} <small>ล้านบาท / เงินลงทุน</small></strong></article>`).join("")}</div><div class="chart-stack compare-chart-grid">${se("npv")}${se("recovery")}${se("irr")}<section class="card compare-note"><div class="card-head"><div><h3>อ่านผลอย่างมีบริบท</h3><p>ต่างขนาด ต่างอายุ ต่างสมมติฐาน</p></div><span class="round-tag">✧</span></div><p style="font-size:12px;line-height:2;color:#a7bbd0">NPV แสดงมูลค่าปัจจุบันสุทธิ ส่วน IRR แสดงอัตราผลตอบแทน ควรพิจารณาคู่กับขนาดเงินลงทุน อายุโครงการ และจุดคืนทุน</p><p class="graph-note">ใช้สมมติฐานที่เทียบเคียงกันก่อนตัดสินใจเลือกโซลูชัน</p><div style="margin-top:25px"><button class="button primary" data-go-inputs>ปรับสมมติฐานโครงการ ↗</button></div></section></div><section class="card table-card"><div class="card-head"><h3>ตัวเลขเปรียบเทียบ</h3><span class="sample-tag">ข้อมูลสมมติ</span></div><div class="table-wrap"><table><thead><tr><th>ตัวชี้วัด</th>${n.map((i) => `<th>${i.name}</th>`).join("")}</tr></thead><tbody>${[
      [
        "การตัดสินใจ",
        (i) =>
          i.result.decisionFinal.toUpperCase() +
          " · " +
          ((i.result.scenario.decision_override ?? "auto") === "auto" ? "อัตโนมัติ" : "เลือกเอง"),
      ],
      ["NPV · ล้านบาท", (i) => k(i.result.npv / 1e6, 2)],
      ["IRR · %", (i) => (i.result.irr == null ? "—" : k(i.result.irr * 100, 2))],
      ["คืนทุนปกติ · ปี", (i) => vr(i.result.payback)],
      ["คืนทุนคิดลด · ปี", (i) => vr(i.result.discounted_payback)],
    ]
      .map(([i, a]) => `<tr><td>${i}</td>${n.map((o) => `<td>${a(o)}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div></section>`;
  }
  (W === "inputs" && (r = ac(e, t)), (_("#content").innerHTML = r));
  const s = _("#content .cashflow-table");
  (s &&
    ((s.querySelector("[data-table-toggle]").onclick = (n) => {
      ((je = !je),
        s.classList.toggle("collapsed", !je),
        (n.currentTarget.textContent = je ? "↑ ย่อตาราง" : "↓ แสดงตาราง"),
        n.currentTarget.setAttribute("aria-expanded", je));
    }),
    (s.querySelector("[data-table-csv]").onclick = () => _("#export").click())),
    document.querySelectorAll("[data-go-inputs]").forEach((n) => (n.onclick = () => Ue("inputs"))),
    W === "inputs" && oc(),
    ts(_("#content")),
    Xn(),
    pc(_("#content")),
    Qn(_("#content"), ".metric-value,.scenario-invest strong"));
}
const Jn = [
  ["initial_investment", "เงินลงทุนเริ่มต้น", "บาท", 1, 0, 1e9],
  ["project_life", "อายุโครงการ", "ปี", 1, 1, 40],
  ["discount_rate", "อัตราคิดลด", "%", 100, 0, 50],
  ["revenue_y1", "รายได้ / ผลประหยัดปีแรก", "บาท/ปี", 1, 0, 1e9],
  ["revenue_growth", "อัตราเติบโตของรายได้", "%/ปี", 100, 0, 20],
  ["om_y1", "ค่า O&M ปีแรก", "บาท/ปี", 1, 0, 1e8],
  ["other_y1", "ค่าใช้จ่ายอื่นปีแรก", "บาท/ปี", 1, 0, 1e8],
  ["salvage_value", "มูลค่าซาก", "บาท", 1, 0, 1e9],
  ["replacement_cost", "ค่าเปลี่ยนอุปกรณ์", "บาท", 1, 0, 1e9],
  ["replacement_year", "ปีที่เปลี่ยนอุปกรณ์ (0 = ไม่มี)", "ปี", 1, 0, 40],
  ["peak_rate", "ค่าไฟช่วง Peak", "บาท/kWh", 1, 0, 100],
  ["offpeak_rate", "ค่าไฟช่วง Off-peak", "บาท/kWh", 1, 0, 100],
  ["peak_energy_kwh_day", "พลังงานย้ายช่วงต่อวัน", "kWh", 1, 0, 1e6],
];
function ac(t, e) {
  return `<section class="card input-card"><h3>${ve().name} · ${ze(Q()?.name ?? "")}</h3><p>ทดลองปรับตัวเลข ผลลัพธ์จะอัปเดตโดยไม่แตะข้อมูลจริง</p><div class="form-grid">${Jn.filter(
    (r) => L !== "solar" || !["offpeak_rate", "peak_energy_kwh_day"].includes(r[0]),
  )
    .map(
      ([r, s, n, i, a, o]) =>
        `<label class="field">${s}<span class="input-wrap"><input aria-label="${s}" data-field="${r}" type="number" value="${Number((t[r] * i).toFixed(4))}" min="${a}" max="${o}" step="${r === "project_life" || r === "replacement_year" ? "1" : "any"}"><span>${n}</span></span></label>`,
    )
    .join(
      "",
    )}</div><p id="input-error" class="error" role="status"></p><div class="form-actions"><button class="button primary" id="apply">ดูภาพการลงทุน ↗</button><p>O&M และค่าใช้จ่ายอื่นเติบโต 1% ต่อปีตามตัวอย่าง<br>เก็บค่าแยกตามโครงการ ในเบราว์เซอร์นี้</p></div></section><div class="live-results" id="live-results">${Zr(e)}</div>`;
}
function oc() {
  const t = [..._("#content").querySelectorAll("[data-field]")];
  (t.forEach(
    (e) =>
      (e.oninput = () => {
        const r = {
          ...be[L],
        };
        let s = "";
        for (const n of t) {
          const [i, a, o, l, c, u] = Jn.find((p) => p[0] === n.dataset.field),
            h = Number(n.value);
          if (
            n.value === "" ||
            !Number.isFinite(h) ||
            h < c ||
            h > u ||
            ((i === "project_life" || i === "replacement_year") && !Number.isInteger(h))
          ) {
            s = `กรุณากรอก ${a} ระหว่าง ${c}–${u}`;
            break;
          }
          r[i] = h / l;
        }
        (!s &&
          r.replacement_year > r.project_life &&
          (s = "ปีที่เปลี่ยนอุปกรณ์ต้องไม่เกินอายุโครงการ"),
          (_("#input-error").textContent = s),
          (_("#apply").disabled = !!s),
          (_("#live-results").hidden = !!s),
          _("#decision-panel")
            .querySelectorAll("button")
            .forEach((n) => (n.disabled = !!s)),
          s || ((be[L] = r), (_("#live-results").innerHTML = Zr(Pe())), Ce()));
      }),
  ),
    (_("#apply").onclick = () => Ue("overview")));
}
function ts(t) {
  (ic(t),
    t.querySelectorAll("[data-expand]").forEach((s) => (s.onclick = () => lc(s.dataset.expand))),
    t.querySelectorAll("[data-range]").forEach(
      (s) =>
        (s.onclick = () => {
          ((Oe = Number(s.dataset.range)), at("sensitivity"));
        }),
    ),
    t.querySelectorAll("[data-saving]").forEach(
      (s) =>
        (s.onclick = () => {
          ((Ye = s.dataset.saving), at("savings"));
        }),
    ),
    t.querySelectorAll("[data-line]").forEach(
      (s) =>
        (s.onclick = () => {
          ((Mt[s.dataset.line] = !Mt[s.dataset.line]), at("cumulative"));
        }),
    ),
    t.querySelectorAll("[data-years]").forEach(
      (s) =>
        (s.onclick = () => {
          ((mt = s.dataset.years === "all" ? null : Number(s.dataset.years)), at("annual"));
        }),
    ));
  const e = (s, n = !1) => {
      ((pt = pt === s ? null : s),
        at("costs", !1),
        n &&
          _(`#content [data-chart-card="costs"] .seg[data-cost="${s}"]`)?.focus({
            preventScroll: !0,
          }));
    },
    r = t.matches?.('[data-chart-card="costs"]') ? t : t.querySelector('[data-chart-card="costs"]');
  (r &&
    ((r.onclick = (s) => {
      const n = s.target.closest("[data-cost]");
      n && e(Number(n.dataset.cost));
    }),
    (r.onkeydown = (s) => {
      const n = s.target.closest("[data-cost]");
      n &&
        (s.key === "Enter" || s.key === " ") &&
        (s.preventDefault(), e(Number(n.dataset.cost), !0));
    })),
    t.querySelectorAll("[data-cost-close]").forEach(
      (s) =>
        (s.onclick = () => {
          ((pt = null), at("costs", !1));
        }),
    ));
}
function lc(t) {
  ((_("#dialog-title").textContent = qt[t]),
    (_("#dialog-chart").innerHTML = Vn(t) + es(t) + Hn(t) + `<p class="graph-note">${Wn(t)}</p>`),
    ts(_("#dialog-chart")),
    _("#chart-dialog").open || _("#chart-dialog").showModal());
}
_("#chart-dialog .close-button").onclick = () => _("#chart-dialog").close();
_("#chart-dialog").addEventListener("click", (t) => {
  if (t.target === _("#chart-dialog")) {
    const e = t.target.getBoundingClientRect();
    (t.clientX < e.left || t.clientX > e.right || t.clientY < e.top || t.clientY > e.bottom) &&
      t.target.close();
  }
});
function Ue(t) {
  ((W = Wr.some((r) => r[0] === t) ? t : "overview"), (location.hash = W));
  const e = Wr.find((r) => r[0] === W);
  ((_("#page-title").innerHTML = (W === "overview" ? "ภาพรวมการลงทุน" : e[1]) + "<span>.</span>"),
    (_("#page-kicker").textContent = e[2]),
    document.querySelectorAll("[data-page]").forEach((r) => {
      (r.classList.toggle("active", r.dataset.page === W),
        r.dataset.page === W
          ? r.setAttribute("aria-current", "page")
          : r.removeAttribute("aria-current"));
    }),
    (document.body.dataset.view = W),
    Ft(),
    xe(),
    Qe(),
    window.scrollTo({
      top: 0,
      behavior: "instant",
    }),
    ar());
}
document.querySelectorAll("[data-page]").forEach((t) => (t.onclick = () => Ue(t.dataset.page)));
document.querySelector(".brand").onclick = (t) => {
  (t.preventDefault(), Ue("overview"));
};
_("#edit-project").onclick = () => Ue("inputs");
_("#print").onclick = () => window.print();
let on,
  Kr = null;
function yt(t, e = !1) {
  (clearTimeout(on),
    (_("#toast-message").textContent = t),
    (_("#undo-delete").hidden = !e),
    _("#toast").classList.add("show"),
    e || (on = setTimeout(() => _("#toast").classList.remove("show"), 3500)));
}
_("#undo-delete").onclick = () => {
  (bi(B, Kr), (L = B.selected), (Kr = null), Xe(), Ce(), xe(), yt("คืนโครงการแล้ว"));
};
_("#reset").onclick = () => {
  Q() && ((be[L] = Ht(L)), Ce(), xe(), yt("คืนค่าตัวอย่างของโครงการนี้แล้ว"));
};
_("#export").onclick = () => {
  const t = Pe(),
    e =
      W === "compare"
        ? [
            ["EGAT mockup — synthetic data"],
            [
              "Product",
              "Project",
              "Initial investment",
              "Life",
              "NPV",
              "IRR",
              "Simple payback",
              "Discounted payback",
              "Decision mode",
              "Final decision",
            ],
            ...kr().map((n) => [
              n.name,
              n.projectName,
              n.result.scenario.initial_investment,
              n.result.scenario.project_life,
              n.result.npv,
              n.result.irr ?? "N/A",
              n.result.payback ?? "Not reached",
              n.result.discounted_payback ?? "Not reached",
              n.result.scenario.decision_override ?? "auto",
              n.result.decisionFinal,
            ]),
          ]
        : [
            ["EGAT mockup — synthetic data"],
            ["Product", ve().name],
            ["Project", Q()?.name ?? ""],
            ["Decision mode", t.scenario.decision_override ?? "auto"],
            ["Final decision", t.decisionFinal],
            ["Simple payback", t.payback ?? "Not reached"],
            ["Discounted payback", t.discounted_payback ?? "Not reached"],
            [
              "Year",
              "Revenue",
              "OM",
              "Other",
              "Replacement",
              "Salvage",
              "Net CF",
              "Cumulative",
              "Discounted cumulative",
            ],
            ...t.cashflows.map((n) => [
              n.year,
              n.revenue,
              n.om_cost,
              n.other_cost,
              n.replacement,
              n.salvage,
              n.net_cf,
              n.cumulative,
              n.discounted_cumulative,
            ]),
          ],
    r = new Blob(
      [
        "\uFEFF" +
          e.map((n) => n.map((i) => '"' + String(i).replaceAll('"', '""') + '"').join(",")).join(`\r
`),
      ],
      {
        type: "text/csv;charset=utf-8",
      },
    ),
    s = document.createElement("a");
  ((s.href = URL.createObjectURL(r)),
    (s.download = `egat-${W === "compare" ? "comparison" : L}-sample.csv`),
    s.click(),
    setTimeout(() => URL.revokeObjectURL(s.href), 1e3),
    yt("ส่งออกข้อมูลตัวอย่างแล้ว"));
};
let zr = "add",
  nr = L,
  Gr = null;
function Qe() {
  (document.body.classList.remove("sidebar-open"),
    _("#sidebar-open").setAttribute("aria-expanded", "false"));
}
_("#sidebar-open").onclick = () => {
  (document.body.classList.add("sidebar-open"),
    _("#sidebar-open").setAttribute("aria-expanded", "true"));
};
_("#sidebar-close").onclick = Qe;
_("#sidebar-shade").onclick = Qe;
{
  const t = _("#sidebar"),
    e = () => matchMedia("(min-width:901px)").matches,
    r = (s) => document.body.classList.toggle("rail-open", s && e());
  (t.addEventListener("mouseenter", () => r(!0)),
    t.addEventListener("mouseleave", () => r(!1)),
    t.addEventListener("focusin", () => {
      t.querySelector(":focus-visible") && r(!0);
    }),
    t.addEventListener("focusout", (s) => {
      !t.contains(s.relatedTarget) && !t.matches(":hover") && r(!1);
    }));
}
document.addEventListener("keydown", (t) => {
  t.key === "Escape" && Qe();
});
function ln(t) {
  ((L = t), (B.selected = t), Xe(), Ft(), Ce(), xe(), Qe());
}
function cc(t) {
  const e = B.projects.find((r) => r.id === t);
  e && ((L = e.product), (B.active[L] = t), Xe(), Ft(), Ce(), xe(), Qe());
}
function uc() {
  const t = (e) => B.projects.filter((r) => r.product === e).length;
  if (
    (_("#product-tabs").children.length ||
      ((_("#product-tabs").innerHTML = $e
        .map(
          (e, r) =>
            `<button class="product-choice" data-product="${e.id}" aria-pressed="false" aria-label="เลือก ${e.name}"><span class="model-index">0${r + 1} / ENERGY SOLUTION</span><span class="scene product-model" data-compact="true"><span id="canvas-wrap" role="img" aria-label="โมเดล 3D ${e.name}"></span></span><span class="product-choice-copy"><strong>${e.name}</strong><span data-product-count="${e.id}"></span></span><span class="product-check">↗</span></button>`,
        )
        .join("")),
      _("#product-tabs")
        .querySelectorAll("[data-product]")
        .forEach((e) => {
          e.onclick = () => ln(e.dataset.product);
          try {
            const r = _i(e.querySelector("#canvas-wrap"), e.dataset.product, {
              sway: !0,
              phase: $e.findIndex((s) => s.id === e.dataset.product) * 1.7,
              shadowSize: 1024,
              zoomHeight: 6.1,
              lookY: 1.45,
            });
            (r.setMotion(!0), ec.push(() => r.dispose()));
          } catch {
            e.querySelector(".product-model").classList.add("no-webgl");
          }
        })),
    _("#product-tabs")
      .querySelectorAll("[data-product]")
      .forEach((e) => {
        const r = e.dataset.product === L;
        (e.classList.toggle("selected", r),
          e.setAttribute("aria-pressed", String(r)),
          (e.querySelector(".product-check").textContent = r ? "✓" : "↗"),
          (e.querySelector("[data-product-count]").textContent =
            t(e.dataset.product) + " โครงการลูกค้า"));
      }),
    matchMedia("(max-width:620px)").matches)
  ) {
    const e = _("#product-tabs").firstElementChild,
      r = _("#product-tabs .selected");
    e && r && (_("#product-tabs").scrollLeft = r.offsetLeft - e.offsetLeft);
  }
  ((_("#project-tree").innerHTML =
    `<div class="nav-mini" aria-label="ผลิตภัณฑ์">${$e.map((e) => `<button class="nav-ini ${L === e.id ? "active" : ""}" data-mini-product="${e.id}" title="${e.name}" aria-label="เลือก ${e.name}">${e.icon}</button>`).join("")}<button class="nav-ini nav-ini-add" data-mini-add title="เพิ่มโครงการลูกค้า" aria-label="เพิ่มโครงการลูกค้า">+</button></div>` +
    $e
      .map((e) => {
        const r = B.projects.filter((s) => s.product === e.id);
        return `<details class="project-group ${L === e.id ? "active" : ""}" ${L === e.id ? "open" : ""}><summary><i class="nav-caret" aria-hidden="true">▸</i><span>${e.icon}</span><b>${e.name}</b><small>${r.length}</small></summary><div class="project-children">${r
          .map((s) => {
            const n = evaluateScenario(s.scenario),
              i = n.decisionFinal === "accept";
            return `<div class="project-row ${Q()?.id === s.id ? "selected" : ""}"><button class="project-select" data-project="${s.id}" ${Q()?.id === s.id ? 'aria-current="true"' : ""}><span class="project-dot ${i ? "" : "below"}"></span><span><b>${ze(s.name)}</b><small>${k(s.scenario.initial_investment / 1e6, 2)} ลบ. · ${s.scenario.project_life} ปี</small></span><em class="project-status ${i ? "" : "below"}">${i ? "ผ่าน" : "ไม่ผ่าน"}</em></button><div class="project-row-actions"><button class="nav-edit" data-rename="${s.id}" aria-label="เปลี่ยนชื่อ ${ze(s.name)}" title="แก้ชื่อ">✎</button><button class="nav-del" data-delete="${s.id}" aria-label="ลบ ${ze(s.name)}" title="ลบโครงการ">×</button></div></div>`;
          })
          .join(
            "",
          )}<button class="add-child" data-add="${e.id}">+ เพิ่มโครงการลูกค้า</button></div></details>`;
      })
      .join("")),
    [_("#project-tree")].forEach((e) => {
      (e
        .querySelectorAll("[data-project]")
        .forEach((r) => (r.onclick = () => cc(r.dataset.project))),
        e
          .querySelectorAll("[data-add]")
          .forEach((r) => (r.onclick = () => ir("add", r.dataset.add))),
        e
          .querySelectorAll("[data-rename]")
          .forEach(
            (r) =>
              (r.onclick = () =>
                ir(
                  "rename",
                  B.projects.find((s) => s.id === r.dataset.rename).product,
                  r.dataset.rename,
                )),
          ),
        e
          .querySelectorAll("[data-delete]")
          .forEach((r) => (r.onclick = () => hc(r.dataset.delete))),
        e
          .querySelectorAll("[data-mini-product]")
          .forEach((r) => (r.onclick = () => ln(r.dataset.miniProduct))),
        e.querySelectorAll("[data-mini-add]").forEach((r) => (r.onclick = () => ir("add", L))));
    }));
}
function ir(t, e, r = null) {
  ((zr = t), (nr = e), (Gr = r));
  const s = $e.find((a) => a.id === e);
  ((_("#project-dialog-title").textContent =
    t === "add" ? "เพิ่มโครงการลูกค้า" : "เปลี่ยนชื่อโครงการ"),
    (_("#project-dialog-product").textContent = s.name),
    (_("#project-submit").textContent = t === "add" ? "เพิ่มโครงการ →" : "บันทึกชื่อ"),
    (_("#project-seed-options").hidden = t !== "add"),
    (_("#copy-seed").disabled = !Ge(B, e)),
    (_("#project-form-error").textContent = ""),
    _("#project-form").reset());
  const n = new Set(B.projects.filter((a) => a.product === e).map((a) => a.name));
  let i = 1;
  for (; n.has(`ลูกค้าคนที่ ${i}`);) i++;
  ((_("#project-name").value =
    t === "rename" ? B.projects.find((a) => a.id === r).name : `ลูกค้าคนที่ ${i}`),
    _("#project-dialog").showModal(),
    _("#project-name").focus(),
    _("#project-name").select());
}
_("#sidebar-add").onclick = () => ir("add", L);
function rs() {
  _("#project-dialog").close();
}
_("#project-dialog-close").onclick = rs;
_("#project-cancel").onclick = rs;
_("#project-form").onsubmit = (t) => {
  t.preventDefault();
  const e = _("#project-name").value.trim();
  if (
    !e ||
    B.projects.some(
      (r) =>
        r.product === nr && r.name.toLocaleLowerCase() === e.toLocaleLowerCase() && r.id !== Gr,
    )
  ) {
    _("#project-form-error").textContent = e
      ? "มีชื่อนี้ในผลิตภัณฑ์แล้ว กรุณาใช้ชื่ออื่น"
      : "กรุณากรอกชื่อโครงการ";
    return;
  }
  (zr === "add"
    ? (yi(B, nr, e, _("#copy-seed").checked), (L = nr))
    : (B.projects.find((r) => r.id === Gr).name = e),
    Xe(),
    rs(),
    Ce(),
    xe(),
    Qe(),
    yt(zr === "add" ? "เพิ่มโครงการลูกค้าแล้ว" : "บันทึกชื่อโครงการแล้ว"));
};
function hc(t) {
  const e = wi(B, t);
  e && ((Kr = e), Xe(), Ce(), xe(), yt(`ลบ “${e.project.name}” แล้ว`, !0));
}
function dc() {
  const t = _("#decision-panel");
  if (((t.hidden = !Q()), !Q())) {
    t.innerHTML = "";
    return;
  }
  const e = Pe(),
    r = e.scenario.decision_override ?? "auto",
    s = e.recommendation,
    n = e.decisionFinal;
  ((t.innerHTML = `<div class="decision-copy"><h3>การตัดสินใจลงทุน <span class="decision-badge ${n}">${n.toUpperCase()}</span></h3><p>คำแนะนำตาม IRR: <b class="${s}">${s.toUpperCase()}</b> · IRR ${e.irr == null ? "—" : k(e.irr * 100, 2) + "%"} / เกณฑ์ ${k(e.scenario.discount_rate * 100, 1)}%</p></div><div class="decision-controls"><div class="decision-switch" role="group" aria-label="เลือกการตัดสินใจ">${[
    ["auto", "อัตโนมัติ"],
    ["accept", "✓ Accept"],
    ["reject", "✗ Reject"],
  ]
    .map(
      ([i, a]) =>
        `<button data-decision="${i}" class="${r === i ? "selected " + i : ""}" aria-pressed="${r === i}">${a}</button>`,
    )
    .join(
      "",
    )}</div><small>${r === "auto" ? "ใช้ผลตามสมมติฐาน" : "ผู้ใช้เลือกเอง · คำแนะนำตาม IRR ไม่เปลี่ยน"}</small></div>`),
    t.querySelectorAll("[data-decision]").forEach(
      (i) =>
        (i.onclick = () => {
          ((be[L] = {
            ...be[L],
            decision_override: i.dataset.decision,
          }),
            Ce(),
            W === "compare" && xe(),
            yt("บันทึกการตัดสินใจของ " + Q().name + " แล้ว"));
        }),
    ));
}
function Yn(t) {
  const e = W + ":" + t;
  return (
    an[e] ??
    (an[e] = {
      wide: !1,
    })
  );
}
const fc = {
  cumulative: {
    base: 300,
    big: 480,
    view: 580,
  },
  annual: {
    base: 255,
    big: 420,
    view: 420,
  },
  sensitivity: {
    base: 255,
    big: 420,
    view: 420,
  },
  npv: {
    base: 240,
    big: 390,
    view: 420,
  },
  recovery: {
    base: 240,
    big: 390,
    view: 420,
  },
  irr: {
    base: 240,
    big: 390,
    view: 420,
  },
  savings: {
    base: 225,
    big: 345,
    view: 280,
    fixed: !0,
  },
  costs: {
    base: 225,
    big: 345,
    view: 420,
    fixed: !0,
  },
};
function Ot(t) {
  return (
    fc[t] ?? {
      base: 225,
      big: 345,
      view: 420,
    }
  );
}
function Xn(t = _("#content"), e = !0) {
  (t.querySelectorAll("[data-size-toggle]").forEach(
    (r) =>
      (r.onclick = () => {
        const s = r.dataset.sizeToggle,
          n = Yn(s),
          i = r.closest("[data-chart-card]"),
          a = i.querySelector("[data-fit-chart]");
        ((n.wide = !n.wide),
          i.classList.toggle("chart-wide", n.wide),
          a && (a.style.height = (n.wide ? Ot(s).big : Ot(s).base) + "px"),
          (r.textContent = n.wide ? "↙ ย่อกราฟ" : "↗ ขยายกราฟ"),
          r.setAttribute("aria-expanded", n.wide),
          r.setAttribute("aria-label", (n.wide ? "ย่อ" : "ขยาย") + "กราฟ " + qt[s]));
      }),
  ),
    t.querySelectorAll("[data-fit-chart]").forEach((r) => {
      const s = r.dataset.fitChart;
      let n = "";
      e || r.classList.add("settled");
      const i = () => {
        const o = r.clientWidth,
          l = r.clientHeight;
        if (!o || !l) return;
        const c = Ot(s),
          u = Math.max(0.6, Math.min(1.5, o / (c.fixed ? c.view : c.view * 0.75))),
          h = o + "x" + l;
        h !== n &&
          (n && r.classList.add("settled"),
          (n = h),
          (r.innerHTML = es(s, Math.round(l / u), Math.round(o / u))),
          Gn(r, s));
      };
      i();
      const a = new ResizeObserver(i);
      (a.observe(r), Vr.push(a));
    }));
}
const ss = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function Ft() {
  if (ss()) return;
  const t = _("#content");
  (t.classList.remove("entering"),
    t.offsetWidth,
    t.classList.add("entering"),
    clearTimeout(Ft.t),
    (Ft.t = setTimeout(() => t.classList.remove("entering"), 1400)));
}
function pc(t) {
  [...t.querySelectorAll(":scope .card")].forEach((e, r) =>
    e.style.setProperty("--i", Math.min(r, 10)),
  );
}
function Qn(t, e = "[data-count]") {
  !t ||
    ss() ||
    t.querySelectorAll(e).forEach((r) => {
      const s = [...r.childNodes].find((d) => d.nodeType === 3 && /\d/.test(d.textContent));
      if (!s) return;
      const n = s.textContent,
        i = n.match(/-?[\d,]+(\.\d+)?/);
      if (!i) return;
      const a = Number(i[0].replace(/,/g, "")),
        o = (i[1] || "").length - (i[1] ? 1 : 0),
        l = i[0].includes(",") || Math.abs(a) >= 1e3,
        c = performance.now(),
        u = 950,
        h = (d) => {
          s.textContent = n.replace(
            i[0],
            d.toLocaleString("en-US", {
              minimumFractionDigits: o,
              maximumFractionDigits: o,
              useGrouping: l,
            }),
          );
        };
      h(0);
      const p = (d) => {
        const f = Math.min(1, (d - c) / u),
          m = 1 - Math.pow(1 - f, 3);
        (h(a * m), f < 1 && s.isConnected ? requestAnimationFrame(p) : h(a));
      };
      requestAnimationFrame(p);
    });
}
function ar() {
  const t = _("#rail-menu"),
    e = t?.querySelector(".rail-button.active");
  if (!t || !e) return;
  let r = t.querySelector(".nav-pill");
  (r ||
    ((r = document.createElement("span")),
    (r.className = "nav-pill"),
    r.setAttribute("aria-hidden", "true"),
    t.prepend(r),
    t.classList.add("has-pill")),
    Object.assign(r.style, {
      left: e.offsetLeft + "px",
      top: e.offsetTop + "px",
      width: e.offsetWidth + "px",
      height: e.offsetHeight + "px",
    }));
}
window.addEventListener("resize", () => {
  (clearTimeout(ar.t), (ar.t = setTimeout(ar, 80)));
});
function gc() {
  let t = !1;
  try {
    ((t = sessionStorage.getItem("egat-intro") === "1"), sessionStorage.setItem("egat-intro", "1"));
  } catch {}
  if (t || ss()) return;
  const e = document.createElement("div");
  ((e.className = "intro"),
    e.setAttribute("aria-hidden", "true"),
    (e.innerHTML =
      '<div class="intro-mark"><svg viewBox="0 0 64 64"><path d="M36.5 7 15 36.5h14.5L26 57l23-31.5H34.2L36.5 7Z"/></svg><b>EGAT</b><small>Energy Feasibility</small></div>'),
    document.body.append(e),
    setTimeout(() => e.classList.add("out"), 1050),
    setTimeout(() => e.remove(), 1900));
}
window.addEventListener("hashchange", () => {
  const t = location.hash.slice(1);
  t !== "content" && t !== W && Ue(t);
});
Xe();
Ce();
gc();
Ue(location.hash.slice(1) || "overview");
