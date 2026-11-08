# EGAT Feasibility Platform

🔗 **เว็บไซต์:** https://egat-finacial-feasibility.vercel.app · [ทดลองแดชบอร์ด](https://egat-finacial-feasibility.vercel.app/app?demo)

แพลตฟอร์มประเมินการลงทุน Solar PPA, Solar + Battery และ Battery
ดู NPV, IRR, จุดคุ้มทุนแบบปกติและคิดลด เปรียบเทียบโครงการ ส่งออก CSV และพิมพ์รายงาน

- `/` หน้าแรก (landing)
- `/app` แดชบอร์ด (`/app?demo` เปิดโหมดทดลองด้วยข้อมูลตัวอย่าง)

## เริ่มใช้งาน

```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase ของคุณ
npm run dev                  # http://localhost:5173
npm test                     # ตรวจสูตรกับไฟล์ BESS Feasibility Model
npm run build                # ได้ไฟล์ใน dist/
```

## โครงสร้าง

| ไฟล์ | หน้าที่ |
| --- | --- |
| `index.html`, `src/main.js`, `src/styles/landing.css` | หน้าแรก + ฉาก 3D |
| `app.html`, `src/app.js`, `src/styles/app.css` | แดชบอร์ด กราฟ ตาราง ล็อกอิน และบันทึกโครงการ (Supabase) |
| `src/model.js` | สูตรการเงิน: ต้นทุน/ผลประหยัด BESS, กระแสเงินสด, NPV, IRR, จุดคุ้มทุน |
| `test/model.test.js` | เทียบผลกับ `BESS Feasibility Model_rev01.xlsx` |

ใช้ Vite 6, three.js 0.187 และ @supabase/supabase-js 2.119

## สูตรคำนวณ (`src/model.js`)

ทั้ง 3 ผลิตภัณฑ์ใช้เครื่องคำนวณกระแสเงินสดชุดเดียวกัน (NPV, IRR, จุดคุ้มทุน) ต่างกันที่วิธีหาเงินลงทุนและรายได้ปีแรก

**Battery** (`calcBess`) ตามไฟล์ BESS Feasibility Model ของ กฟผ.

**Solar PPA** (`calcSolar`) และ **Solar + Battery** (`calcHybrid`) ใช้สูตรเดียวกัน ต่างกันแค่ Solar PPA ไม่มีแบต

| รายการ | สูตร |
| --- | --- |
| เงินลงทุน | kWp × ราคาต่อ kWp + kWh แบต × (ค่าระบบ + ค่าติดตั้ง) + ค่าแรกเข้า |
| พลังงานโซลาร์ต่อปี | kWp × ผลผลิตต่อ kWp |
| ค่าไฟกริดที่ลูกค้าเลี่ยงได้ | 71% × Peak + 29% × Off-peak |
| ค่าไฟ PPA | ค่าไฟกริดที่เลี่ยงได้ × (1 − ส่วนลด PPA) |
| ไฟเข้าแบตต่อวัน | min(โซลาร์ส่วนเกินจากโหลดกลางวัน, kWh แบต × DoD) |
| รายได้ปีแรก | ไฟใช้ตรง × ค่าไฟ PPA + ไฟจากแบต × Peak × (1 − ส่วนลด) + Demand charge (มีแบต) |
| การเติบโตของรายได้ | (1 + ค่าไฟขึ้น) × (1 − แผงเสื่อม) − 1 |
| เปลี่ยนอุปกรณ์ | Solar: อินเวอร์เตอร์ปีที่ 12 · Solar + Battery: แบต 60% + อินเวอร์เตอร์ ปีที่ 10 |

ค่าตั้งต้น (`SOLAR_DEFAULTS`, `HYBRID_DEFAULTS`) เป็นค่าประมาณสำหรับโครงการ C&I ในไทย
เช่น 20,000–26,000 บาท/kWp, 1,350 kWh/kWp/ปี, ส่วนลด PPA 15%, แผงเสื่อม 0.5%/ปี
ควรเปลี่ยนเป็นตัวเลขของ กฟผ. หรือของโครงการจริงเมื่อมี
ค่าตั้งต้นเหล่านี้ใช้ตอนสร้างโครงการใหม่หรือกด "คืนค่าตัวอย่าง" เท่านั้น โครงการที่บันทึกไว้แล้วไม่เปลี่ยน

## Supabase

แดชบอร์ดใช้ตาราง `client_projects` และ `workspace_settings` ค่าเชื่อมต่ออยู่ใน environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key เปิดเผยฝั่งเว็บได้ ข้อมูลป้องกันด้วย Row Level Security)

ค่าสำหรับ production อยู่ใน `.env.production` แล้ว Vercel จึง build ได้ทันทีโดยไม่ต้องตั้งค่าเพิ่ม

## ที่มาของโค้ด

ซอร์สชุดนี้กู้คืนจากไฟล์ที่ build แล้วของเวอร์ชันที่ deploy อยู่ (V4) หลังจาก repo เดิมถูกลบ
ไลบรารีถูกแยกกลับเป็น dependency ใน `package.json` และเว็บที่ build ใหม่แสดงผลตรงกับของเดิมทุกพิกเซล
ชื่อตัวแปรภายใน `src/app.js` และ `src/main.js` ส่วนใหญ่ยังเป็นชื่อสั้นจากการ minify
ส่วน `src/model.js` ตั้งชื่อใหม่ให้อ่านง่ายแล้ว

หมายเหตุ: ช่อง "Simple Payback Period" ในไฟล์ Excel เป็นตัวเลขที่พิมพ์ค้างไว้ (`=4+(580836/1013402)`)
ไม่ได้คำนวณจากชีต Cash Flow ค่าบนเว็บ (4.23 ปี / 6.61 ปี) คำนวณจากกระแสเงินสดจริงและถูกต้องกว่า
