import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SludgeTankData, UnitTab } from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateSludgeTank,
  updateAutoSludgeTankDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface SludgeTankSectionProps {
  data: SludgeTankData;
  activeTab: UnitTab;
  estimatedSludgeM3Day: number;
  onUpdate: (updated: SludgeTankData, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const SludgeTankSection: React.FC<SludgeTankSectionProps> = ({
  data,
  activeTab,
  estimatedSludgeM3Day,
  onUpdate,
  showFormula,
}) => {
  const result = calculateSludgeTank(data);

  const handleChange = (updates: Partial<SludgeTankData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoSludgeTankDimensions(merged);
    const res = calculateSludgeTank(auto);
    onUpdate(auto, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<SludgeTankData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateSludgeTank(merged);
    onUpdate(merged, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetSludgeFlow = () => {
    const v = estimatedSludgeM3Day > 0 ? roundTo(estimatedSludgeM3Day, 2) : 2.5;
    handleChange({ sludgeVolumePerDay: v, sludgeVolumeOverride: false });
  };

  const autoDimension = () => {
    const adjusted = updateAutoSludgeTankDimensions({ ...data, dimensionsOverride: false });
    const res = calculateSludgeTank(adjusted);
    onUpdate(adjusted, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {/* ================= TAB 1: ĐẦU VÀO ================= */}
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số đầu vào Bể chứa bùn & nén bùn</h2>
              <p className="text-xs text-[#63776d]">
                Lưu trữ bùn sinh học dư từ bể lắng, nén trọng lực tách nước trong trước khi bơm sang máy ép bùn
              </p>
            </div>
            <button
              type="button"
              onClick={resetSludgeFlow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↻ Lấy lại từ bùn dư Aerotank</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng bùn thải vào bể (m³/ngày)
                </label>
                <NumericInput
                  allowNull
                  value={data.sludgeVolumePerDay}
                  onChange={(val) =>
                    handleChange({
                      sludgeVolumePerDay: val === null ? null : roundTo(val, 2),
                      sludgeVolumeOverride: true,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">
                  {data.sludgeVolumeOverride ? 'Đang dùng giá trị nhập riêng' : `Ước tính từ Aerotank (${formatNumber(estimatedSludgeM3Day || 2.5)} m³/ngày)`}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Thời gian lưu trữ bùn thiết kế (ngày)
                </label>
                <NumericInput
                  min={1}
                  max={15}
                  value={data.storageDays}
                  onChange={(val) => handleChange({ storageDays: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 2 – 5 ngày trước khi ép bùn</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Độ ẩm bùn lỏng ban đầu (%)</label>
                <NumericInput
                  min={98.0}
                  max={99.8}
                  value={data.moistureIn}
                  onChange={(val) => handleChange({ moistureIn: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Bùn lắng đợt 2: 99.0 – 99.5%</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Độ ẩm bùn sau khi nén trọng lực (%)</label>
                <NumericInput
                  min={94.0}
                  max={98.0}
                  value={data.moistureOut}
                  onChange={(val) => handleChange({ moistureOut: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Sau nén tự nhiên: 96.0 – 97.0%</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Hình dạng mặt bằng bể</label>
                <select
                  value={data.geometry}
                  onChange={(e) => handleChange({ geometry: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                >
                  <option value="square">Bể vuông (đáy phễu chóp kim tự tháp)</option>
                  <option value="circle">Bể tròn (đáy phễu nón cụt)</option>
                  <option value="rectangle">Bể chữ nhật</option>
                </select>
                <span className="text-[10px] text-[#708477]">Bể vuông hoặc tròn giúp cặn trượt tốt vào tâm hút</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Suất sục khí xáo trộn (m³/m³·h)</label>
                <NumericInput
                  min={0.5}
                  max={3.0}
                  value={data.aerationRate}
                  onChange={(val) => handleChange({ aerationRate: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Sục khí thô chống phân hủy kỵ khí gây hôi: 1.0 – 1.5</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước hữu dụng H (m)</label>
                <NumericInput
                  min={2.0}
                  max={5.0}
                  value={data.waterDepth}
                  onChange={(val) => handleChange({ waterDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Chiều sâu phần hình trụ/hộp: 3.0 – 4.0m</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu phễu thu bùn đáy H<sub>phễu</sub> (m)</label>
                <NumericInput
                  min={0.4}
                  max={1.5}
                  value={data.hopperDepth}
                  onChange={(val) => handleChange({ hopperDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Độ dốc đáy chóp 45° – 60° gom bùn</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao an toàn / bảo vệ (m)</label>
                <NumericInput
                  min={0.3}
                  value={data.freeboard}
                  onChange={(val) => handleChange({ freeboard: val })}
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
                {result.pass ? 'Dung tích bể chứa bùn đạt yêu cầu' : 'Dung tích bể chứa bùn chưa đạt'}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Thể tích thực tế V<sub>tt</sub> = <strong>{formatNumber(result.actualVolume)} m³</strong>{' '}
                {result.pass
                  ? `đáp ứng thời gian lưu trữ bùn ${formatNumber(data.storageDays)} ngày (yêu cầu Vyc = ${formatNumber(result.requiredVolume)} m³). Sau khi nén trọng lực, thể tích bùn giảm còn ${formatNumber(result.thickenedSludgePerDay)} m³/ngày để cấp máy ép bùn.`
                  : `nhỏ hơn thể tích yêu cầu Vyc = ${formatNumber(result.requiredVolume)} m³ (thiếu ${formatNumber(result.deficitVolume)} m³).`}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính toán bể chứa bùn & nén bùn', [
                  '• Thể tích chứa bùn yêu cầu: V_yc = V_bùn/ngày × Số_ngày_lưu  [m³]',
                  '• Thể tích phần thân: V_thân = S_đáy × H_nước  [m³]',
                  '• Thể tích phễu chóp đáy: V_phễu = (1/3) × S_đáy × H_phễu  [m³]',
                  '• Thể tích bùn sau khi nén: V₁ = V₀ × [(100 - P₀) / (100 - P₁)]  [m³/ngày]',
                  '• Lượng chất rắn khô phát sinh: TS = V₀ × 1000 × [(100 - P₀) / 100]  [kg/ngày]',
                  '• Lưu lượng khí sục xáo trộn: Q_khí = V_tt × Suất_khí  [m³/h]',
                  '• Lưu lượng bơm bùn trục vít (chạy ép 4h/ngày): Q_bơm = V₁ / 4  [m³/h]',
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
              <h3 className="text-sm font-bold text-[#183b2b]">Bảng kết quả tính toán lưu chứa bùn & thiết bị ép</h3>
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
                    <td className="py-3 px-5 font-semibold">Dung tích chứa bùn yêu cầu V<sub>yc</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.requiredVolume)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                    <td className="py-3 px-5 text-[#63776d]">Theo thời gian lưu {formatNumber(data.storageDays)} ngày</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Dung tích thực tế thiết kế V<sub>tt</sub> (gồm đáy phễu)</td>
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
                    <td className="py-3 px-5 font-semibold">Thể tích bùn sau khi nén trọng lực</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.thickenedSludgePerDay)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/ngày</td>
                    <td className="py-3 px-5 text-[#63776d]">Độ ẩm giảm từ {formatNumber(data.moistureIn)}% xuống {formatNumber(data.moistureOut)}%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Khối lượng chất rắn khô sinh khối phát sinh</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.drySolidsKgDay)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg TS/ngày</td>
                    <td className="py-3 px-5 text-[#63776d]">Căn cứ tính toán hóa chất polymer keo tụ</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lưu lượng khí sục xáo trộn định kỳ</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.airFlowM3h)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/h</td>
                    <td className="py-3 px-5 text-[#63776d]">Suất {formatNumber(data.aerationRate)} m³/m³·h chống mùi hôi</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lưu lượng bơm trục vít cấp sang máy ép bùn</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.screwPumpFlowRate)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/h</td>
                    <td className="py-3 px-5 text-[#63776d]">Giả định ca ép bùn 4 giờ/ngày</td>
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
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học bể chứa & nén bùn</h2>
              <p className="text-xs text-[#63776d]">
                Kích thước lọt lòng trong công trình, bao gồm phần phễu chóp thu gom cặn đáy
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
              {data.geometry === 'circle' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Đường kính thông thủy D (m)</label>
                  <NumericInput
                    min={1}
                    value={data.diameter}
                    onChange={(val) => handleDimensionDirect({ diameter: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">Chiều dài thông thủy L (m)</label>
                    <NumericInput
                      min={1}
                      value={data.length}
                      onChange={(val) => handleDimensionDirect({ length: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">Chiều rộng thông thủy B (m)</label>
                    <NumericInput
                      min={1}
                      value={data.width}
                      onChange={(val) => handleDimensionDirect({ width: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  min={1.5}
                  value={data.waterDepth}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Độ sâu phễu bùn H<sub>phễu</sub> (m)</label>
                <NumericInput
                  min={0.3}
                  value={data.hopperDepth}
                  onChange={(val) => handleDimensionDirect({ hopperDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao tổng thành bể (m)</label>
                <div className="px-3 py-2.5 rounded-xl bg-[#f5f8f6] border border-[#d2dfd6] text-xs font-extrabold text-[#176b45]">
                  {formatNumber(result.totalHeight)} m
                </div>
                <span className="text-[10px] text-[#708477]">
                  H = {formatNumber(data.waterDepth)}m nước + {formatNumber(data.freeboard)}m an toàn + {formatNumber(data.hopperDepth)}m phễu
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#e2ece5] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[#687d70]">Hình dạng: </span>
                <strong className="text-[#193d2c] font-bold">{data.geometry === 'circle' ? 'Bể tròn' : 'Bể vuông/chữ nhật'}</strong>
              </div>
              <div>
                <span className="text-[#687d70]">Thể tích hữu dụng tổng cộng: </span>
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
            <h2 className="text-sm font-bold text-[#183b2b]">Bảng dự toán thiết bị & phụ kiện bể chứa bùn (BOM)</h2>
            <p className="text-xs text-[#63776d]">
              Bơm bùn trục vít cấp máy ép bùn, hệ thống sục khí thô và ống thu nước tách bùn hồi lưu
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
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">PUM-SLU</td>
                  <td className="py-3 px-4 font-semibold">Bơm bùn trục vít (Mono Progressing Cavity Pump)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Rotor Inox 304, Stator cao su NBR chịu mài mòn, lưu lượng Q = {formatNumber(result.screwPumpFlowRate)} m³/h (áp lực 4 – 6 bar), công suất động cơ 1.5 – 3.0 kW tích hợp biến tần điều chỉnh lưu lượng nạp máy ép
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 1</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">2</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Netzsch / Seepex (Đức) / Mono (Anh)</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">AER-SLU</td>
                  <td className="py-3 px-4 font-semibold">Ống sục khí thô xáo trộn bùn (Coarse Bubble Header)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Hệ thống ống thép không gỉ Inox 304 khoan lỗ sục khí thô D3mm hướng xuống đáy phễu, lưu lượng khí cấp {formatNumber(result.airFlowM3h)} m³/h lấy từ máy thổi khí chính
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Hệ</td>
                  <td className="py-3 px-4">Gia công cơ khí Inox 304</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">DEC-01</td>
                  <td className="py-3 px-4 font-semibold">Đường ống thu nước trong tách bùn (Supernatant Decant)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Ống uPVC D90/D110 có các van chặn lấy nước trong theo 3 cao trình khác nhau, dẫn tự chảy về hầm bơm / bể điều hòa
                  </td>
                  <td className="py-3 px-4 text-center font-bold">Theo tuyến ống</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Cụm</td>
                  <td className="py-3 px-4">Tiền Phong / Bình Minh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
