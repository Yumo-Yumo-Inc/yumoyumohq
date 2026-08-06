# API surface

## 5.10 API surface

### Current: application routes

API ที่ใช้งานอยู่คือพื้นผิวเส้นทางของแอปพลิเคชัน: **เส้นทางที่ยืนยันเซสชันภายใต้ `/api/*` บน `yumoyumo.com`** ใช้งานโดยปรับใช้ Next.js เดียวกับผลิตภัณฑ์ การตรวจสอบสิทธิ์คือเซสชันของผู้ใช้ ไม่มีข้อมูลรับรองผู้พัฒนาแยกต่างหากในปัจจุบัน

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/receipt/upload` | Upload a receipt image | Session |
| POST | `/api/receipt/analyze` | Run the pipeline on an upload | Session |
| GET  | `/api/receipts` | List the user's receipts | Session (own only) |
| GET  | `/api/receipts/{id}` | Fetch a receipt record | Session (own only) |
| GET  | `/api/wallet/summary` | Points balance and history | Session |
| GET  | `/api/prices/epoch/{epoch}` | Public price-epoch data: epoch metadata, observation pages, and Merkle inclusion proofs (`?proof=<leaf_hash>`) | Public |
| GET  | `/api/prices/product/{productId}` | Public price history for a catalog product | Public |

เส้นทาง price-ledger เป็นพื้นผิวการอ่านสาธารณะในปัจจุบัน: ใครก็ได้สามารถดึงช่วงที่ปิดกั้น ดึงการสังเกต และขอหลักฐานการรวมที่พับไปยังรูท on-chain แมนิเฟสต์ Arweave ที่เผยแพร่จัดเตรียมข้อมูลเดียวกันโดยไม่ขึ้นอยู่กับเส้นทางเหล่านี้

### Planned: versioned public REST API

API REST สาธารณะเวอร์ชันสำหรับแอปพลิเคชันบุคคลที่สามเป็น**งานในอนาคต** ร่างการออกแบบ: ฐาน `/v1` บน `yumoyumo.com` การให้อำนาจตามมาตรฐานสำหรับไคลเอนต์บุคคลที่สาม เส้นทางเรียบร้อยสไตล์ทรัพยากรสำหรับใบเสร็จและรางวัล และการสมัครสมาชิกเหตุการณ์สำหรับการเปลี่ยนแปลงสถานะ (ใบเสร็จได้รับการตรวจสอบ รางวัลที่ได้รับอนุมัติ epoch ปิดกั้น) พื้นผิวที่เฉพาะเจาะจงจะถูกระบุเมื่อโปรแกรมผู้พัฒนาเปิด เส้นทางแอปพลิเคชันข้างต้นคือสัญญาจนกว่าจะถึงเวลานั้น

---
