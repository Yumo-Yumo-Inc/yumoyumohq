# B2B REST API

## 5.11 B2B REST API

ฐานข้อมูลแยกต่างหาก การตรวจสอบสิทธิแยกต่างหาก การจำกัดอัตราแยกต่างหาก

```
Base: https://b2b-api.yumo.io/v1
Auth: API key + คำขอที่ตรวจสอบสิทธิพร้อมการป้องกันการเล่นซ้ำ แผนการลงนามและหน้าต่างการเล่นซ้ำจัดการอยู่ในชั้นปฏิบัติการภายใน
Rate limit: ขึ้นอยู่กับ tier · โควต้าแยกจาก public API
```

| Method | Path | จุดประสงค์ |
|---|---|---|
| GET | `/inflation-pulse` | ชุดข้อมูล TR Inflation Pulse |
| GET | `/basket-panel` | การสืบค้น Basket Panel |
| GET | `/merchant-benchmarks` | เกณฑ์เปรียบเทียบผู้ค้า |
| POST | `/cohort-query` | กลุ่มที่กำหนดเองพร้อมการบังคับใช้พื้น k |
| GET | `/catalog` | ผลิตภัณฑ์ที่มีจำหน่าย + ความสดใหม่ + ราคา |
| GET | `/methodology/{version}` | เอกสารวิธีการสำหรับเวอร์ชันที่กำหนด |

ทุกการตอบสนอง B2B รวม `methodology_version`, `k_anonymity_floor` และจำนวนผู้มีส่วนร่วมของการตอบสนอง เพื่อให้ทีม compliance ของผู้ซื้อสามารถตรวจสอบการเผยแพร่ได้

---
