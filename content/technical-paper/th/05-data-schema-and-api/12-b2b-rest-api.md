# B2B API (วางแผน)

## 5.11 B2B API (วางแผน)

API ของผลิตภัณฑ์ข้อมูล B2B เป็น**งานในอนาคต**ไม่มีจุดปลายทาง B2B ที่ใช้งานได้ในปัจจุบัน ข้อมูลที่เกี่ยวข้องกับ B2B ปัจจุบันเข้าถึงโลกภายนอกผ่านบัญชีแยกประเภทราคาสาธารณะ (5.10) และแมนิเฟสต์ Arweave ของมัน

ร่างการออกแบบสำหรับพื้นผิวที่วางแผนไว้ — เส้นทางฐานแยกต่างหาก ข้อมูลรับรองแยกต่างหาก โควต้าแยกจาก public API:

| Method | Path | Purpose |
|---|---|---|
| GET | `/inflation-pulse` | Inflation Pulse series |
| GET | `/basket-panel` | Basket Panel query |
| GET | `/merchant-benchmarks` | Merchant Benchmarks |
| POST | `/cohort-query` | Custom cohort with k-floor enforcement |
| GET | `/catalog` | Available products + freshness + pricing |
| GET | `/methodology/{version}` | Methodology document for a given version |

การตรวจสอบสิทธิที่วางแผนไว้: API key พร้อมลายเซ็นคำขอที่มีการป้องกันการเล่นซ้ำ รูปแบบลายเซ็นและหน้าต่างการเล่นซ้ำยังคงอยู่ในชั้นปฏิบัติการภายใน

การตอบสนอง B2B ที่วางแผนไว้ทั้งหมดรวม `methodology_version` ตัวบ่งชี้พื้น k-anonymity และจำนวนผู้มีส่วนร่วมของการตอบสนอง เพื่อให้ทีม compliance ของผู้ซื้อสามารถตรวจสอบการเผยแพร่ได้

---
