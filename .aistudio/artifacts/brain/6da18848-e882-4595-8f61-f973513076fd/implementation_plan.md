# Kế hoạch triển khai Tính toán chi tiết toàn bộ Công trình đơn vị ECS

Kế hoạch này thiết lập hệ thống tính toán chi tiết, toàn diện cho mọi công trình đơn vị trong danh mục công nghệ xử lý nước thải của ECS, chuẩn hóa theo giáo trình quốc tế **Metcalf & Eddy (Wastewater Engineering: Treatment and Resource Recovery)** kết hợp **TCVN 7957:2008**, tập trung chuyên sâu vào tính toán thủy lực và kích thước hình học xây dựng.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Các quyết định kỹ thuật đã chốt từ phản hồi của bạn:**
> 1. **Cơ sở tiêu chuẩn tính toán**: Kết hợp giáo trình quốc tế **Metcalf & Eddy** và **TCVN 7957:2008**.
> 2. **Trọng tâm thiết kế**: Tập trung cao độ vào **tính toán thủy lực** (lưu lượng, vận tốc dòng chảy, tải trọng bề mặt, tải trọng chất rắn, thời gian lưu HRT) và **kích thước hình học xây dựng** ($L \times B \times H$ hoặc $D \times H$).
> 3. **Phạm vi triển khai**: Hoàn thiện toàn bộ các công trình thuộc mọi phân nhóm công nghệ trong danh mục (Cơ học, Hóa lý, Sinh học nâng cao, Lắng lọc, Khử trùng, Xử lý bùn).

---

### 1. Tổng quan & Danh mục công trình đơn vị

