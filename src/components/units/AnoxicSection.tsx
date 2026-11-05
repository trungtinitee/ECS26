import React from 'react';
import {
  RotateCcw,
  Calculator,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { AnoxicTankData, UnitTab } from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateAnoxic,
  updateAutoAnoxicDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface AnoxicSectionProps {
  data: AnoxicTankData;
  activeTab: UnitTab;
  qAverageHour: number;
  onUpdate: (updated: AnoxicTankData, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const AnoxicSection: React.FC<AnoxicSectionProps> = ({
  data,
  activeTab,
  qAverageHour,
  onUpdate,
  showFormula,
}) => {
  const result = calculateAnoxic(data);

  const handleChange = (updates: Partial<AnoxicTankData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoAnoxicDimensions(merged);
    const res = calculateAnoxic(auto);
    onUpdate(auto, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<AnoxicTankData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateAnoxic(merged);
    onUpdate(merged, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const qh = qAverageHour > 0 ? roundTo(qAverageHour, 2) : 5;
    handleChange({ qHour: qh, qHourOverride: false });
  };

  const autoDimension = () => {
    const adjusted = updateAutoAnoxicDimensions({ ...data, dimensionsOverride: false });
    const res = calculateAnoxic(adjusted);
    onUpdate(adjusted, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {/* ================= TAB 1: ĐẦU VÀO ================= */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Card 1: Thủy lực & Khuấy trộn */}
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thủy lực & Khuấy trộn thiếu khí</h2>
                <p className="text-xs text-[#63776d]">
                  Thời gian lưu nước HRT, tỷ lệ tuần hoàn bùn/nước hỗn hợp R và khuấy trộn chìm chống lắng
                </p>
              </div>
              <button
                type="button"
                onClick={resetFlow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>↻ Lấy lại Q<sub>giờ</sub> từ Tải lượng</span>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Lưu lượng giờ vào bể Q<sub>h</sub> (m³/h)
                  </label>
                  <NumericInput
                    step={0.01}
                    min={0}
                    allowNull
                    value={data.qHour !== null && data.qHour !== undefined ? data.qHour : null}
                    onChange={(val) =>
                      handleChange({
                        qHour: val,
                        qHourOverride: true,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">
                    {data.qHourOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qAverageHour)} m³/h)`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Thời gian lưu nước HRT (giờ)
                  </label>
                  <NumericInput
                    step={0.5}
                    min={0.5}
                    value={data.hrtHours}
                    fallbackValue={3.0}
                    onChange={(val) => handleChange({ hrtHours: val ?? 3.0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Tiêu chuẩn khử Nitrat: 2.0 – 4.0 giờ</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Tỷ lệ tuần hoàn nội bộ R (lần dòng vào)
                  </label>
                  <NumericInput
                    step={0.5}
                    min={0}
                    value={data.recycleRatio}
                    fallbackValue={2.0}
                    onChange={(val) => handleChange({ recycleRatio: val ?? 2.0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">1.5 – 3.0 (tương ứng tuần hoàn 150% – 300% Q)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Suất công suất khuấy trộn (W/m³)
                  </label>
                  <NumericInput
                    step={1}
                    min={1}
                    value={data.mixingPowerRate}
                    fallbackValue={10}
                    onChange={(val) => handleChange({ mixingPowerRate: val ?? 10 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Khuấy chìm không sục khí: 8 – 12 W/m³</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Số lượng máy khuấy chìm</label>
                  <NumericInput
                    step={1}
                    min={1}
                    value={data.numMixers}
                    fallbackValue={1}
                    onChange={(val) => handleChange({ numMixers: Math.round(val ?? 1) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Máy khuấy chìm cánh Inox 304</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                  <NumericInput
                    step={0.1}
                    min={1.0}
                    value={data.waterDepth}
                    fallbackValue={4.0}
                    onChange={(val) => handleChange({ waterDepth: val ?? 4.0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Thường chọn 3.5 – 4.5m tương đương Aerotank</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Cân bằng khử Nitrat & Nguồn Carbon */}
          <div className="bg-white border border-[#bfe0cd] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#d8ece0] bg-[#f4faf6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176b45]" />
                <h3 className="text-sm font-bold text-[#143d2a]">
                  Cân bằng khử Nitrat (Denitrification) & Nguồn Carbon nội sinh
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#256c45] bg-[#e3f4ea] px-2.5 py-0.5 rounded-full border border-[#c2e5d0]">
                Metcalf & Eddy
              </span>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">BOD₅ đầu vào bể (mg/L)</label>
                  <NumericInput
                    step={5}
                    min={0}
                    value={data.bodIn ?? 250}
                    fallbackValue={250}
                    onChange={(val) => handleChange({ bodIn: val ?? 250 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Nguồn cơ chất điện tử (electron donor) khử NO₃⁻</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Tổng Nitơ TKN đầu vào (mg/L)</label>
                  <NumericInput
                    step={1}
                    min={0}
                    value={data.tknIn ?? 40}
                    fallbackValue={40}
                    onChange={(val) => handleChange({ tknIn: val ?? 40 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Cần BOD/TKN ≥ 3.8 để khử nitrat triệt để</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">NO₃⁻ trong dòng tuần hoàn (mg/L)</label>
                  <NumericInput
                    step={1}
                    min={0}
                    value={data.no3In ?? 25}
                    fallbackValue={25}
                    onChange={(val) => handleChange({ no3In: val ?? 25 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Nitrat sinh ra từ nitrat hóa tại Aerotank tuần hoàn về</span>
                </div>
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
              result.pass && result.carbonAdequate
                ? 'bg-[#eef8f2] border-[#b9dfc8] text-[#176b45]'
                : 'bg-[#fff9ed] border-[#f2d8a7] text-amber-900'
            }`}
          >
            {result.pass && result.carbonAdequate ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            )}
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold">
                {result.pass
                  ? result.carbonAdequate
                    ? 'Bể Anoxic đạt dung tích & Đủ nguồn Carbon hữu cơ'
                    : 'Dung tích đạt - Cần lưu ý nguồn Carbon hữu cơ bổ sung'
                  : 'Dung tích bể Anoxic chưa đạt'}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Thể tích thực tế V<sub>tt</sub> = <strong>{formatNumber(result.actualVolume)} m³</strong>{' '}
                {result.pass
                  ? `đảm bảo thời gian lưu thực tế HRT = ${formatNumber(result.actualHrt)} giờ (yêu cầu ${formatNumber(data.hrtHours)} giờ). Hiệu suất khử Nitrat lý thuyết đạt ${formatNumber(result.denitEfficiency)}%.`
                  : `nhỏ hơn thể tích yêu cầu Vyc = ${formatNumber(result.requiredVolume)} m³ (thiếu ${formatNumber(result.deficitVolume)} m³).`}
              </p>
              <p className="text-xs font-semibold mt-1">
                {result.carbonAdequate ? (
                  <span className="text-[#13663e]">
                    ✓ Tỷ số BOD₅ / TKN = {formatNumber(result.bodToTknRatio)} ≥ 3.8: Nước thải đủ nguồn carbon nội sinh để vi sinh vật dị dưỡng khử sạch nitrat mà không cần châm mật rỉ đường/methanol ngoài.
                  </span>
                ) : (
                  <span className="text-amber-800">
                    ⚠ NGUỒN CARBON THẤP: Tỷ số BOD₅ / TKN = {formatNumber(result.bodToTknRatio)} &lt; 3.8. Cần bổ sung nguồn carbon ngoài (khoảng {formatNumber(result.externalCarbonNeededKgDay)} kg/ngày mật rỉ đường/methanol) để đảm bảo hiệu suất khử nitrat.
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính toán Bể thiếu khí Anoxic (Metcalf & Eddy)', [
                  '• Thể tích thiếu khí yêu cầu: V_yc = Q_h × HRT  [m³]',
                  '• Thể tích thực tế: V_tt = L × B × H_nước  [m³]',
                  '• Hiệu suất khử Nitrat lý thuyết: η = [R / (R + 1)] × 100%',
                  '• Tải lượng Nitrat tuần hoàn: L_NO3 = Q_ngày × NO₃_tuần_hoàn × [R/(R+1)] / 1000  [kg N/d]',
                  '• Oxy hồi phục tương đương: O₂_credit = 2.86 × L_NO3_khử  [kg O₂/d] (giúp giảm tải máy thổi khí Aerotank)',
                  '• Độ kiềm sinh ra hồi phục: Alk_credit = 3.57 × L_NO3_khử  [kg CaCO₃/d] (thu hồi 50% độ kiềm mất đi ở Aerotank)',
                  '• Kiểm tra cơ chất Carbon: Tỷ số BOD₅ / TKN ≥ 3.8 đảm bảo đủ cơ chất',
                  '• Công suất khuấy trộn yêu cầu: P = (V_tt × suất_W_m3) / 1000  [kW]',
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
              <h3 className="text-sm font-bold text-[#183b2b]">1. Bảng tính thủy lực & Thiết bị khuấy trộn/bơm tuần hoàn</h3>
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
                    <td className="py-3 px-5 font-semibold">Thể tích thiếu khí yêu cầu V<sub>yc</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.requiredVolume)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                    <td className="py-3 px-5 text-[#63776d]">Theo HRT = {formatNumber(data.hrtHours)} giờ</td>
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
                    <td className="py-3 px-5 font-semibold">Thời gian lưu nước thực tế HRT</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.actualHrt)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">giờ</td>
                    <td className="py-3 px-5 text-[#63776d]">Tiêu chuẩn: 2.0 – 4.0 giờ</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tỷ lệ tuần hoàn Nitrat R</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(data.recycleRatio * 100, 0)}% (R = {formatNumber(data.recycleRatio)})
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">—</td>
                    <td className="py-3 px-5 text-[#63776d]">Từ cuối Aerotank về đầu Anoxic</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Hiệu suất khử Nitrat lý thuyết ước tính</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.denitEfficiency)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">%</td>
                    <td className="py-3 px-5 text-[#63776d]">R / (R + 1)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lưu lượng bơm tuần hoàn nội bộ</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.recycleFlowRate)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/h</td>
                    <td className="py-3 px-5 text-[#63776d]">Q<sub>recycle</sub> = R × Q<sub>h</sub></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tổng công suất khuấy trộn yêu cầu</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.mixingPowerKwTotal)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kW</td>
                    <td className="py-3 px-5 text-[#63776d]">Suất {formatNumber(data.mixingPowerRate)} W/m³</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Công suất mỗi máy khuấy chìm</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.mixingPowerPerMixer)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kW</td>
                    <td className="py-3 px-5 text-[#63776d]">Bố trí {data.numMixers} máy khuấy</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Cân bằng chuyển hóa Nitrat & Tín chỉ Oxy / Độ kiềm */}
          <div className="bg-white border border-[#bfe0cd] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#d8ece0] bg-[#f4faf6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#176b45]" />
                <h3 className="text-sm font-bold text-[#143d2a]">
                  2. Cân bằng Động học Khử Nitrat & Tín chỉ Oxy / Độ kiềm hoàn hồi
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#256c45] bg-[#e3f4ea] px-2.5 py-0.5 rounded-full border border-[#c2e5d0]">
                Cân bằng sinh hóa liên hoàn
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f9f6] border-b border-[#e5eee8] text-[#3e5648] font-bold">
                    <th className="py-3 px-5">Đại lượng sinh hóa</th>
                    <th className="py-3 px-5 text-right">Giá trị tính toán</th>
                    <th className="py-3 px-5 text-right">Đơn vị</th>
                    <th className="py-3 px-5">Lợi ích công nghệ & Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tải lượng Nitrat tuần hoàn vào Anoxic</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.nitrateRecycledKgDay)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg NO₃⁻-N/d</td>
                    <td className="py-3 px-5 text-[#63776d]">Dựa trên nồng độ NO₃⁻ = {result.no3In} mg/L</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tải lượng Nitrat bị khử thành khí N₂ tự do</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.nitrateRemovedKgDay)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg N/ngày</td>
                    <td className="py-3 px-5 text-[#63776d]">Thoát ra khí quyển dưới dạng khí trơ N₂ an toàn</td>
                  </tr>
                  <tr className="bg-[#f7faf8]">
                    <td className="py-3 px-5 font-bold text-[#176b45]">Tín chỉ Oxy tiết kiệm tương đương (O₂ Credit)</td>
                    <td className="py-3 px-5 text-right font-black tabular-nums text-[#176b45]">
                      {formatNumber(result.o2CreditKgDay)}
                    </td>
                    <td className="py-3 px-5 text-right font-bold text-[#176b45]">kg O₂/ngày</td>
                    <td className="py-3 px-5 text-[#183d2c]">
                      Thu hồi 2.86 kg O₂ / kg NO₃⁻ khử (tiết kiệm điện cho máy thổi khí Aerotank)
                    </td>
                  </tr>
                  <tr className="bg-[#f7faf8]">
                    <td className="py-3 px-5 font-bold text-[#176b45]">Độ kiềm hoàn hồi tự nhiên (Alkalinity Credit)</td>
                    <td className="py-3 px-5 text-right font-black tabular-nums text-[#176b45]">
                      {formatNumber(result.alkalinityRecoveredKgDay)}
                    </td>
                    <td className="py-3 px-5 text-right font-bold text-[#176b45]">kg CaCO₃/d</td>
                    <td className="py-3 px-5 text-[#183d2c]">
                      Sinh ra 3.57 kg CaCO₃ / kg NO₃⁻ khử (bù lại 50% độ kiềm mất đi ở Aerotank)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Tỷ số Carbon hữu cơ / Nitơ (BOD₅ / TKN)</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.bodToTknRatio)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">—</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.carbonAdequate ? 'bg-[#e7f3ec] text-[#176b45]' : 'bg-[#fff0db] text-[#b25e09]'}`}>
                        {result.carbonAdequate ? 'Đủ carbon nội sinh (≥ 3.8)' : 'Thiếu carbon (< 3.8)'}
                      </span>
                    </td>
                  </tr>
                  {!result.carbonAdequate && (
                    <tr className="bg-[#fffdf7]">
                      <td className="py-3 px-5 font-bold text-amber-800">Lượng cơ chất Carbon cần châm bổ sung</td>
                      <td className="py-3 px-5 text-right font-black tabular-nums text-amber-900">
                        {formatNumber(result.externalCarbonNeededKgDay)}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-amber-800">kg/ngày</td>
                      <td className="py-3 px-5 text-amber-800 text-[11px]">
                        Mật rỉ đường hoặc cồn công nghiệp Methanol
                      </td>
                    </tr>
                  )}
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
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học bể Anoxic</h2>
              <p className="text-xs text-[#63776d]">
                Kích thước lọt lòng trong công trình (thường nằm sát liền kề bể Aerotank để tiện đục lỗ thông tường)
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
                  fallbackValue={3}
                  onChange={(val) => handleDimensionDirect({ length: val ?? 3 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng thông thủy B (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.5}
                  value={data.width}
                  fallbackValue={2}
                  onChange={(val) => handleDimensionDirect({ width: val ?? 2 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  step={0.1}
                  min={1.0}
                  value={data.waterDepth}
                  fallbackValue={4}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 4 })}
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
            <h2 className="text-sm font-bold text-[#183b2b]">Bảng dự toán thiết bị & phụ kiện bể Anoxic (BOM)</h2>
            <p className="text-xs text-[#63776d]">
              Hệ máy khuấy chìm, cột nâng hạ Inox 304 và bơm tuần hoàn nitrat nội bộ
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
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">MIX-01</td>
                  <td className="py-3 px-4 font-semibold">Máy khuấy chìm dòng chảy chậm (Submersible Mixer)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Cánh khuấy Inox 304 đường kính 260 – 400mm, công suất ~ {formatNumber(result.mixingPowerPerMixer)} kW (chọn động cơ 0.75 – 1.5 kW), cáp điện bọc kép chống ngấm nước
                  </td>
                  <td className="py-3 px-4 text-center font-bold">{data.numMixers} / 0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">{data.numMixers}</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Faggiolati (Ý) / Tsurumi / Flygt (Thụy Điển)</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">RAIL-01</td>
                  <td className="py-3 px-4 font-semibold">Cột trượt dẫn hướng & Tời nâng hạ máy khuấy</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Thanh trượt vuông hộp Inox 304 50×50mm, giá treo xoay góc định hướng dòng chảy, móc cáp kéo cáp Inox 304
                  </td>
                  <td className="py-3 px-4 text-center font-bold">Theo máy khuấy</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">{data.numMixers}</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Đồng bộ theo máy khuấy Inox 304</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">PUM-NIT</td>
                  <td className="py-3 px-4 font-semibold">Bơm chìm tuần hoàn nước thải hỗn hợp (Internal Nitrate Recycle)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Đặt tại cuối bể Aerotank bơm ngược về đầu Anoxic, lưu lượng Q = {formatNumber(result.recycleFlowRate)} m³/h, Cột áp H = 3 – 5m (cột áp thấp lưu lượng lớn), công suất động cơ 0.75 – 2.2 kW
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 1</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">2</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Ebara / Tsurumi (Nhật Bản)</td>
                </tr>

                {!result.carbonAdequate && (
                  <tr className="hover:bg-[#fbfdfc] bg-[#fffdf7]">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">PMP-CARB-01</td>
                    <td className="py-3 px-4 font-semibold text-amber-900">Bơm định lượng cơ chất Carbon (Mật rỉ / Methanol)</td>
                    <td className="py-3 px-4 text-amber-800">
                      Bơm màng định lượng điều khiển vi sinh, lưu lượng 2 – 10 L/h, kèm bồn chứa PE 300L cung cấp cơ chất khử nitrat (~{formatNumber(result.externalCarbonNeededKgDay)} kg/ngày)
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-900">1 / 1</td>
                    <td className="py-3 px-4 text-center font-extrabold text-amber-700">2</td>
                    <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                    <td className="py-3 px-4">Milton Roy / Doseuro (Mỹ / Ý)</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
