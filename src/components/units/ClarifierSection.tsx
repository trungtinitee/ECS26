import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SecondaryClarifierData, UnitTab } from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateSecondaryClarifier,
  updateAutoClarifierDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface ClarifierSectionProps {
  data: SecondaryClarifierData;
  activeTab: UnitTab;
  qPeakHour: number;
  onUpdate: (updated: SecondaryClarifierData, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const ClarifierSection: React.FC<ClarifierSectionProps> = ({
  data,
  activeTab,
  qPeakHour,
  onUpdate,
  showFormula,
}) => {
  const result = calculateSecondaryClarifier(data);

  const handleChange = (updates: Partial<SecondaryClarifierData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoClarifierDimensions(merged);
    const res = calculateSecondaryClarifier(auto);
    onUpdate(auto, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<SecondaryClarifierData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateSecondaryClarifier(merged);
    onUpdate(merged, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
    handleChange({ qh, qhOverride: false });
  };

  const autoDimension = () => {
    const adjusted = updateAutoClarifierDimensions({ ...data, dimensionsOverride: false });
    const res = calculateSecondaryClarifier(adjusted);
    onUpdate(adjusted, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {/* ================= TAB 1: ĐẦU VÀO ================= */}
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số đầu vào Bể lắng sinh học (Lắng đợt 2)</h2>
              <p className="text-xs text-[#63776d]">
                Thiết kế tách bùn hoạt tính theo tải trọng thủy lực bề mặt q₀ và tải trọng chất rắn SLR
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
                  Tải trọng bề mặt q₀ (m³/m²·h)
                </label>
                <NumericInput
                  step={0.05}
                  min={0.1}
                  value={data.surfaceOverflowRate}
                  fallbackValue={1.0}
                  onChange={(val) => handleChange({ surfaceOverflowRate: val ?? 1.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn TCVN: 0.8 – 1.2 m³/m²·h</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Nồng độ bùn MLSS vào bể (mg/L)</label>
                <NumericInput
                  step={100}
                  min={100}
                  value={data.mlss}
                  fallbackValue={3000}
                  onChange={(val) => handleChange({ mlss: val ?? 3000 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Dải thông thường: 2.500 – 4.000 mg/L</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Hình dạng mặt bằng bể</label>
                <select
                  value={data.geometry}
                  onChange={(e) => handleChange({ geometry: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                >
                  <option value="circle">Bể lắng tròn (Trục cào gạt bùn trung tâm)</option>
                  <option value="square">Bể lắng vuông (Gạt bùn bán kính)</option>
                  <option value="rectangle">Bể lắng chữ nhật (Dàn cào bùn kiểu xích)</option>
                </select>
                <span className="text-[10px] text-[#708477]">Bể tròn giúp phân phối dòng và thu nước đối xứng nhất</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Tỷ lệ bùn tuần hoàn RAS (%)</label>
                <NumericInput
                  step={5}
                  min={0}
                  value={data.sludgeRecycleRatio}
                  fallbackValue={75}
                  onChange={(val) => handleChange({ sludgeRecycleRatio: val ?? 75 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tuần hoàn bùn về Aerotank (50 – 100%)</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu vùng lắng H (m)</label>
                <NumericInput
                  step={0.1}
                  min={1}
                  value={data.waterDepth}
                  fallbackValue={3.5}
                  onChange={(val) => handleChange({ waterDepth: val ?? 3.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 3.0 – 4.0 m</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao an toàn / bảo vệ (m)</label>
                <NumericInput
                  step={0.1}
                  min={0}
                  value={data.freeboard}
                  fallbackValue={0.5}
                  onChange={(val) => handleChange({ freeboard: val ?? 0.5 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 0.5m</span>
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
                {result.pass ? 'Diện tích bề mặt bể lắng đạt yêu cầu' : 'Diện tích bề mặt bể lắng chưa đạt'}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Diện tích thực tế F<sub>tt</sub> = <strong>{formatNumber(result.actualArea)} m²</strong>{' '}
                {result.pass
                  ? `đáp ứng yêu cầu Fyc = ${formatNumber(result.requiredArea)} m². Tải trọng bề mặt thực tế q₀ = ${formatNumber(result.actualQ0)} m³/m²·h nằm trong giới hạn an toàn.`
                  : `nhỏ hơn diện tích yêu cầu Fyc = ${formatNumber(result.requiredArea)} m² (thiếu ${formatNumber(result.deficitArea)} m²). Cần tăng đường kính hoặc kích thước mặt bằng.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính toán bể lắng sinh học', [
                  '• Diện tích bề mặt yêu cầu: F_yc = Q_h / q₀  [m²]',
                  '• Đường kính bể tròn: D = √(4 × F_yc / π)  [m]',
                  '• Đường kính ống lắng trung tâm: D_well ≈ 0.2 × D  [m]',
                  '• Thể tích vùng lắng: V_lắng = F_tt × H_nước  [m³]',
                  '• Thời gian lưu nước lắng: t = V_lắng / Q_h  [giờ]',
                  '• Tải trọng chất rắn bề mặt: SLR = (Q_h × (1 + R) × MLSS) / (F_tt × 1000)  [kg/m²·h]',
                  '• Chiều dài máng thu nước: L_máng = π × D  (hoặc chu vi máng tràn)',
                  '• Tải trọng máng thu nước tràn: q_w = Q_h / L_máng ≤ 10  [m³/m·h]',
                  '• Lưu lượng bơm bùn tuần hoàn RAS: Q_RAS = R × Q_h  [m³/h]',
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
              <h3 className="text-sm font-bold text-[#183b2b]">Bảng kết quả kiểm tra thủy lực bể lắng</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f9f6] border-b border-[#e5eee8] text-[#3e5648] font-bold">
                    <th className="py-3 px-5">Thông số kiểm tra</th>
                    <th className="py-3 px-5 text-right">Giá trị tính toán</th>
                    <th className="py-3 px-5 text-right">Đơn vị</th>
                    <th className="py-3 px-5">Tiêu chuẩn / Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                  <tr>
                    <td className="py-3 px-5 font-semibold">Diện tích bề mặt yêu cầu F<sub>yc</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.requiredArea)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m²</td>
                    <td className="py-3 px-5 text-[#63776d]">Theo q₀ = {formatNumber(data.surfaceOverflowRate)} m³/m²·h</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Diện tích bề mặt thực tế F<sub>tt</sub></td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.actualArea)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m²</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.pass ? 'bg-[#e7f3ec] text-[#176b45]' : 'bg-[#fdeeed] text-[#b32424]'}`}>
                        {result.pass ? 'Đạt yêu cầu' : 'Chưa đạt'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tải trọng thủy lực bề mặt thực tế q₀</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.actualQ0)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/m²·h</td>
                    <td className="py-3 px-5 text-[#63776d]">Tiêu chuẩn: ≤ 1.2 m³/m²·h</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tải trọng chất rắn bề mặt (Solids Loading Rate)</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.solidsLoadingRateActual)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg/m²·h</td>
                    <td className="py-3 px-5 text-[#63776d]">Tiêu chuẩn TCVN: 3.0 – 5.0 kg/m²·h</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thời gian lưu nước vùng lắng</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.retentionHours)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">giờ</td>
                    <td className="py-3 px-5 text-[#63776d]">Tiêu chuẩn TCVN: 1.5 – 3.0 giờ</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Đường kính ống vách trung tâm D<sub>well</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.centralWellDiameter)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m</td>
                    <td className="py-3 px-5 text-[#63776d]">Bằng 15 – 20% đường kính bể</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Chiều dài máng thu nước tràn L<sub>weir</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.weirLength)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m</td>
                    <td className="py-3 px-5 text-[#63776d]">Chu vi chuỗi răng cưa V-notch</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tải trọng máng thu nước răng cưa q<sub>w</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.weirLoadingRate)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/m·h</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.weirPass ? 'bg-[#e7f3ec] text-[#176b45]' : 'bg-[#fdeeed] text-[#b32424]'}`}>
                        {result.weirPass ? 'Đạt (≤ 10 m³/m·h)' : 'Vượt ngưỡng cho phép'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lưu lượng bơm tuần hoàn bùn RAS</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.rasFlowRate)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/h</td>
                    <td className="py-3 px-5 text-[#63776d]">Bằng {formatNumber(data.sludgeRecycleRatio)}% lưu lượng Qh</td>
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
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học bể lắng sinh học</h2>
              <p className="text-xs text-[#63776d]">
                Kích thước lọt lòng trong công trình, chưa bao gồm chiều dày thành bê tông
              </p>
            </div>
            <button
              type="button"
              onClick={autoDimension}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự động tính kích thước chuẩn</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {data.geometry === 'circle' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Đường kính thông thủy D (m)</label>
                  <NumericInput
                    step={0.05}
                    min={0.5}
                    value={data.diameter}
                    fallbackValue={3}
                    onChange={(val) => handleDimensionDirect({ diameter: val ?? 3 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">Chiều dài lọt lòng L (m)</label>
                    <NumericInput
                      step={0.05}
                      min={0.5}
                      value={data.length}
                      fallbackValue={3}
                      onChange={(val) => handleDimensionDirect({ length: val ?? 3 })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">Chiều rộng lọt lòng B (m)</label>
                    <NumericInput
                      step={0.05}
                      min={0.5}
                      value={data.width}
                      fallbackValue={3}
                      onChange={(val) => handleDimensionDirect({ width: val ?? 3 })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu vùng lắng H (m)</label>
                <NumericInput
                  step={0.1}
                  min={1}
                  value={data.waterDepth}
                  fallbackValue={3.5}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 3.5 })}
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

            {/* Quick Summary Badge */}
            <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#e2ece5] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[#687d70]">Hình dạng: </span>
                <strong className="text-[#193d2c] font-bold">
                  {data.geometry === 'circle' ? 'Bể tròn' : data.geometry === 'square' ? 'Bể vuông' : 'Bể chữ nhật'}
                </strong>
              </div>
              <div>
                <span className="text-[#687d70]">Diện tích bề mặt: </span>
                <strong className="text-[#193d2c] font-bold">
                  {formatNumber(result.actualArea)} m²
                </strong>
              </div>
              <div>
                <span className="text-[#687d70]">Dung tích vùng lắng: </span>
                <strong className="text-[#176b45] font-extrabold">
                  {formatNumber(result.actualVolume)} m³
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: THIẾT BỊ & BOM ================= */}
      {activeTab === 'equipment' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb]">
            <h2 className="text-sm font-bold text-[#183b2b]">Bảng dự toán thiết bị & phụ kiện bể lắng sinh học (BOM)</h2>
            <p className="text-xs text-[#63776d]">
              Hệ gạt bùn, bơm bùn tuần hoàn RAS, máng tràn Inox răng cưa và ống phân phối trung tâm
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
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">SCR-01</td>
                  <td className="py-3 px-4 font-semibold">Cầu gạt bùn & thanh gạt bọt váng bề mặt</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Truyền động trung tâm / bán kính, mô tơ giảm tốc công suất 0.37 – 0.75 kW, tốc độ quay 1 – 3 vòng/giờ, cánh cào bùn đáy nghiêng Inox 304 kèm tấm cao su gạt sạch cặn đáy
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Gia công chế tạo Inox 304 / Nhập khẩu GSD</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">PUM-RAS</td>
                  <td className="py-3 px-4 font-semibold">Bơm chìm hút bùn hoạt tính tuần hoàn (RAS Pump)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Cánh bơm xoáy hở chống tắc (vortex impeller), lưu lượng Q = {formatNumber(result.rasFlowRate)} m³/h, Cột áp H = 6 – 10m, công suất động cơ 0.75 – 1.5 kW
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 1</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">2</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Tsurumi / Ebara / Shinmaywa (Nhật Bản)</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">PUM-WAS</td>
                  <td className="py-3 px-4 font-semibold">Bơm bùn dư xả sang bể chứa bùn (WAS Pump)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Bơm chìm nước thải lẫn bùn, lưu lượng Q = 2 – 5 m³/h, cột áp H = 8m, điều khiển theo rơ-le thời gian hẹn giờ
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Tsurumi / Ebara</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">WEIR-01</td>
                  <td className="py-3 px-4 font-semibold">Máng răng cưa V-notch & Tấm chắn bọt váng</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Vật liệu tấm Inox 304 dày 3mm đột rãnh V 90°, tổng chiều dài L = {formatNumber(result.weirLength)} m kèm tấm chắn bọt scum baffle nhúng sâu 150mm
                  </td>
                  <td className="py-3 px-4 text-center font-bold">Chu vi bể</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Hệ</td>
                  <td className="py-3 px-4">Gia công chế tạo cơ khí Inox 304</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">WELL-01</td>
                  <td className="py-3 px-4 font-semibold">Ống lắng trung tâm phân phối dòng (Center Feed Well)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Đường kính D = {formatNumber(result.centralWellDiameter)} m, chiều cao 1.2 – 1.8m, vật liệu Inox 304 / FRP kèm tấm nón khuếch tán triệt tiêu động năng dòng vào
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Cái</td>
                  <td className="py-3 px-4">Gia công chế tạo theo thiết kế</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