Hệ thống tính toán chi tiết sẽ mở rộng độc lập cho từng công trình trong 7 nhóm công nghệ:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DÂY CHUYỀN CÔNG NGHỆ ECS                        │
├─────────────────┬──────────────────────────────────────────────────────┤
│ 1. Thu gom - ĐH │ • Hố thu gom     • Hầm bơm        • Bể điều hòa      │
│ 2. Cơ học       │ • Song chắn rác  • Bể lắng cát    • Bể tách dầu mỡ   │
│ 3. Hóa lý       │ • Bể keo tụ      • Bể tạo bông    • Tuyển nổi DAF    │
│ 4. Sinh học     │ • Bể Anoxic      • Bể Aerotank    • Bể MBBR / MBR    │
│                 │ • Bể SBR         • Bể kỵ khí UASB                    │
│ 5. Lắng - Lọc   │ • Bể lắng sinh học • Bể lắng hóa lý • Bể lọc áp lực  │
│                 │ • Bể lọc than hoạt tính                              │
│ 6. Khử trùng    │ • Bể tiếp xúc khử trùng • Hệ thống châm Clo          │
│ 7. Bùn thải     │ • Bể chứa bùn    • Bể nén bùn     • Máy ép bùn       │
└─────────────────┴──────────────────────────────────────────────────────┘
```

Mỗi công trình sẽ có module tính toán thủy lực chuyên biệt với công thức giải thích, kiểm tra điều kiện đạt/chưa đạt, và tự động tối ưu hóa kích thước hình học xây dựng.

---

### 2. Chi tiết công thức thủy lực & Kích thước theo Metcalf & Eddy + TCVN

#### A. Nhóm Xử lý cơ học
1. **Song chắn rác (Bar Screen)**:
   - *Thủy lực*: Vận tốc qua khe thanh $v = 0.6 - 1.0\text{ m/s}$ (tránh cặn đọng hoặc cặn bị đẩy qua), tổn thất áp lực $\Delta h = \beta \left(\frac{s}{b}\right)^{4/3} \frac{v^2}{2g} \sin \alpha$.
   - *Kích thước*: Chiều rộng mương $B$, chiều sâu nước $H$, góc nghiêng đặt thanh $\alpha = 60^\circ - 75^\circ$, khoảng cách khe hở $b = 10 - 25\text{ mm}$.
2. **Bể lắng cát (Grit Chamber)**:
   - *Thủy lực*: Tốc độ lắng trọng lực hạt cát $u_0 = 18 - 24\text{ mm/s}$ ($d \ge 0.2\text{ mm}$), vận tốc dòng chảy ngang $v_h = 0.25 - 0.30\text{ m/s}$, thời gian lưu $t = 45 - 90\text{ giây}$.
   - *Kích thước*: Chiều dài mương lắng $L = \frac{v_h \cdot H}{u_0}$, chiều rộng $B$, máng thu cát đáy nghiêng.
3. **Bể tách dầu mỡ (Grease Trap)**:
   - *Thủy lực*: Tốc độ nổi của giọt dầu $v_{\text{oil}} = 3 - 5\text{ mm/s}$, thời gian lưu nước $t = 15 - 30\text{ phút}$, tải trọng bề mặt $q_0 \le 4\text{ m}^3/(\text{m}^2\cdot\text{h})$.
   - *Kích thước*: Tỷ lệ $L/B \ge 3$, vách hướng dòng và máng gạt váng dầu nổi bề mặt.

#### B. Nhóm Xử lý hóa lý
1. **Bể keo tụ (Coagulation / Rapid Mix Tank)**:
   - *Thủy lực*: Gradient vận tốc khuấy nhanh $G = 700 - 1000\text{ s}^{-1}$, thời gian lưu $t = 30 - 60\text{ giây}$.
   - *Kích thước & Công suất*: Thể tích $V = Q_h \cdot t$, công suất khuấy $P = G^2 \cdot \mu \cdot V$.
2. **Bể tạo bông (Flocculation Tank)**:
   - *Thủy lực*: Gradient vận tốc khuấy chậm giảm dần qua các ngăn $G = 20 - 70\text{ s}^{-1}$, thời gian lưu $t = 20 - 30\text{ phút}$, tích số $G \cdot t = 10^4 - 10^5$.
   - *Kích thước*: 2 - 3 ngăn nối tiếp, cánh khuấy mái chèo chậm.
3. **Bể tuyển nổi DAF (Dissolved Air Flotation)**:
   - *Thủy lực*: Tỷ lệ khí/cặn $A/S = 0.008 - 0.02\text{ mg air/mg TSS}$, tải trọng bề mặt $q_0 = 4 - 8\text{ m}^3/(\text{m}^2\cdot\text{h})$, áp lực bồn hòa khí bão hòa $P = 4 - 6\text{ bar}$, tỷ lệ nước tuần hoàn $R = 20 - 40\%$.
   - *Kích thước*: Diện tích bề mặt $A_s = \frac{Q(1+R)}{q_0}$, chiều sâu $H = 1.8 - 2.5\text{ m}$.

#### C. Nhóm Sinh học nâng cao
1. **Bể SBR (Sequencing Batch Reactor)**:
   - *Thủy lực & Chu kỳ*: Thời gian chu kỳ $T_C = 4 - 8\text{ giờ}$ (Pha nạp - sục khí - lắng - rút nước trong - chờ), tỷ số trao đổi thể tích $\Delta V / V = 25 - 35\%$, tải trọng $F/M = 0.08 - 0.2\text{ kg BOD/kg MLSS}\cdot\text{d}$.
   - *Kích thước*: Thể tích tổng $V_{\text{total}}$, chiều cao nước dâng tối đa và chiều cao mức nước thấp nhất sau rút nước.
2. **Bể MBR (Membrane Bioreactor)**:
   - *Thủy lực & Màng*: Thông lượng lọc màng $J = 15 - 25\text{ L}/(\text{m}^2\cdot\text{h})$, nồng độ bùn rất cao $MLSS = 8.000 - 12.000\text{ mg/L}$, thời gian lưu nước $HRT = 3 - 6\text{ giờ}$.
   - *Kích thước*: Diện tích màng yêu cầu $S_m = \frac{Q_h \cdot 1000}{J}$, thể tích bể màng, bố trí dàn sục khí rung lắc màng.
3. **Bể MBBR (Moving Bed Biofilm Reactor)**:
   - *Thủy lực & Giá thể*: Tải trọng hữu cơ bề mặt giá thể $SALR = 10 - 20\text{ g BOD}/(\text{m}^2\cdot\text{d})$, tỷ lệ điền đầy giá thể $FF = 40 - 60\%$, diện tích bề mặt hiệu dụng của giá thể vi sinh $SSA = 500 - 800\text{ m}^2/\text{m}^3$.
   - *Kích thước*: Thể tích bể $V$, thể tích hạt giá thể cần nạp $V_{\text{media}} = V \cdot FF$.
4. **Bể kỵ khí UASB (Upflow Anaerobic Sludge Blanket)**:
   - *Thủy lực & Tải nạp*: Tải trọng thể tích $VLR = 4 - 10\text{ kg COD}/(\text{m}^3\cdot\text{d})$, vận tốc dòng dâng qua lớp bùn $v_{\text{up}} = 0.6 - 1.0\text{ m/h}$, chiều sâu $H = 4.5 - 6.0\text{ m}$.
   - *Kích thước*: Diện tích đáy $S = Q_h / v_{\text{up}}$, thiết kế khoang lắng tách 3 pha (Khí - Bùn - Nước) góc vát $45^\circ - 50^\circ$.

#### D. Nhóm Lắng - Lọc & Xử lý bùn
1. **Bể lắng hóa lý (Primary / Chemical Clarifier)**:
   - *Thủy lực*: Tải trọng bề mặt $q_0 = 1.0 - 1.5\text{ m}^3/(\text{m}^2\cdot\text{h})$, thời gian lắng $t = 1.5 - 2.0\text{ giờ}$, tải trọng máng răng cưa $q_w \le 10\text{ m}^3/(\text{m}\cdot\text{h})$.
2. **Bể lọc áp lực (Pressure Sand Filter)**:
   - *Thủy lực*: Tốc độ lọc $v = 8 - 12\text{ m/h}$, tổn thất áp lực $\Delta h = 2 - 5\text{ m}$, chu kỳ rửa ngược bằng nước + khí $t_{\text{wash}} = 10 - 15\text{ phút}$ với cường độ $w = 12 - 15\text{ L}/(\text{s}\cdot\text{m}^2)$.
3. **Bể lọc than hoạt tính (Activated Carbon Filter)**:
   - *Thủy lực*: Vận tốc lọc qua lớp than $v = 6 - 10\text{ m/h}$, thời gian tiếp xúc qua lớp than rỗng $EBCT = 10 - 20\text{ phút}$.
4. **Máy ép bùn (Filter Press / Screw Press)**:
   - *Công nghệ ép*: Công suất ép bùn $Q = \frac{V_{\text{bùn nén}}}{t_{\text{ca}}}$ ($\text{m}^3/\text{h}$), khối lượng bã bùn sau ép (độ ẩm $75 - 80\%$), liều lượng hóa chất polymer keo tụ $2 - 4\text{ kg polymer/tấn bùn khô}$.

---

### 3. Trải nghiệm người dùng & Giao diện tính toán

- **Đồng nhất 4 Tab chuẩn cho từng công trình:**
  1. **Đầu vào (Input)**: Cho phép kết nối tự động lưu lượng ($Q, Q_h$) và nồng độ ô nhiễm từ tab *Tải lượng*, có nút gỡ liên kết để tự nhập linh hoạt.
  2. **Tính toán (Calc)**: Bảng thông số thủy lực chi tiết, thẻ thông báo trạng thái màu sắc trực quan (Đạt / Chưa đạt) và nút xem **Công thức kỹ thuật** (popup giải thích từng bước tính).
  3. **Kích thước (Dimensions)**: Kích thước lọt lòng $L, B, H$, nút **"Tự động tính kích thước tối ưu"** theo tỷ lệ chuẩn kỹ thuật ($L/B \approx 1.5 - 2.0$ hoặc đường kính $D$).
  4. **Thiết bị & BOM (Equipment)**: Bảng thống kê thiết bị chính kèm thông số công suất, số lượng chạy/dự phòng và quy chuẩn chọn máy.
- **Quy chuẩn số liệu:** Toàn bộ kết quả hiển thị được làm tròn số học chuẩn xác bằng `roundTo(val, 2)` và định dạng `vi-VN` (dấu phẩy phân tách thập phân, dấu chấm phân cách hàng nghìn).

---

### 4. Kiến trúc hệ thống & Luồng dữ liệu

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KIẾN TRÚC TÍNH TOÁN ECS                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
    ┌───────────────────────┐                 ┌───────────────────────┐
    │   Inputs Nước thải    │                 │ Technology Units List │
    │ (Q, Qh, BOD, COD,...) │                 │   (Catalog Selection) │
    └──────────┬────────────┘                 └──────────┬────────────┘
               │                                         │
               │  Tự động kế thừa lưu lượng & tải trọng  │
               └────────────────────┬────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                Calculation Engine (calculations.ts)             │
    │  • Nhóm Cơ học: Song chắn rác, Lắng cát, Tách dầu mỡ           │
    │  • Nhóm Hóa lý: Keo tụ, Tạo bông, Tuyển nổi DAF                │
    │  • Nhóm Sinh học: Anoxic, Aerotank, MBBR, MBR, SBR, UASB       │
    │  • Nhóm Lắng - Lọc: Lắng sinh học/hóa lý, Lọc cát, Lọc than    │
    │  • Nhóm Bùn: Bể nén bùn, Bể chứa bùn, Máy ép bùn               │
    └───────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                Unit Detail Workspace (4 Tabs UI)                │
    │  [Đầu vào] ──> [Tính toán & Tiêu chí] ──> [Kích thước] ──> [BOM]│
    └───────────────────────────────┬─────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │ Báo cáo Kỹ thuật & Thuyết minh tổng hợp (ReportsPage Section III)│
    │  • Bảng tổng hợp kích thước hình học toàn trạm                  │
    │  • Bảng tiêu chuẩn kiểm tra thủy lực                            │
    └─────────────────────────────────────────────────────────────────┘
```

