# สินค้ามาตรฐาน (normative)

## 5.4 สินค้ามาตรฐาน (normative)

```json
// CanonicalProduct
{
  "canonical_product_id": "cp.pinar.milk.1l",
  "name": "Pınar Süt 1 L",
  "name_aliases": ["PINAR SUT 1L", "SUT PINAR 1L", "PINAR S.YAGLI 1L"],
  "brand_id": "brand.pinar",
  "category_path": ["food", "dairy", "milk"],
  "attributes": {
    "size_value": 1.0,
    "size_unit": "L",
    "package_type": "carton",
    "fat_content_pct": 3.0,
    "is_private_label": false
  },
  "barcode_gtin": "8690571000123",
  "embedding_vector_id": "v.pinar.milk.1l.v3",
  "taxonomy_version": "1.0.0",
  "created_at": "2026-01-01T00:00:00Z",
  "last_seen_at": "2026-05-17T14:23:11Z",
  "observation_count": 42813
}
```

`category_path` เป็นแบบลำดับชั้น การสืบค้นสามารถจับคู่ได้ที่ความลึกใดก็ได้ (`food` ส่งคืนทั้งต้นไม้) `taxonomy_version` อนุญาตการจัดหมวดหมู่ใหม่ที่เข้ากันได้ย้อนหลัง — เมื่อ v1.1 เปิดตัว บันทึกที่มีอยู่จะเก็บเส้นทาง v1.0 ไว้จนกว่าจะประมวลผลใหม่

### ชื่อเล่น

`name_aliases` คือสิ่งที่ขับเคลื่อนการจับคู่คลุมเครือใน 02 ขั้นตอน 4 ชื่อเล่นใหม่ถูกเพิ่มโดยผู้ตรวจสอบการแคนอนิคอล หรือโดยการรวมอัตโนมัติเมื่อสอง embedding รวมกลุ่มอย่างแน่น บันทึกการตรวจสอบบันทึกว่าใคร/อะไรเพิ่มแต่ละชื่อเล่น

---
