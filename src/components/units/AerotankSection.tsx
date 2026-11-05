import React from 'react';
import {
  RotateCcw,
  Calculator,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Droplets,
  FlaskConical,
  Activity,
} from 'lucide-react';
import { AerotankData, UnitTab } from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateAerotank,
  updateAutoAerotankDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface AerotankSectionProps {
  data: AerotankData;
  activeTab: UnitTab;
  qAverageDay: number;
  bodInAvg: number;
  onUpdate: (updated: AerotankData, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const AerotankSection: React.FC<AerotankSectionProps> = ({
  data,
  activeTab,
  qAverageDay,
  bodInAvg,
  onUpdate,
  showFormula,
}) => {
  const result = calculateAerotank(data);

  const handleChange = (updates: Partial<AerotankData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoAerotankDimensions(merged);
    const res = calculateAerotank(auto);
    onUpdate(auto, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<AerotankData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateAerotank(merged);
    onUpdate(merged, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const q = qAverageDay > 0 ? roundTo(qAverageDay, 2) : 100;
    handleChange({ q, qOverride: false });
  };

  const resetBodIn = () => {
    const b = bodInAvg > 0 ? bodInAvg : 250;
    handleChange({ bodIn: b });
  };

  const autoDimension = () => {
    const adjusted = updateAutoAerotankDimensions({ ...data, dimensionsOverride: false });
    const res = calculateAerotank(adjusted);
    onUpdate(adjusted, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {/* ================= TAB 1: ĐẦU VÀO ================= */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Card 1: Thông số thủy lực & Phân hủy BOD */}
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thủy lực & Tải trọng hữu cơ BOD₅</h2>
                <p className="text-xs text-[#63776d]">
                  Tính toán thể tích theo tỷ số F/M, nồng độ bùn hoạt tính MLSS và chiều sâu làm việc
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>↻ Lấy lại Q từ Tải lượng</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Lưu lượng thiết kế Q (m³/ngày)
                  </label>
                  <NumericInput
                    allowNull
                    value={data.q}
                    onChange={(val) =>
                      handleChange({
                        q: val === null ? null : roundTo(val, 2),
                        qOverride: true,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">
                    {data.qOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qAverageDay)} m³/ngày)`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#234333]">BOD₅ đầu vào S₀ (mg/L)</label>
                    <button
                      type="button"
                      onClick={resetBodIn}
                      className="text-[10px] text-[#176b45] hover:underline"
                    >
                      Lấy từ Tải lượng
                    </button>
                  </div>
                  <NumericInput
                    min={0}
                    defaultValue={250}
                    value={data.bodIn}
                    onChange={(val) => handleChange({ bodIn: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">BOD₅ nước thải sau bể điều hòa</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">BOD₅ đầu ra mong muốn S (mg/L)</label>
                  <NumericInput
                    min={0}
                    defaultValue={20}
                    value={data.bodOut}
                    onChange={(val) => handleChange({ bodOut: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">QCVN 40:2011/BTNMT Cột A: 30 mg/L</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Nồng độ bùn hoạt tính MLSS (mg/L)</label>
                  <NumericInput
                    step="100"
                    min={500}
                    defaultValue={3000}
                    value={data.mlss}
                    onChange={(val) => handleChange({ mlss: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Dải điển hình Aerotank: 2.500 – 4.000 mg/L</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Tỷ lệ MLVSS / MLSS</label>
                  <NumericInput
                    step="0.05"
                    min={0.1}
                    max={1}
                    defaultValue={0.8}
                    value={data.mlvssRatio}
                    onChange={(val) => handleChange({ mlvssRatio: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Tỷ số sinh khối bay hơi hữu cơ (0.75 – 0.85)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Tải trọng hữu cơ F/M (kg BOD/kg MLVSS.d)</label>
                  <NumericInput
                    step="0.05"
                    min={0.01}
                    defaultValue={0.3}
                    value={data.fmRatio}
                    onChange={(val) => handleChange({ fmRatio: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Aerotank thông thường: 0.20 – 0.40</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước hữu dụng H (m)</label>
                  <NumericInput
                    step="0.1"
                    min={0.5}
                    defaultValue={4.0}
                    value={data.waterDepth}
                    onChange={(val) => handleChange({ waterDepth: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Chiều sâu cột nước hiệu quả hòa tan oxy (3.5 – 5.0m)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều cao an toàn / bảo vệ (m)</label>
                  <NumericInput
                    step="0.1"
                    min={0.1}
                    defaultValue={0.5}
                    value={data.freeboard}
                    onChange={(val) => handleChange({ freeboard: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 0.5 – 0.8m chống bọt trào</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Tuổi bùn thiết kế SRT θc (ngày)</label>
                  <NumericInput
                    step="1"
                    min={1}
                    defaultValue={12}
                    value={data.srtDays ?? 12}
                    onChange={(val) => handleChange({ srtDays: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Khuyến nghị ≥ 10 – 15 ngày để vi khuẩn nitrat hóa không bị trôi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Thông số quá trình Nitrat hóa (Nitrification) - Chuyên sâu Metcalf & Eddy */}
          <div className="bg-white border border-[#bfe0cd] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#d8ece0] bg-[#f4faf6] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#176b45]/10 text-[#176b45] flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#143d2a]">
                    Quá trình Nitrat hóa sinh học (Nitrification) & Cân bằng Amoni
                  </h2>
                  <p className="text-xs text-[#527060]">
                    Mô hình động học vi khuẩn tự dưỡng Nitrosomonas / Nitrobacter, nhu cầu oxy NOD và đệm kiềm
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.includeNitrification ?? true}
                  onChange={(e) => handleChange({ includeNitrification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#176b45]"></div>
                <span className="ml-2.5 text-xs font-bold text-[#1a3d2c]">
                  {data.includeNitrification ?? true ? 'Đang kích hoạt' : 'Tắt nitrat hóa'}
                </span>
              </label>
            </div>

            <div className="p-6 space-y-5">
              {(data.includeNitrification ?? true) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Nồng độ N-NH₄⁺ đầu vào bể (mg/L)
                    </label>
                    <NumericInput
                      min={0}
                      defaultValue={30}
                      value={data.nh4In ?? 30}
                      onChange={(val) => handleChange({ nh4In: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">N-NH₄⁺ dòng vào sau bể lắng sơ bộ / điều hòa</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      N-NH₄⁺ mục tiêu đầu ra (mg/L)
                    </label>
                    <NumericInput
                      step="0.5"
                      min={0}
                      max={50}
                      defaultValue={5}
                      value={data.nh4Out ?? 5}
                      onChange={(val) => handleChange({ nh4Out: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">QCVN 40-A: ≤ 5 mg/L | QCVN 14-A: ≤ 5 mg/L</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Nhiệt độ nước thải thiết kế T (°C)
                    </label>
                    <NumericInput
                      step="1"
                      min={10}
                      max={45}
                      defaultValue={25}
                      value={data.temperatureC ?? 25}
                      onChange={(val) => handleChange({ temperatureC: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">
                      Nhiệt độ thấp làm giảm mạnh tốc độ sinh trưởng của vi khuẩn nitrat hóa
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Nồng độ Oxy hòa tan duy trì DO (mg/L)
                    </label>
                    <NumericInput
                      step="0.2"
                      min={0.5}
                      max={6.0}
                      defaultValue={2.0}
                      value={data.targetDo ?? 2.0}
                      onChange={(val) => handleChange({ targetDo: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">
                      Khuyến nghị DO ≥ 2.0 mg/L để tránh ức chế động học nitrat hóa
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Độ kiềm ban đầu của nước thải (mg/L CaCO₃)
                    </label>
                    <NumericInput
                      step="10"
                      min={20}
                      max={1000}
                      defaultValue={220}
                      value={data.alkalinityIn ?? 220}
                      onChange={(val) => handleChange({ alkalinityIn: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">
                      Cần đủ đệm kiềm để pH không sụt giảm dưới 6.8 gây chết vi khuẩn
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#234333]">
                      Năng suất 1 đĩa khí (m³/h·đĩa)
                    </label>
                    <NumericInput
                      step="0.1"
                      min={0.5}
                      max={10.0}
                      defaultValue={2.5}
                      value={data.diffuserCapacity}
                      onChange={(val) => handleChange({ diffuserCapacity: val })}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                    />
                    <span className="text-[10px] text-[#708477]">Đĩa bọt mịn D270mm: 2.0 – 3.0 m³/h·cái</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#e0ece4] text-xs text-[#527060]">
                  Chế độ nitrat hóa đang tạm tắt. Bể Aerotank sẽ chỉ tính toán nhu cầu oxy phân hủy hợp chất hữu cơ carbonaceous (CBOD) mà không bao gồm nhu cầu oxy cho nitrat hóa amoni (NOD).
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TÍNH TOÁN ================= */}
      {activeTab === 'calc' && (
        <div className="space-y-6">
          {/* Status banner */}
          <div
            className={`p-5 rounded-2xl border flex items-start gap-4 ${
              result.pass && result.srtPass
                ? 'bg-[#eef8f2] border-[#b9dfc8] text-[#176b45]'
                : 'bg-[#fff5f5] border-[#f5c6cb] text-[#b32424]'
            }`}
          >
            {result.pass && result.srtPass ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#c92a2a]" />
            )}
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold">
                {result.pass && result.srtPass
                  ? 'Thiết kế Aerotank & Nitrat hóa Đạt yêu cầu kỹ thuật'
                  : 'Cần hiệu chỉnh thiết kế công nghệ Aerotank'}
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                Thể tích thực tế V<sub>tt</sub> = <strong>{formatNumber(result.actual)} m³</strong>{' '}
                {result.pass
                  ? `đáp ứng tốt thể tích yêu cầu Vyc = ${formatNumber(result.required)} m³ (đạt ${(result.ratio * 100).toFixed(1)}%).`
                  : `nhỏ hơn thể tích yêu cầu Vyc = ${formatNumber(result.required)} m³ (thiếu ${formatNumber(result.deficit)} m³). Hãy tăng kích thước ở Tab Kích thước.`}
              </p>
              {result.includeNitrification && (
                <p className="text-xs font-semibold mt-1">
                  {result.srtPass ? (
                    <span className="text-[#13663e]">
                      ✓ Tuổi bùn θc = {result.designSrtDays} ngày an toàn cao hơn tuổi bùn tới hạn θc_min = {formatNumber(result.minSrtDays)} ngày (Hệ số an toàn SF = {formatNumber(result.srtSafetyFactor)} ≥ 1.5).
                    </span>
                  ) : (
                    <span className="text-[#c92a2a]">
                      ⚠ NGUY CƠ TRÔI BÙN NITRAT HÓA: Tuổi bùn thiết kế θc = {result.designSrtDays} ngày chưa đạt ngưỡng an toàn (θc_min = {formatNumber(result.minSrtDays)} ngày, SF = {formatNumber(result.srtSafetyFactor)} &lt; 1.5). Vui lòng tăng Tuổi bùn thiết kế SRT lên ≥ {formatNumber(result.minSrtDays * 1.5)} ngày.
                    </span>
                  )}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính toán Aerotank & Nitrat hóa (Metcalf & Eddy)', [
                  '• Thể tích bể Aerotank: V_yc = (Q × S₀) / ((F/M) × Xv)  [m³]',
                  '• Nồng độ amoni đồng hóa vào sinh khối: N_syn = 0.05 × (S₀ - S)  [mg/L]',
                  '• Lượng amoni cần oxy hóa: N_ox = max(0, NH₄_vào - N_syn - NH₄_ra)  [mg/L]',
                  '• Nhu cầu oxy phân hủy BOD (CBOD): O₂_CBOD = 0.55 × ΔBOD·Q/1000 + 0.075 × Xv·V/1000  [kg O₂/d]',
                  '• Nhu cầu oxy nitrat hóa (NOD): O₂_NOD = 4.57 × (N_ox × Q / 1000)  [kg O₂/d]',
                  '• Tổng oxy thiết kế: O₂_tổng = O₂_CBOD + O₂_NOD  [kg O₂/d]',
                  '• Động học vi khuẩn nitrat hóa: μ_nm(T) = 0.75 × 1.098^(T - 20); K_N = 10^(0.051·T - 1.158)',
                  '• Tốc độ sinh trưởng thực tế: μ_n = μ_nm × [N/(K_N + N)] × [DO/(0.5 + DO)] - b_n',
                  '• Tuổi bùn tới hạn chống trôi vi khuẩn: θc_min = 1 / μ_n  [ngày]',
                  '• Tiêu hao độ kiềm: Alk_tiêu_hao = 7.14 × N_ox  [mg/L CaCO₃]',
                  '• Độ kiềm dư: Alk_dư = Alk_vào - Alk_tiêu_hao (phải ≥ 70 mg/L để tránh sụt pH)',
                  '• Lượng NaHCO₃ cần châm bù = Thiếu_hụt_kiềm × 1.68  [kg NaHCO₃/d]',
                ])
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-white text-[#244f37] text-xs font-semibold hover:bg-[#f5f8f6]"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Xem công thức</span>
            </button>
          </div>

          {/* Table 1: Bảng kết quả Thủy lực & BOD */}
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb]">
              <h3 className="text-sm font-bold text-[#183b2b]">1. Thủy lực & Khử hợp chất hữu cơ Carbonaceous (BOD₅)</h3>
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
                    <td className="py-3 px-5 font-semibold">Tải lượng BOD₅ nạp vào hệ thống</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.bodLoadKg)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg BOD₅/ngày</td>
                    <td className="py-3 px-5 text-[#63776d]">Q × S₀ / 1000</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Hiệu suất xử lý BOD₅ thiết kế</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.bodRemovalPercent)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">%</td>
                    <td className="py-3 px-5 text-[#63776d]">Chuẩn Aerotank: 85 – 95%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thể tích nước hữu dụng yêu cầu V<sub>yc</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.required)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³</td>
                    <td className="py-3 px-5 text-[#63776d]">Dựa trên F/M = {formatNumber(data.fmRatio)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Thể tích thực tế thiết kế V<sub>tt</sub></td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.actual)}
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
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.actualHrt)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">giờ</td>
                    <td className="py-3 px-5 text-[#63776d]">Tiêu chuẩn TCVN: 6 – 12 giờ</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Nhu cầu oxy phân hủy BOD (O₂_CBOD)</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.o2CbodDaily)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg O₂/ngày</td>
                    <td className="py-3 px-5 text-[#63776d]">0.55 × ΔBOD + 0.075 × Xv·V</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Bảng chi tiết Nitrat hóa, Động học vi sinh & Đệm kiềm */}
          {result.includeNitrification && (
            <div className="bg-white border border-[#bfe0cd] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#d8ece0] bg-[#f4faf6] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#176b45]" />
                  <h3 className="text-sm font-bold text-[#143d2a]">
                    2. Cân bằng Nitrat hóa, Động học Nitrosomonas & Độ kiềm (Metcalf & Eddy)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-[#256c45] bg-[#e3f4ea] px-2.5 py-0.5 rounded-full border border-[#c2e5d0]">
                  Tiêu chuẩn quốc tế Metcalf & Eddy 5th
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f5f9f6] border-b border-[#e5eee8] text-[#3e5648] font-bold">
                      <th className="py-3 px-5">Đại lượng động học & Hóa nghiệm</th>
                      <th className="py-3 px-5 text-right">Giá trị tính toán</th>
                      <th className="py-3 px-5 text-right">Đơn vị</th>
                      <th className="py-3 px-5">Ý nghĩa & Đánh giá công nghệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                    <tr>
                      <td className="py-3 px-5 font-semibold">Amoni đồng hóa vào sinh khối tế bào (N_syn)</td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums">
                        {formatNumber(result.nSynthesisMgL)} mg/L ({formatNumber(result.nSynthesisKgDay)} kg/d)
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">kg N/ngày</td>
                      <td className="py-3 px-5 text-[#63776d]">Chiếm 5% khối lượng BOD loại bỏ</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold">Tải lượng Amoni cần oxy hóa (N_ox)</td>
                      <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                        {formatNumber(result.nOxidizedMgL)} mg/L ({formatNumber(result.nOxidizedKgDay)} kg/d)
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">kg N/ngày</td>
                      <td className="py-3 px-5 text-[#63776d]">NH₄_vào - N_syn - NH₄_ra_mục_tiêu</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold">Nhu cầu oxy cho nitrat hóa (NOD)</td>
                      <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                        {formatNumber(result.o2NitrificationDaily)}
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">kg O₂/ngày</td>
                      <td className="py-3 px-5 text-[#63776d]">
                        4.57 kg O₂ / kg N oxy hóa (tăng thêm {formatNumber((result.o2NitrificationDaily / (result.o2CbodDaily || 1)) * 100)}% so với CBOD)
                      </td>
                    </tr>
                    <tr className="bg-[#f7faf8]">
                      <td className="py-3 px-5 font-bold text-[#176b45]">TỔNG NHU CẦU OXY THỰC TẾ (CBOD + NOD)</td>
                      <td className="py-3 px-5 text-right font-black tabular-nums text-[#176b45] text-sm">
                        {formatNumber(result.o2Daily)}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-[#176b45]">kg O₂/ngày</td>
                      <td className="py-3 px-5 font-semibold text-[#183d2c]">
                        Căn cứ chính xác để chọn máy thổi khí & đĩa phân phối
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold">Tốc độ sinh trưởng riêng vi khuẩn nitrat hóa μ_n</td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums">
                        {formatNumber(result.muNetNitrifier, 4)}
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">ngày⁻¹</td>
                      <td className="py-3 px-5 text-[#63776d]">
                        Ở T = {result.temperatureC}°C, DO = {formatNumber(result.targetDo)} mg/L (μ_nm = {formatNumber(result.muMaxNitrifier, 3)})
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold">Tuổi bùn tối thiểu tới hạn θc_min</td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums">
                        {formatNumber(result.minSrtDays)}
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">ngày</td>
                      <td className="py-3 px-5 text-[#63776d]">Ngưỡng rửa trôi vi sinh vật nitrat hóa (1 / μ_n)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold">Tuổi bùn thiết kế θc & Hệ số an toàn SF</td>
                      <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                        θc = {result.designSrtDays} ngày (SF = {formatNumber(result.srtSafetyFactor)})
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">—</td>
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.srtPass ? 'bg-[#e7f3ec] text-[#176b45]' : 'bg-[#fdeeed] text-[#b32424]'}`}>
                          {result.srtPass ? 'Đạt an toàn (SF ≥ 1.5)' : 'Không an toàn (Nguy cơ trôi bùn)'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold">Độ kiềm bị tiêu hao do nitrat hóa</td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums">
                        {formatNumber(result.alkalinityConsumedMgL)} mg/L ({formatNumber(result.alkalinityConsumedKgDay)} kg/d)
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">kg CaCO₃/d</td>
                      <td className="py-3 px-5 text-[#63776d]">Mất 7.14 kg CaCO₃ / kg N oxy hóa</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-semibold">Độ kiềm còn lại trong nước thải</td>
                      <td className="py-3 px-5 text-right font-bold tabular-nums">
                        {formatNumber(result.residualAlkalinityMgL)}
                      </td>
                      <td className="py-3 px-5 text-right text-[#728578]">mg/L CaCO₃</td>
                      <td className="py-3 px-5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${result.alkalinitySufficient ? 'bg-[#e7f3ec] text-[#176b45]' : 'bg-[#fef4e5] text-[#b25e09]'}`}>
                          {result.alkalinitySufficient ? 'Đủ kiềm đệm (≥ 70 mg/L)' : 'Thiếu kiềm đệm (< 70 mg/L)'}
                        </span>
                      </td>
                    </tr>
                    {!result.alkalinitySufficient && (
                      <tr className="bg-[#fff9ed]">
                        <td className="py-3 px-5 font-bold text-amber-800">Lượng NaHCO₃ cần châm bổ sung hàng ngày</td>
                        <td className="py-3 px-5 text-right font-black tabular-nums text-amber-900 text-sm">
                          {formatNumber(result.nahco3DosingKgDay)}
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-amber-800">kg NaHCO₃/d</td>
                        <td className="py-3 px-5 text-amber-800 text-[11px]">
                          Châm qua hệ thống hóa chất để duy trì pH 6.8 – 7.2 ổn định
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 3: Bảng chọn máy thổi khí & đĩa thổi khí */}
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb]">
              <h3 className="text-sm font-bold text-[#183b2b]">3. Thông số hệ thống cấp khí & Máy thổi khí (Roots Blower)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f9f6] border-b border-[#e5eee8] text-[#3e5648] font-bold">
                    <th className="py-3 px-5">Thông số cấp khí</th>
                    <th className="py-3 px-5 text-right">Giá trị thiết kế</th>
                    <th className="py-3 px-5 text-right">Đơn vị</th>
                    <th className="py-3 px-5">Tiêu chuẩn kỹ thuật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef] text-[#243f30]">
                  <tr>
                    <td className="py-3 px-5 font-semibold">Nhu cầu oxy giờ đỉnh (O₂_peak)</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.o2PeakHour)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg O₂/h</td>
                    <td className="py-3 px-5 text-[#63776d]">Hệ số k<sub>đỉnh</sub> = 1.4</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lưu lượng khí cấp yêu cầu Q<sub>khí</sub></td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {formatNumber(result.airFlowM3h)} ({formatNumber(result.airFlowM3min)} m³/phút)
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/h</td>
                    <td className="py-3 px-5 text-[#63776d]">Hiệu suất hòa tan Ea ≈ 10%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Số lượng đĩa phân phối bọt mịn D270mm</td>
                    <td className="py-3 px-5 text-right font-extrabold tabular-nums text-[#176b45]">
                      {result.diffuserCount}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">đĩa</td>
                    <td className="py-3 px-5 text-[#63776d]">Công suất: {formatNumber(data.diffuserCapacity)} m³/h·đĩa</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Áp lực máy thổi khí</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.blowerPressureKpa)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kPa</td>
                    <td className="py-3 px-5 text-[#63776d]">Cột nước {formatNumber(data.waterDepth)}m + 0.8m tổn thất</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Công suất động cơ máy thổi khí</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">
                      {formatNumber(result.blowerPowerKw)}
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kW</td>
                    <td className="py-3 px-5 text-[#63776d]">Đã tính hệ số an toàn k = 1.2</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-5 font-semibold">Lượng bùn hoạt tính dư sinh ra</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">
                      {formatNumber(result.excessSludgeKgDay)} kg/ngày (~{formatNumber(result.excessSludgeM3Day)} m³/ngày)
                    </td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg TSS/d</td>
                    <td className="py-3 px-5 text-[#63776d]">Bùn dị dưỡng + tự dưỡng, độ ẩm 99.2%</td>
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
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học bể Aerotank</h2>
              <p className="text-xs text-[#63776d]">
                Kích thước lọt lòng trong công trình (chưa bao gồm chiều dày vách bê tông cốt thép)
              </p>
            </div>
            <button
              type="button"
              onClick={autoDimension}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự động tối ưu L/B ≈ 2.0</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài thông thủy L (m)</label>
                <NumericInput
                  step="0.05"
                  min={0.5}
                  defaultValue={4}
                  value={data.length}
                  onChange={(val) => handleDimensionDirect({ length: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng thông thủy B (m)</label>
                <NumericInput
                  step="0.05"
                  min={0.5}
                  defaultValue={2}
                  value={data.width}
                  onChange={(val) => handleDimensionDirect({ width: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước hữu dụng H (m)</label>
                <NumericInput
                  step="0.1"
                  min={0.5}
                  defaultValue={4}
                  value={data.waterDepth}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val })}
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

            {/* Visual dimension preview */}
            <div className="p-4 rounded-xl bg-[#f8faf9] border border-[#e2ece5] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[#687d70]">Tỷ lệ L/B: </span>
                  <strong className="text-[#193d2c] font-bold">
                    {data.width > 0 ? (data.length / data.width).toFixed(2) : 1}
                  </strong>
                </div>
                <div>
                  <span className="text-[#687d70]">Diện tích mặt thoáng: </span>
                  <strong className="text-[#193d2c] font-bold">
                    {formatNumber(data.length * data.width)} m²
                  </strong>
                </div>
                <div>
                  <span className="text-[#687d70]">Dung tích xây dựng: </span>
                  <strong className="text-[#176b45] font-extrabold">
                    {formatNumber(data.length * data.width * result.totalHeight)} m³
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: THIẾT BỊ & BOM ================= */}
      {activeTab === 'equipment' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb]">
            <h2 className="text-sm font-bold text-[#183b2b]">Bảng dự toán thiết bị & phụ kiện bể Aerotank (BOM)</h2>
            <p className="text-xs text-[#63776d]">
              Hệ thống máy thổi khí (tính toán cho cả khử BOD và Nitrat hóa), đĩa phân phối, cảm biến DO và định lượng kiềm
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
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">BLW-01</td>
                  <td className="py-3 px-4 font-semibold">Máy thổi khí kiểu Root 3 thùy (Roots Blower)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Lưu lượng Q = {formatNumber(result.airFlowM3h)} m³/h ({formatNumber(result.airFlowM3min)} m³/phút), Cột áp P = {formatNumber(result.blowerPressureKpa)} kPa, Công suất động cơ ~ {formatNumber(result.blowerPowerKw)} kW (đã cộng nhu cầu oxy nitrat hóa), kèm van giảm áp, khớp nối mềm, giảm thanh
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 1</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">2</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Heywel / Longtech (Đài Loan), Aerzen (Đức)</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">DIF-01</td>
                  <td className="py-3 px-4 font-semibold">Đĩa phân phối khí bọt mịn (Fine Bubble Diffuser)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Đường kính D270mm, màng EPDM cao cấp vi đục lỗ laser, khung nhựa PP gia cường, kết nối ren 3/4" NPT
                  </td>
                  <td className="py-3 px-4 text-center font-bold">Lắp toàn bộ</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">{result.diffuserCount}</td>
                  <td className="py-3 px-4 text-[#63776d]">Cái</td>
                  <td className="py-3 px-4">Jaeger (Đức) / SSI (Mỹ) / EDI</td>
                </tr>

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">SEN-01</td>
                  <td className="py-3 px-4 font-semibold">Cảm biến & Bộ hiển thị DO online (Dissolved Oxygen)</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Dải đo 0 – 20 mg/L, công nghệ quang học huỳnh quang (optical), ngõ ra 4 – 20mA / Modbus RS485 tự động điều khiển biến tần máy thổi khí duy trì DO ≥ {formatNumber(result.targetDo)} mg/L
                  </td>
                  <td className="py-3 px-4 text-center font-bold">1 / 0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                  <td className="py-3 px-4">Hach (Mỹ) / Endress+Hauser (Thụy Sĩ)</td>
                </tr>

                {!result.alkalinitySufficient && (
                  <tr className="hover:bg-[#fbfdfc] bg-[#fffdf7]">
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">PMP-ALK-01</td>
                    <td className="py-3 px-4 font-semibold text-amber-900">Bơm định lượng kiềm NaHCO₃ / Soda tự động</td>
                    <td className="py-3 px-4 text-amber-800">
                      Lưu lượng định lượng 5 – 20 L/h, màng PTFE chịu hóa chất, kèm bồn pha hóa chất PE 500L và cánh khuấy trộn hóa chất (bổ sung ~{formatNumber(result.nahco3DosingKgDay)} kg/ngày)
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-900">1 / 1</td>
                    <td className="py-3 px-4 text-center font-extrabold text-amber-700">2</td>
                    <td className="py-3 px-4 text-[#63776d]">Bộ</td>
                    <td className="py-3 px-4">OBL / Milton Roy (Ý / Mỹ)</td>
                  </tr>
                )}

                <tr className="hover:bg-[#fbfdfc]">
                  <td className="py-3 px-4 font-mono font-bold text-[#176b45]">PIP-01</td>
                  <td className="py-3 px-4 font-semibold">Đường ống cấp khí chính & nhánh phân phối đáy bể</td>
                  <td className="py-3 px-4 text-[#445b4e]">
                    Trục chính ống thép không gỉ Inox 304 chịu nhiệt; ống nhánh đáy bể uPVC Class 3 / Inox 304 kèm đai treo kẹp sàn SS304
                  </td>
                  <td className="py-3 px-4 text-center font-bold">Trọn gói</td>
                  <td className="py-3 px-4 text-center font-extrabold text-[#176b45]">1</td>
                  <td className="py-3 px-4 text-[#63776d]">Hệ</td>
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