---

### 5. Kế hoạch thực hiện theo từng bước

1. **Bước 1: Mở rộng Types & Interfaces (`src/types/ecs.ts`)**
   - Bổ sung data model cho các công trình: `BarScreenData`, `GritChamberData`, `GreaseTrapData`, `CoagulationTankData`, `FlocculationTankData`, `DafData`, `SbrData`, `MbrData`, `MbbrData`, `UasbData`, `ChemicalClarifierData`, `SandFilterData`, `CarbonFilterData`, `FilterPressData`.

2. **Bước 2: Nâng cấp Calculation Engine (`src/utils/calculations.ts`)**
   - Viết các hàm tính toán thủy lực chuyên biệt chuẩn hóa theo Metcalf & Eddy + TCVN 7957:2008.
   - Thêm các hàm `updateAutoDimensions...` tính kích thước tự động.

3. **Bước 3: Tích hợp Giao diện UnitDetailPage & Modular Sections**
   - Kết nối tất cả các công trình vào màn hình làm việc chi tiết với giao diện 4 tab mượt mà, đồng bộ với popup công thức toán học.

4. **Bước 4: Đồng bộ Báo cáo Thuyết minh (`ReportsPage.tsx`) & Thẻ công trình (`UnitCardsPage.tsx`)**
   - Hiển thị đầy đủ kích thước và tóm tắt thủy lực trong phần III của Báo cáo Thuyết minh và thẻ tóm tắt.

5. **Bước 5: Kiểm tra xác thực (`lint_applet` & `compile_applet`)**
   - Đảm bảo 0 lỗi TypeScript và dev server hoạt động ổn định.
