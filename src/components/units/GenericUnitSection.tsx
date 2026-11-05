import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GenericUnitData, UnitTab } from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateGenericUnit,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface GenericUnitSectionProps {
  unitCatalogName: string;
  data: GenericUnitData;
  activeTab: UnitTab;
  qPeakHour: number;
  qAverageDay: number;
  onUpdate: (updated: GenericUnitData, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const GenericUnitSection: React.FC<GenericUnitSectionProps> = ({
  unitCatalogName,
  data,
  activeTab,
  qPeakHour,
  qAverageDay,
  onUpdate,
  showFormula,
}) => {
  const result = calculateGenericUnit(data);

  const handleChange = (updates: Partial<GenericUnitData>) => {
    const merged = { ...data, ...updates };
    const res = calculateGenericUnit(merged);
    onUpdate(merged, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const isDaily = ['Bể UASB', 'Bể SBR'].includes(unitCatalogName);
    const flow = isDaily ? (qAverageDay > 0 ? roundTo(qAverageDay, 2) : 100) : (qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5);
    handleChange({ flowRate: flow, flowOverride: false });
  };

  const autoDimension = () => {
    const flow = Number(data.flowRate);
    const ret = Number(data.retentionValue);
    const h = Number(data.waterDepth);
    if (!(flow > 0 && ret > 0 && h > 0)) return;

    const vReq = data.retentionUnit === 'phút' ? (flow * ret) / 60 : flow * ret;
    const area = vReq / h;
    const w = Math.max(1.5, roundTo(Math.sqrt(area / 1.5), 2));
    const l = Math.max(2.0, roundTo(area / w, 2));

    const updated = { ...data, width: w, length: l };
    const res = calculateGenericUnit(updated);
    onUpdate(updated, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {/* ================= TAB 1: ĐẦU VÀO ================= */}
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế công nghệ “{unitCatalogName}”</h2>
              <p className="text-xs text-[#63776d]">
                Thiết lập lưu lượng tính toán, thời gian lưu và các tiêu chí thủy lực
              </p>
            </div>
            <button
              type="button"
              onClick={resetFlow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↻ Lấy lại lưu lượng từ Tải lượng</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng thiết kế Q ({data.retentionUnit === 'phút' ? 'm³/h' : 'm³/h hoặc m³/ngày'})
                </label>
                <NumericInput
                  step={0.01}
                  min={0}
                  allowNull
                  value={data.flowRate !== null && data.flowRate !== undefined ? data.flowRate : null}
                  onChange={(val) =>
                    handleChange({
                      flowRate: val,
                      flowOverride: true,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">
                  {data.flowOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng`}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Thời gian lưu thiết kế
                </label>
                <div className="flex gap-2">
                  <NumericInput
                    step={0.5}
                    min={0.1}
                    value={data.retentionValue}
                    fallbackValue={15}
                    onChange={(val) => handleChange({ retentionValue: val ?? 15 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <select
                    value={data.retentionUnit}
                    onChange={(e) => handleChange({ retentionUnit: e.target.value as any })}
                    className="w-24 px-2 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] font-semibold"
                  >
                    <option value="phút">phút</option>
                    <option value="giờ">giờ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước hữu dụng H (m)</label>
                <NumericInput
                  step={0.1}
                  min={0.5}
                  value={data.waterDepth}
                  fallbackValue={2.5}
                  onChange={(val) => handleChange({ waterDepth: val ?? 2.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao an toàn / bảo vệ (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={data.freeboard}
                  fallbackValue={0.5}
                  onChange={(val) => handleChange({ freeboard: val ?? 0.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Công suất điện ước tính (kW)</label>
                <NumericInput
                  step={0.1}
                  min={0}
                  value={data.powerKw}
                  fallbackValue={1.5}
                  onChange={(val) => handleChange({ powerKw: val ?? 1.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Tiêu chí thiết kế / Ghi chú</label>
                <input
                  type="text"
                  value={data.designCriteria}
                  onChange={(e) => handleChange({ designCriteria: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] font-semibold"
                />
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
                {result.pass ? `Dung tích công trình “${unitCatalogName}” đạt yêu cầu` : `Dung tích công trình chưa đạt`}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Thể tích thực tế V<sub>tt</sub> = <strong>{formatNumber(result.actualVolume)} m³</strong>{' '}
                {result.pass
                  ? `đáp ứng yêu cầu Vyc = ${formatNumber(result.requiredVolume)} m³. Thời gian lưu thực tế đạt ${formatNumber(result.actualRetention)} ${data.retentionUnit}.`
                  : `nhỏ hơn thể tích yêu cầu Vyc = ${formatNumber(result.requiredVolume)} m³ (thiếu ${formatNumber(result.deficit)} m³). Hãy tăng kích thước hình học.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula(`Công thức tính toán ${unitCatalogName}`, [
                  data.retentionUnit === 'phút'
                    ? '• Thể tích yêu cầu: V_yc = (Q × t) / 60  [m³]'
                    : '• Thể tích yêu cầu: V_yc = Q × t  [m³]',
                  '• Thể tích thực tế: V_tt = L × B × H_nước  [m³]',
                  '• Thời gian lưu thực tế: t_tt = V_tt / Q  [đơn vị thời gian]',
                  '• Chiều cao tổng công trình: H_tổng = H_nước + H_bảo_vệ  [m]',
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
              <h3 className="text-sm font-bold text-[#183b2b]">Bảng kết quả tính toán thủy lực</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f9f6] border-b border-[#e5eee8] text-[#3e5648] font-bold">
                    <th className="py-3 px-5">Thông số kỹ thuật</th>
                    <th className="py-3 px-5 text-right">Giá trị tính toán</th>
                    <th className="py-3 px-5 text-right">Đơn vị</th>
                    <th className="py-3 px-5">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thể tích hữu dụng yêu cầu V<sub>yc</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.requiredVolume)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                    <td className="py-3 px-5 text-[#63776d]">Theo thời gian {formatNumber(data.retentionValue)} {data.retentionUnit}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thể tích thực tế thiết kế V<sub>tt</sub></td>
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
                    <td className="py-3 px-5 font-semibold">Thời gian lưu nước thực tế</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.actualRetention)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">{data.retentionUnit}</td>
                    <td className="py-3 px-5 text-[#63776d]">V<sub>tt</sub> / Lưu lượng</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Chiều cao tổng thành bể H<sub>tổng</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.totalHeight)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m</td>
                    <td className="py-3 px-5 text-[#63776d]">H nước {formatNumber(data.waterDepth)}m + {formatNumber(data.freeboard)}m an toàn</td>
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
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học “{unitCatalogName}”</h2>
              <p className="text-xs text-[#63776d]">
                Kích thước lọt lòng trong công trình (chưa bao gồm chiều dày vách bê tông)
              </p>
            </div>
            <button
              type="button"
              onClick={autoDimension}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự động tính kích thước</span>
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
                  onChange={(val) => handleChange({ length: val ?? 2 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng thông thủy B (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.5}
                  value={data.width}
                  fallbackValue={1.5}
                  onChange={(val) => handleChange({ width: val ?? 1.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  step={0.1}
                  min={0.5}
                  value={data.waterDepth}
                  fallbackValue={2.5}
                  onChange={(val) => handleChange({ waterDepth: val ?? 2.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] font-bold"
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
                <span className="text-[#687d70]">Diện tích mặt thoáng: </span>
                <strong className="text-[#193d2c] font-bold">{formatNumber(data.length * data.width)} m²</strong>
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
            <h2 className="text-sm font-bold text-[#183b2b]">Bảng thiết bị & phụ kiện công nghệ (BOM)</h2>
            <p className="text-xs text-[#63776d]">
              Hệ thống cơ điện, đường ống công nghệ và phụ kiện lắp đặt cho {unitCatalogName}
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Ghi chú tổng quan thiết bị</label>
              <textarea
                rows={3}
                value={data.equipmentSummary}
                onChange={(e) => handleChange({ equipmentSummary: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] font-medium"
              />
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-4 font-mono font-bold text-[#176b45]">EQ-01</td>
                    <td className="py-3 px-4 font-semibold">Cụm thiết bị công nghệ chính ({unitCatalogName})</td>
                    <td className="py-3 px-4 text-[#445b4e]">
                      Công suất điện định mức ~ {formatNumber(data.powerKw)} kW, tiêu chuẩn công nghiệp IP55/IP68
                    </td>
                    <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                    <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                    <td className="py-3 px-4 text-[#63776d]">Hệ / Bộ</td>
                  </tr>
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-4 font-mono font-bold text-[#176b45]">PIP-01</td>
                    <td className="py-3 px-4 font-semibold">Đường ống công nghệ & Van điều tiết</td>
                    <td className="py-3 px-4 text-[#445b4e]">
                      Ống uPVC Class 3 / Inox 304, van chặn cổng, khớp nối chống rung
                    </td>
                    <td className="py-3 px-4 text-center font-bold">Trọn gói</td>
                    <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                    <td className="py-3 px-4 text-[#63776d]">Hệ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
