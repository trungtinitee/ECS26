import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DisinfectionTankData, UnitTab } from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateDisinfection,
  updateAutoDisinfectionDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface DisinfectionSectionProps {
  data: DisinfectionTankData;
  activeTab: UnitTab;
  qPeakHour: number;
  onUpdate: (updated: DisinfectionTankData, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const DisinfectionSection: React.FC<DisinfectionSectionProps> = ({
  data,
  activeTab,
  qPeakHour,
  onUpdate,
  showFormula,
}) => {
  const result = calculateDisinfection(data);

  const handleChange = (updates: Partial<DisinfectionTankData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoDisinfectionDimensions(merged);
    const res = calculateDisinfection(auto);
    onUpdate(auto, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<DisinfectionTankData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateDisinfection(merged);
    onUpdate(merged, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
    handleChange({ qh, qhOverride: false });
  };

  const autoDimension = () => {
    const adjusted = updateAutoDisinfectionDimensions({ ...data, dimensionsOverride: false });
    const res = calculateDisinfection(adjusted);
    onUpdate(adjusted, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {/* ================= TAB 1: ĐẦU VÀO ================= */}
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số đầu vào Bể tiếp xúc khử trùng</h2>
              <p className="text-xs text-[#63776d]">
                Tiêu diệt vi sinh vật gây bệnh bằng dung dịch hóa chất khử trùng NaOCl / Clo
              </p>
            </div>
            <button
              type="button"
              onClick={resetFlow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↻ Lấy lại Q<sub>h</sub> từ Tải lượng</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng giờ tính toán Q<sub>h</sub> (m³/h)
                </label>
                <NumericInput
                  step={0.01}
                  min={0}
                  allowNull
                  value={data.qh !== null && data.qh !== undefined ? data.qh : null}
                  onChange={(val) =>
                    handleChange({
                      qh: val,
                      qhOverride: true,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">
                  {data.qhOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qPeakHour)} m³/h)`}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Thời gian tiếp xúc khử trùng t (phút)
                </label>
                <NumericInput
                  step={1}
                  min={5}
                  value={data.contactMinutes}
                  fallbackValue={20}
                  onChange={(val) => handleChange({ contactMinutes: val ?? 20 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn TCVN: 15 – 30 phút</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Liều lượng Clo hoạt tính (mg/L)</label>
                <NumericInput
                  step={0.5}
                  min={0.1}
                  value={data.chlorineDose}
                  fallbackValue={4.0}
                  onChange={(val) => handleChange({ chlorineDose: val ?? 4.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Nước thải sau lắng sinh học: 3.0 – 5.0 mg/L</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Nồng độ dung dịch Javel thương phẩm (%)</label>
                <NumericInput
                  step={0.5}
                  min={0.5}
                  value={data.naoclConcentration}
                  fallbackValue={10}
                  onChange={(val) => handleChange({ naoclConcentration: val ?? 10 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Javel công nghiệp chuẩn thường 10% NaOCl</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Số vách ngăn zic-zac (ngăn)</label>
                <NumericInput
                  step={1}
                  min={1}
                  value={data.channels}
                  fallbackValue={2}
                  onChange={(val) => handleChange({ channels: Math.round(val ?? 2) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Chia dòng tạo chuyển động piston chống góc chết</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Số ngày dự trữ hóa chất (ngày)</label>
                <NumericInput
                  step={1}
                  min={1}
                  value={data.storageDays}
                  fallbackValue={15}
                  onChange={(val) => handleChange({ storageDays: Math.round(val ?? 15) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Dự trữ 15 – 30 ngày để chọn dung tích bồn PE</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  step={0.1}
                  min={0.5}
                  value={data.waterDepth}
                  fallbackValue={2.0}
                  onChange={(val) => handleChange({ waterDepth: val ?? 2.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Thường chọn từ 1.5 – 2.5 m</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao an toàn / bảo vệ (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={data.freeboard}
                  fallbackValue={0.4}
                  onChange={(val) => handleChange({ freeboard: val ?? 0.4 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 0.3 – 0.5 m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TÍNH TOÁN ================= */}
      {activeTab === 'calc' && (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-2xl border flex items-start gap-4 ${
              result.pass
                ? 'bg-[#eef8f2] border-[#b9dfc8] text-[#176b45]'
                : 'bg-[#fff5f5] border-[#f5c6cb] text-[#b32424]'
            }`}
          >
            {result.pass ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#c92a2a]" />
            )}
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold">
                {result.pass ? 'Thời gian tiếp xúc khử trùng đạt yêu cầu' : 'Thể tích bể khử trùng chưa đạt'}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Thể tích thực tế V<sub>tt</sub> = <strong>{formatNumber(result.actualVolume)} m³</strong>{' '}
                {result.pass
                  ? `đảm bảo thời gian tiếp xúc thực tế t = ${formatNumber(result.actualContactTime)} phút (yêu cầu tối thiểu ${formatNumber(data.contactMinutes)} phút). Tỷ lệ dài/rộng kênh = ${formatNumber(result.lengthWidthRatio)} (> 10 đảm bảo dòng chảy nút).`
                  : `nhỏ hơn thể tích yêu cầu Vyc = ${formatNumber(result.requiredVolume)} m³ (thiếu ${formatNumber(result.deficitVolume)} m³).`}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính toán bể khử trùng', [
                  '• Thể tích tiếp xúc yêu cầu: V_yc = (Q_h × t) / 60  [m³]',
                  '• Thể tích thực tế: V_tt = L × B × H_nước  [m³]',
                  '• Thời gian tiếp xúc thực tế: t_tt = (V_tt / Q_h) × 60  [phút]',
                  '• Lượng Clo nguyên chất/ngày: W_Cl2 = (Q_ngày × C_liều) / 1000  [kg/ngày]',
                  '• Lượng dung dịch Javel 10%: V_Javel = W_Cl2 / (10% × 1.18 kg/L)  [Lít/ngày]',
                  '• Lưu lượng bơm định lượng: q_bơm = V_Javel / 24  [Lít/giờ]',
                  '• Dung tích bồn hóa chất PE dự trữ: V_bồn = V_Javel × Số_ngày_dự_trữ  [Lít]',
                ])
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-white text-[#244f37] text-xs font-semibold hover:bg-[#f5f8f6]"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Xem công thức</span>
            </button>
          </div>

          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb]">
              <h3 className="text-sm font-bold text-[#183b2b]">Bảng kết quả tính toán thủy lực & tiêu hao hóa chất</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f9f6] border-b border-[#e5eee8] text-[#3e5648] font-bold">
                    <th className="py-3 px-5">Thông số kỹ thuật</th>
                    <th className="py-3 px-5 text-right">Giá trị tính toán</th>
                    <th className="py-3 px-5 text-right">Đơn vị</th>
                    <th className="py-3 px-5">Tiêu chuẩn / Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thể tích tiếp xúc yêu cầu V<sub>yc</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.requiredVolume)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                    <td className="py-3 px-5 text-[#63776d]">Theo thời gian {formatNumber(data.contactMinutes)} phút</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thể tích tiếp xúc thực tế V<sub>tt</sub></td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.actualVolume)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.pass ? 'bg-[#e7f3ec] text-[#176b45]' : 'bg-[#fdeeed] text-[#b32424]'}`}>
                        {result.pass ? 'Đạt' : 'Chưa đạt'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thời gian tiếp xúc thực tế</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.actualContactTime)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">phút</td>
                    <td className="py-3 px-5 text-[#63776d]">Tiêu chuẩn: ≥ 15 – 30 phút</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Chiều rộng mỗi rãnh dẫn dòng b</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.channelWidth)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m</td>
                    <td className="py-3 px-5 text-[#63776d]">Bể chia {data.channels} ngăn zic-zac</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tỷ lệ chiều dài dòng chảy / chiều rộng (L/b)</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.lengthWidthRatio)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">—</td>
                    <td className="py-3 px-5 text-[#63776d]">Yêu cầu: &gt; 10 (chống ngắn mạch)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Khối lượng Clo hoạt tính nguyên chất cần dùng</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.chlorineKgDay)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg Cl₂/ngày</td>
                    <td className="py-3 px-5 text-[#63776d]">Liều lượng: {formatNumber(data.chlorineDose)} mg/L</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lượng dung dịch nước Javel 10% tiêu thụ</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.javelLitersDay)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">Lít/ngày</td>
                    <td className="py-3 px-5 text-[#63776d]">Khối lượng riêng d = 1.18 kg/L</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lưu lượng bơm định lượng hóa chất</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.dosingPumpLitersHour)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">Lít/h</td>
                    <td className="py-3 px-5 text-[#63776d]">Dải bơm chọn: 0 – 10 L/h</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Dung tích bồn chứa hóa chất PE dự trữ ({data.storageDays} ngày)</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.storageLitersRequired)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">Lít</td>
                    <td className="py-3 px-5 text-[#63776d]">Khuyến nghị bồn PE 500L hoặc 1000L</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: KÍCH THƯỚC ================= */}
      {activeTab === 'dimensions' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học bể khử trùng</h2>
              <p className="text-xs text-[#63776d]">
                Kích thước lọt lòng trong công trình và bố trí các vách ngăn dẫn dòng
              </p>
            </div>
            <button
              type="button"
              onClick={autoDimension}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự động tối ưu kích thước</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài thông thủy L (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.5}
                  value={data.length}
                  fallbackValue={2}
                  onChange={(val) => handleDimensionDirect({ length: val ?? 2 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng tổng thông thủy B (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.5}
                  value={data.width}
                  fallbackValue={1.5}
                  onChange={(val) => handleDimensionDirect({ width: val ?? 1.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  step={0.1}
                  min={0.5}
                  value={data.waterDepth}
                  fallbackValue={2}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 2 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao tổng thành bể (m)</label>
                <div className="px-3 py-2.5 rounded-xl bg-[#f5f8f6] border border-[#d2dfd6] text-xs font-extrabold text-[#176b45]">
                  {formatNumber(result.totalHeight)} m
                </div>
                <span className="text-[10px] text-[#708477]">
                  H = {formatNumber(data.waterDepth)}m nước + {formatNumber(data.freeboard)}m an toàn
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#e2ece5] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[#687d70]">Số ngăn dẫn dòng: </span>
                <strong className="text-[#193d2c] font-bold">{data.channels} ngăn</strong>
              </div>
              <div>
                <span className="text-[#687d70]">Chiều rộng mỗi ngăn b: </span>
                <strong className="text-[#193d2c] font-bold">{formatNumber(result.channelWidth)} m</strong>
              </div>
              <div>
                <span className="text-[#687d70]">Thể tích thực tế: </span>
                <strong className="text-[#176b45] font-extrabold">{formatNumber(result.actualVolume)} m³</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: THIẾT BỊ & BOM ================= */}
      {activeTab === 'equipment' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb]">
            <h2 className="text-sm font-bold text-[#183b2b]">Bảng dự toán thiết bị & phụ kiện bể khử trùng (BOM)</h2>
            <p className="text-xs text-[#63776d]">
              Hệ thống châm định lượng hóa chất Javel, bồn chứa PE và vách ngăn hướng dòng
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f9f6] border-b border-[#e5eee8] text-[#3e5648] font-bold">
                  <th className="py-3 px-4">Mã hiệu</th>
                  <th className="py-3 px-4">Tên thiết bị</th>
                  <th className="py-3 px-4">Thông số kỹ thuật đề xuất</th>
                  <th className="py-3 px-4 text-center">Chạy / DP</th>
                  <th className="py-3 px-4 text-center">Tổng SL</th>
                  <th className="py-3 px-4">Đơn vị</th>
                  <th className="py-3 px-4">Xuất xứ / Hãng tham chiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">TNK-01</td>
                  <td className="py-3 px-4 font-semibold">Bồn chứa dung dịch hóa chất Javel 10% (PE Tank)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Vật liệu nhựa LLDPE nguyên sinh chịu hóa chất ăn mòn, dung tích đề xuất ≥ {formatNumber(result.storageLitersRequired)} Lít (chọn bồn 500L hoặc 1000L), kèm thước thủy hiển thị mức và nắp nạp hóa chất
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Bồn</td>
                  <td className="py-3 px-4">Tân Á Đại Thành / Sơn Hà (Việt Nam)</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">PUM-DOS</td>
                  <td className="py-3 px-4 font-semibold">Bơm định lượng hóa chất dạng màng điện từ</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Đầu bơm PVDF, màng Teflon PTFE, lưu lượng thiết kế Q = {formatNumber(result.dosingPumpLitersHour)} L/h (dải điều chỉnh 0 – 10 L/h), áp lực đối áp P = 5 – 7 bar
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 1</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">2</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Prominent (Đức) / Pulsafeeder (Mỹ) / OBL (Ý)</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">INJ-01</td>
                  <td className="py-3 px-4 font-semibold">Van châm hóa chất & Van một chiều Injector</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Kim châm chống chảy ngược kết nối ống Teflon PTFE D6/D8 nhúng trực tiếp vào đường ống nước thải vào bể khử trùng
                  </td>
                  <td className="py-3 px-4 text-center font-bold">Theo tuyến bơm</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">2</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Đồng bộ theo bơm định lượng</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">BAF-01</td>
                  <td className="py-3 px-4 font-semibold">Hệ thống vách ngăn hướng dòng zic-zac</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Tấm vách ngăn Composite FRP hoặc xây gạch trát vữa chống thấm, chia {data.channels} khoang dòng chảy zic-zac
                  </td>
                  <td className="py-3 px-4 text-center font-bold">Theo công trình</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Hệ</td>
                  <td className="py-3 px-4">Gia công lắp đặt tại công trình</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
