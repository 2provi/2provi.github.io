# แผนผังรูปภาพเว็บ 2provi (image-01 … image-10)

รูปคอนเทนต์ทั้งหมดถูกเปลี่ยนชื่อเป็น `image-NN.jpg` เรียงลำดับ
อยากเปลี่ยนรูปในอนาคต → แค่วางไฟล์ชื่อเดิมทับใน `/assets/` (ขนาด/สัดส่วนใกล้ของเดิม) โดยไม่ต้องแก้โค้ด

| ลำดับ | ไฟล์ใหม่ | ชื่อ/ที่มาเดิม | ใช้ที่หน้า | หมายเหตุ |
|------|----------|----------------|-----------|----------|
| 01 | `image-01.jpg` | unsplash `photo-1609220136736-443140cffec6` | index (hero) | รูปครอบครัว ด้านบนสุด แนวนอน ~1000px |
| 02 | `image-02.jpg` | unsplash `photo-1556761175-b413da4baf72` | index (consulting) | ให้คำปรึกษา สูง ~370px |
| 03 | `image-03.jpg` | unsplash `photo-1556742049-0cfed4f6a45d` | index (การ์ดวางแผนเกษียณ) | การ์ดบทความ |
| 04 | `image-04.jpg` | unsplash `photo-1581579185169-17d06cfd1e05` | index (การ์ดสุขภาพ) | การ์ดบทความ |
| 05 | `image-05.jpg` | unsplash `photo-1504159506876-f8338247a14a` | index (การ์ดครอบครัว/การศึกษา) | การ์ดบทความ |
| 06 | `image-06.jpg` | `profile.jpg` | aboutme/index, tikamporn, experience | รูปโปรไฟล์ คุณฑิฆัมพร (จัตุรัส 400×400) |
| 07 | `image-07.jpg` | `profile2.jpg` | aboutme/index, korawan | รูปโปรไฟล์ คุณกรวรรณ (จัตุรัส 400×400) |
| 08 | `image-08.jpg` | `profile3.jpg` | aboutme/index, pawee | รูปโปรไฟล์ คุณภาวีร์ (จัตุรัส 400×400) |
| 09 | `image-09.jpg` | `bg-executive.jpg` | korawan, tikamporn, pawee | ภาพพื้นหลัง header (CSS `url()`) |
| 10 | `image-10.jpg` | `bg-money.jpg` | aboutme/experience | ภาพพื้นหลัง header (CSS `url()`) |

## สถานะปัจจุบัน (อัปเดต 2026-10-06)
- **image-01, 02, 03, 05** → วางไฟล์แล้ว (แปลงจาก AVIF ที่นายท่านส่งมา → JPG) แสดงผลได้ ✅
- **image-06 ถึง image-10** → ไฟล์มีอยู่แล้ว (เปลี่ยนชื่อจากของเดิม) แสดงผลได้ ✅
- **image-04.jpg** → ❗ ยังขาด (รูปการ์ดสุขภาพ, unsplash photo-1581579185169-17d06cfd1e05)
  - Unsplash ถูกบล็อกฝั่ง sandbox โมกะโหลดให้ไม่ได้
  - ตอนนี้โค้ดชี้ `/assets/image-04.jpg` ไว้แล้ว การ์ดสุขภาพจะโชว์ placeholder จนกว่าจะวางไฟล์
  - วางไฟล์ `image-04.jpg` ใน `/assets/` เมื่อไหร่ก็ขึ้นทันที (ไม่ต้องแก้โค้ด)

## ลิงก์ดาวน์โหลดรูปเดิม (ถ้าอยากใช้ของเดิม)
```
image-01.jpg  https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1000&q=85
image-02.jpg  https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85
image-03.jpg  https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=85
image-04.jpg  https://images.unsplash.com/photo-1581579185169-17d06cfd1e05?auto=format&fit=crop&w=800&q=85
image-05.jpg  https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=800&q=85
```
สคริปต์ `localize-images.sh` (ที่โมกะส่งให้ก่อนหน้า) ดาวน์โหลด 5 รูปนี้มาตั้งชื่อ image-01..05.jpg ได้เลย

## รูปที่ "ไม่" อยู่ในระบบเลข (ตั้งใจเว้นไว้)
- `og-image.jpg` — รูป social share (เฉพาะตอนแชร์ลิงก์ ไม่โชว์บนหน้าเว็บ)
- `logo-mark.png`, `logo-hero.png`, `logo-2provi-full.png` — โลโก้แบรนด์
- `favicon*`, `apple-touch-icon`, `icon-*` — ไอคอน
