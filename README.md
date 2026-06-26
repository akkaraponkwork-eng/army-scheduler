# ระบบจัดเวรทหาร (Army Duty Scheduler)

ระบบจัดตารางเวรทหาร 4 ผลัด เชื่อมต่อ Google Sheets

## 🚀 การติดตั้ง

### 1. สร้าง Google Service Account

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง Project ใหม่ (หรือใช้ที่มีอยู่)
3. ไปที่ **APIs & Services > Library** > ค้นหา **"Google Sheets API"** > กด **Enable**
4. ไปที่ **APIs & Services > Credentials** > กด **Create Credentials** > เลือก **Service Account**
5. ใส่ชื่อ Service Account > กด **Create and Continue** > กด **Done**
6. คลิกที่ Service Account ที่สร้าง > ไปแท็บ **Keys** > **Add Key** > **Create new key** > เลือก **JSON** > กด **Create**
7. ไฟล์ JSON จะถูก Download มา

### 2. แชร์ Google Sheet ให้ Service Account

1. เปิด Google Sheet: https://docs.google.com/spreadsheets/d/1N9qwe8mA8ZvnrcIeJAmhEPmEPhk2iEK27LumbCOtbGQ/edit
2. กดปุ่ม **Share** (แชร์)
3. ใส่ **email ของ Service Account** (หน้าตาเป็น `...@....iam.gserviceaccount.com`)
4. ตั้งสิทธิ์เป็น **Editor** > กด **Share**

### 3. เพิ่มคอลัมน์สถานะใน Google Sheet

เปิด Sheet `personnel` แล้วเพิ่มคอลัมน์ C ชื่อ `สถานะ`:
- `active` — เข้าเวรปกติ (default)
- `assistant_sergeant` — ผู้ช่วยนายสิบ (ยกเว้นถาวร)

### 4. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์โปรเจ็กต์:

```env
GOOGLE_SPREADSHEET_ID=1N9qwe8mA8ZvnrcIeJAmhEPmEPhk2iEK27LumbCOtbGQ
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

> **หมายเหตุ**: ไฟล์ JSON ทั้งหมดต้องอยู่ใน **บรรทัดเดียว** ไม่มีขึ้นบรรทัดใหม่

### 5. รันโปรเจ็กต์

```bash
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ http://localhost:3000

## 📋 โครงสร้าง Google Sheet

| Sheet | คำอธิบาย |
|-------|---------|
| `personnel` | รายชื่อทหาร (A: รหัส, B: ชื่อ-สกุล, C: สถานะ) |
| `schedule` | ตารางเวร (สร้างอัตโนมัติ) |
| `exceptions` | กรณียกเว้นชั่วคราว (สร้างอัตโนมัติ) |

## ⏰ เวลาผลัด

| ผลัด | เวลา |
|------|------|
| ผลัด 1 | 21:00 – 23:00 น. |
| ผลัด 2 | 23:00 – 01:00 น. |
| ผลัด 3 | 01:00 – 03:00 น. |
| ผลัด 4 | 03:00 – 05:00 น. |

## 📍 ตำแหน่งเวร

- 🔴 หน้าคลังอาวุธทิศเหนือ (2 คน)
- 🟡 หน้ามุขกลาง (2 คน)
- 🟢 หน้าคลังอาวุธทิศใต้ (2 คน)

## 🎖️ ฟีเจอร์

- **ปฏิทินรายเดือน** — ดูภาพรวมเวรทั้งเดือน
- **สร้างตารางอัตโนมัติ** — เรียงรหัส 1-125 วนซ้ำ
- **แก้ไขเวร** — เปลี่ยนชื่อทหารในผลัดใดก็ได้
- **กรณียกเว้น** — จัดการผู้ป่วย/ธุระการ
- **คัดลอกข้อความ** — format พร้อมส่งไลน์
