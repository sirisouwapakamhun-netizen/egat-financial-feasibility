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

## Supabase

แดชบอร์ดใช้ตาราง `client_projects` และ `workspace_settings` ค่าเชื่อมต่ออยู่ใน environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key เปิดเผยฝั่งเว็บได้ ข้อมูลป้องกันด้วย Row Level Security)

ตอน deploy บน Vercel ให้ใส่สองค่านี้ใน Project → Settings → Environment Variables

## ที่มาของโค้ด

ซอร์สชุดนี้กู้คืนจากไฟล์ที่ build แล้วของเวอร์ชันที่ deploy อยู่ (V4) หลังจาก repo เดิมถูกลบ
ไลบรารีถูกแยกกลับเป็น dependency ใน `package.json` และเว็บที่ build ใหม่แสดงผลตรงกับของเดิมทุกพิกเซล
ชื่อตัวแปรภายใน `src/app.js` และ `src/main.js` ส่วนใหญ่ยังเป็นชื่อสั้นจากการ minify
ส่วน `src/model.js` ตั้งชื่อใหม่ให้อ่านง่ายแล้ว

หมายเหตุ: ช่อง "Simple Payback Period" ในไฟล์ Excel เป็นตัวเลขที่พิมพ์ค้างไว้ (`=4+(580836/1013402)`)
ไม่ได้คำนวณจากชีต Cash Flow ค่าบนเว็บ (4.23 ปี / 6.61 ปี) คำนวณจากกระแสเงินสดจริงและถูกต้องกว่า
