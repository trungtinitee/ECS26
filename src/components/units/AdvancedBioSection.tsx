import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  TechnologyUnit,
  UnitTab,
  SbrData,
  MbrData,
  MbbrData,
  UasbData,
} from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateSbr,
  updateAutoSbrDimensions,
  calculateMbr,
  updateAutoMbrDimensions,
  calculateMbbr,
  updateAutoMbbrDimensions,
  calculateUasb,
  updateAutoUasbDimensions,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface AdvancedBioSectionProps {
  unit: TechnologyUnit;
  activeTab: UnitTab;
  qAverageDay: number;
  qPeakHour: number;
  bodIn: number;
  codIn?: number;
  onUpdate: (updatedData: any, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const AdvancedBioSection: React.FC<AdvancedBioSectionProps> = ({
  unit,
  activeTab,
  qAverageDay,
  qPeakHour,
  bodIn,
  codIn = 500,
  onUpdate,
  showFormula,
}) => {
  const isSbr = unit.catalogName === 'Bể SBR';
  const isMbr = unit.catalogName === 'Bể MBR';
  const isMbbr = unit.catalogName === 'Bể MBBR';
  const isUasb = unit.catalogName === 'Bể UASB';

  // ----------------- 1. BỂ SBR -----------------
  if (isSbr) {
    const rawData = unit.data?.sbr || {
      q: qAverageDay > 0 ? roundTo(qAverageDay, 2) : 100,
      qOverride: false,
      cycleHours: 6,
      exchangeRatio: 0.3,
      bodIn: bodIn || 250,
      bodOut: 20,
      mlss: 3500,
      numTanks: 2,
      length: 4.0,
      width: 3.0,
      waterDepth: 4.0,
      freeboard: 0.6,
      dimensionsOverride: false,
    };

    const data: SbrData = {
      ...rawData,
      q: rawData.q !== null && rawData.q !== undefined ? roundTo(rawData.q, 2) : (qAverageDay > 0 ? roundTo(qAverageDay, 2) : null),
      cycleHours: roundTo(rawData.cycleHours, 1),
      exchangeRatio: roundTo(rawData.exchangeRatio, 2),
      bodIn: roundTo(rawData.bodIn, 1),
      bodOut: roundTo(rawData.bodOut, 1),
      mlss: roundTo(rawData.mlss, 0),
      numTanks: roundTo(rawData.numTanks, 0),
      length: roundTo(rawData.length, 2),
      width: roundTo(rawData.width, 2),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
    };

    const result = calculateSbr(data);

    const handleChange = (updates: Partial<SbrData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoSbrDimensions(merged);
      const res = calculateSbr(auto);
      onUpdate({ ...unit.data, sbr: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<SbrData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateSbr(merged);
      onUpdate({ ...unit.data, sbr: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const q = qAverageDay > 0 ? roundTo(qAverageDay, 2) : 100;
      handleChange({ q, qOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoSbrDimensions({ ...data, dimensionsOverride: false });
      const res = calculateSbr(adjusted);
      onUpdate({ ...unit.data, sbr: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể SBR (Sequencing Batch Reactor)</h2>
                <p className="text-xs text-[#63776d]">
                  Metcalf & Eddy & TCVN 7957: Công nghệ bùn hoạt tính mẻ phản ứng theo chu kỳ
                </p>
              </div>
              <button
                type="button"
                onClick={resetFlow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>↻ Lấy lại Q từ Tải lượng</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Lưu lượng ngày Q (m³/ngày)
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
                    {data.qOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qAverageDay)} m³/d)`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Thời gian 1 chu kỳ (giờ)
                  </label>
                  <NumericInput
                    min={3}
                    max={12}
                    value={data.cycleHours}
                    onChange={(val) => handleChange({ cycleHours: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Thường chọn: 4 – 8 giờ/chu kỳ</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Hệ số trao đổi nước ER
                  </label>
                  <NumericInput
                    min={0.15}
                    max={0.5}
                    value={data.exchangeRatio}
                    onChange={(val) => handleChange({ exchangeRatio: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Tỉ lệ thể tích gạn nước / thể tích bể (0.25 – 0.35)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Số đơn nguyên bể SBR
                  </label>
                  <NumericInput
                    step={1}
                    min={1}
                    value={data.numTanks}
                    fallbackValue={2}
                    onChange={(val) => handleChange({ numTanks: Math.round(val ?? 2) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Tối thiểu 2 bể để vận hành liên tục</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực chu kỳ SBR</h2>
                <p className="text-xs text-[#63776d]">Tính toán thể tích nạp mẻ, mực nước cao nhất HWL và thấp nhất LWL</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính Bể SBR', [
                    'Số chu kỳ mỗi bể trong ngày: n = 24 / tck (chu kỳ/ngày)',
                    'Thể tích nước nạp mỗi mẻ: Vnap = Q / (Nbe · n) (m³)',
                    'Thể tích yêu cầu mỗi bể: Vyc = Vnap / ER (m³)',
                    'Mực nước cao nhất khi đầy bể: HWL = H (m)',
                    'Mực nước thấp nhất sau khi xả gạn: LWL = H · (1 - ER) (m)',
                    'Chiều sâu lớp nước gạn: Δh = H · ER (m)',
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#fbfdfb] text-[#1b3d2c] text-xs font-semibold hover:bg-[#eef5f1]"
              >
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Xem công thức</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Lượng nước mỗi mẻ V<sub>nạp</sub></span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.vFillPerCycle)} m³/mẻ</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">{formatNumber(result.cyclesPerDay)} chu kỳ/ngày·bể</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích yêu cầu 1 bể</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredVolumePerTank)} m³</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">ER = {formatNumber(data.exchangeRatio * 100)}%</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích thực tế 1 bể</span>
                <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualVolumePerTank)} m³
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Tổng {data.numTanks} bể: {formatNumber(result.totalVolumeAllTanks)} m³</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Mực nước HWL / LWL</span>
                <span className="text-lg font-bold text-[#176b45]">{formatNumber(result.waterHighLevel)} m / {formatNumber(result.waterLowLevel)} m</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Độ sâu gạn: {formatNumber(result.waterHighLevel - result.waterLowLevel)} m</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Hệ thống SBR đạt dung tích yêu cầu theo chu kỳ' : 'Dung tích bể chưa đủ cho chu kỳ thiết kế'}</span>
                <p>
                  Thể tích thực tế mỗi bể {formatNumber(result.actualVolumePerTank)} m³ (yêu cầu ≥ {formatNumber(result.requiredVolumePerTank)} m³). Chiều sâu gạn nước {formatNumber(result.waterHighLevel - result.waterLowLevel)} m phù hợp thiết bị Decanter.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học 1 đơn nguyên Bể SBR</h2>
                <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước và chiều cao an toàn chống tràn bọt</p>
              </div>
              <button
                type="button"
                onClick={autoDimension}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tự động tính kích thước đề xuất</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
                <NumericInput
                  min={1.0}
                  value={data.length}
                  onChange={(val) => handleDimensionDirect({ length: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
                <NumericInput
                  min={1.0}
                  value={data.width}
                  onChange={(val) => handleDimensionDirect({ width: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước hữu dụng H (m)</label>
                <NumericInput
                  min={2.0}
                  value={data.waterDepth}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
                <NumericInput
                  min={0.3}
                  value={data.freeboard}
                  onChange={(val) => handleDimensionDirect({ freeboard: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Thể tích 1 bể</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.actualVolumePerTank)} m³</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng dung tích toàn cụm</span>
                <span className="text-base font-bold text-[#176b45]">{formatNumber(result.totalVolumeAllTanks)} m³</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện công nghệ Bể SBR</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Thiết bị thu nước trong Decanter tự động</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Trang bị {data.numTanks} bộ Decanter gạn nước tự động (kiểu phao nổi hoặc trục vít điều khiển servo motor) bằng inox SUS 304, có tấm chắn bùn nổi và cảm biến chống hút cặn đáy.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Hệ sục khí & Bơm xả bùn dư</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Hệ thống đĩa khuếch tán bọt mịn màng EPDM rải đều đáy bể, máy thổi khí kèm biến tần, và bơm chìm xả bùn dư tự động kích hoạt ở cuối pha lắng.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 2. BỂ MBR -----------------
  if (isMbr) {
    const rawData = unit.data?.mbr || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      membraneFluxLmh: 20,
      mlss: 9000,
      hrtHours: 4.0,
      length: 3.5,
      width: 2.0,
      waterDepth: 3.5,
      freeboard: 0.5,
      dimensionsOverride: false,
    };

    const data: MbrData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      membraneFluxLmh: roundTo(rawData.membraneFluxLmh, 1),
      mlss: roundTo(rawData.mlss, 0),
      hrtHours: roundTo(rawData.hrtHours, 1),
      length: roundTo(rawData.length, 2),
      width: roundTo(rawData.width, 2),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
    };

    const result = calculateMbr(data);

    const handleChange = (updates: Partial<MbrData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoMbrDimensions(merged);
      const res = calculateMbr(auto);
      onUpdate({ ...unit.data, mbr: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<MbrData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateMbr(merged);
      onUpdate({ ...unit.data, mbr: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoMbrDimensions({ ...data, dimensionsOverride: false });
      const res = calculateMbr(adjusted);
      onUpdate({ ...unit.data, mbr: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể màng sinh học MBR</h2>
                <p className="text-xs text-[#63776d]">
                  Metcalf & Eddy: Tách sinh khối bằng màng lọc siêu mịn (Microfiltration / Ultrafiltration)
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Lưu lượng giờ thiết kế Q<sub>h</sub> (m³/h)
                  </label>
                  <NumericInput
                    allowNull
                    value={data.qh}
                    onChange={(val) =>
                      handleChange({
                        qh: val === null ? null : roundTo(val, 2),
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
                    Thông lượng màng thiết kế J (LMH)
                  </label>
                  <NumericInput
                    min={10}
                    max={35}
                    value={data.membraneFluxLmh}
                    onChange={(val) => handleChange({ membraneFluxLmh: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">L/m²·h (Tiêu chuẩn chọn 15 – 22 LMH)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Nồng độ bùn sinh học MLSS (mg/L)
                  </label>
                  <NumericInput
                    min={6000}
                    max={15000}
                    value={data.mlss}
                    onChange={(val) => handleChange({ mlss: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Bể MBR duy trì 8.000 – 12.000 mg/L</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Thời gian lưu nước HRT (giờ)
                  </label>
                  <NumericInput
                    min={2}
                    max={8}
                    value={data.hrtHours}
                    onChange={(val) => handleChange({ hrtHours: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 3.5 – 6.0 giờ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả tính toán màng & thể tích Bể MBR</h2>
                <p className="text-xs text-[#63776d]">Tính toán diện tích màng lọc yêu cầu và thể tích bể phản ứng</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính Bể MBR', [
                    'Diện tích bề mặt màng yêu cầu: Sm = (Qh · 1000) / J (m²)',
                    'Thể tích bể sinh học yêu cầu: Vyc = Qh · HRT (m³)',
                    'Thể tích thực tế: Vtt = L · B · H (m³)',
                    'Thời gian lưu nước thực tế: HRT_tt = Vtt / Qh (h)',
                    'Lưu lượng sục khí rung lắc màng: Qair ~ (0.25 - 0.35) m³ khí/m² màng/h',
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#fbfdfb] text-[#1b3d2c] text-xs font-semibold hover:bg-[#eef5f1]"
              >
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Xem công thức</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích màng yêu cầu S<sub>m</sub></span>
                <span className="text-lg font-bold text-[#176b45]">{formatNumber(result.requiredMembraneAreaM2)} m²</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Flux = {formatNumber(data.membraneFluxLmh)} LMH</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích yêu cầu V<sub>yc</sub></span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredVolume)} m³</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">HRT = {formatNumber(data.hrtHours)} h</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích thực tế V<sub>tt</sub></span>
                <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualVolume)} m³
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">HRT thực tế: {formatNumber(result.actualHrt)} h</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">An toàn: {formatNumber(data.freeboard)} m</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Bể MBR đạt yêu cầu thông lượng và thể tích' : 'Chưa đạt thể tích yêu cầu'}</span>
                <p>
                  Diện tích màng cần lắp đặt {formatNumber(result.requiredMembraneAreaM2)} m². Thời gian lưu nước thực tế đạt {formatNumber(result.actualHrt)} giờ.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể MBR</h2>
                <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước đủ để bố trí cụm cassette màng</p>
              </div>
              <button
                type="button"
                onClick={autoDimension}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tự động tính kích thước đề xuất</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
                <NumericInput
                  min={1.0}
                  value={data.length}
                  onChange={(val) => handleDimensionDirect({ length: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
                <NumericInput
                  min={1.0}
                  value={data.width}
                  onChange={(val) => handleDimensionDirect({ width: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  min={2.5}
                  value={data.waterDepth}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
                <NumericInput
                  min={0.3}
                  value={data.freeboard}
                  onChange={(val) => handleDimensionDirect({ freeboard: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Thể tích thực tế</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.actualVolume)} m³</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">HRT thực tế</span>
                <span className="text-base font-bold text-[#176b45]">{formatNumber(result.actualHrt)} giờ</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện công nghệ Bể MBR</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Module màng lọc sợi rỗng PVDF & Bơm hút chân không</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Cụm cassette màng siêu lọc PVDF kích thước lỗ 0.04 – 0.1 μm, diện tích {formatNumber(result.requiredMembraneAreaM2)} m², 02 bơm hút nước trong tự mồi (01 chạy, 01 dự phòng) kèm đồng hồ áp suất chân không âm (-10 đến -50 kPa).
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Hệ sục khí rung màng & Rửa hóa chất tại chỗ (CIP)</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Hệ ống phân phối khí thô dưới đáy cassette màng để tạo vi bọt cọ xát chống nghẹt sợi màng, hệ thống bơm định lượng và bồn chứa hóa chất NaOCl / Citric Acid phục vụ chu trình tẩy rửa hóa chất tự động.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 3. BỂ MBBR -----------------
  if (isMbbr) {
    const rawData = unit.data?.mbbr || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      fillingFraction: 50,
      mediaSpecificSurface: 600,
      salr: 15,
      bodIn: bodIn || 250,
      bodOut: 20,
      length: 3.0,
      width: 2.0,
      waterDepth: 4.0,
      freeboard: 0.5,
      dimensionsOverride: false,
    };

    const data: MbbrData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      fillingFraction: roundTo(rawData.fillingFraction, 0),
      mediaSpecificSurface: roundTo(rawData.mediaSpecificSurface, 0),
      salr: roundTo(rawData.salr, 1),
      bodIn: roundTo(rawData.bodIn, 1),
      bodOut: roundTo(rawData.bodOut, 1),
      length: roundTo(rawData.length, 2),
      width: roundTo(rawData.width, 2),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
    };

    const result = calculateMbbr(data);

    const handleChange = (updates: Partial<MbbrData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoMbbrDimensions(merged);
      const res = calculateMbbr(auto);
      onUpdate({ ...unit.data, mbbr: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<MbbrData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateMbbr(merged);
      onUpdate({ ...unit.data, mbbr: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoMbbrDimensions({ ...data, dimensionsOverride: false });
      const res = calculateMbbr(adjusted);
      onUpdate({ ...unit.data, mbbr: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể MBBR (Moving Bed Biofilm Reactor)</h2>
                <p className="text-xs text-[#63776d]">
                  Metcalf & Eddy: Màng vi sinh dính bám trên giá thể chuyển động lơ lửng trong bể
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Lưu lượng giờ tính toán Q<sub>h</sub> (m³/h)
                  </label>
                  <NumericInput
                    allowNull
                    value={data.qh}
                    onChange={(val) =>
                      handleChange({
                        qh: val === null ? null : roundTo(val, 2),
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
                    Tải trọng bề mặt SALR (g BOD/m²·d)
                  </label>
                  <NumericInput
                    min={5}
                    max={30}
                    value={data.salr}
                    onChange={(val) => handleChange({ salr: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 12 – 20 g BOD/m²·ngày</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Tỉ lệ điền đầy giá thể FF (%)
                  </label>
                  <NumericInput
                    min={30}
                    max={70}
                    value={data.fillingFraction}
                    onChange={(val) => handleChange({ fillingFraction: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Tối ưu: 40 – 60% thể tích bể</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Diện tích riêng giá thể (m²/m³)
                  </label>
                  <NumericInput
                    min={400}
                    max={1200}
                    value={data.mediaSpecificSurface}
                    onChange={(val) => handleChange({ mediaSpecificSurface: val })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                  <span className="text-[10px] text-[#708477]">Giá thể K1/K3/Hel-X: 500 – 800 m²/m³</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực & Giá thể MBBR</h2>
                <p className="text-xs text-[#63776d]">Tính toán thể tích giá thể cần châm và thể tích bể yêu cầu</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính Bể MBBR', [
                    'Lượng BOD cần khử: ΔBOD = Qngay · (BOD_vao - BOD_ra) (g/ngày)',
                    'Tổng diện tích bề mặt giá thể yêu cầu: S_media = ΔBOD / SALR (m²)',
                    'Thể tích giá thể cần châm: V_media = S_media / SSA (m³)',
                    'Thể tích bể yêu cầu: Vyc = V_media / (FF / 100) (m³)',
                    'Thể tích thực tế: Vtt = L · B · H (m³)',
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#fbfdfb] text-[#1b3d2c] text-xs font-semibold hover:bg-[#eef5f1]"
              >
                <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
                <span>Xem công thức</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích giá thể cần châm</span>
                <span className="text-lg font-bold text-[#176b45]">{formatNumber(result.requiredMediaVolumeM3)} m³</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Điền đầy {formatNumber(data.fillingFraction)}%</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích bể yêu cầu V<sub>yc</sub></span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredTankVolumeM3)} m³</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Theo SALR = {formatNumber(data.salr)}</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích thực tế V<sub>tt</sub></span>
                <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualTankVolumeM3)} m³
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">HRT thực tế: {formatNumber(result.actualHrt)} h</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">An toàn: {formatNumber(data.freeboard)} m</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Bể MBBR đạt yêu cầu tải trọng bề mặt giá thể' : 'Chưa đạt thể tích yêu cầu'}</span>
                <p>
                  Thể tích thực tế đạt {formatNumber(result.actualTankVolumeM3)} m³ (yêu cầu ≥ {formatNumber(result.requiredTankVolumeM3)} m³). Khối lượng giá thể cần châm {formatNumber(result.requiredMediaVolumeM3)} m³.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể MBBR</h2>
                <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước và vị trí lắp lưới chặn giá thể</p>
              </div>
              <button
                type="button"
                onClick={autoDimension}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tự động tính kích thước đề xuất</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
                <NumericInput
                  min={1.0}
                  value={data.length}
                  onChange={(val) => handleDimensionDirect({ length: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
                <NumericInput
                  min={1.0}
                  value={data.width}
                  onChange={(val) => handleDimensionDirect({ width: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                <NumericInput
                  min={2.0}
                  value={data.waterDepth}
                  onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
                <NumericInput
                  min={0.3}
                  value={data.freeboard}
                  onChange={(val) => handleDimensionDirect({ freeboard: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Thể tích thực tế</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.actualTankVolumeM3)} m³</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Khối lượng giá thể</span>
                <span className="text-base font-bold text-[#176b45]">{formatNumber(result.requiredMediaVolumeM3)} m³</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện công nghệ Bể MBBR</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Giá thể vi sinh di động & Lưới chắn giữ giá thể</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Giá thể HDPE nguyên sinh (loại Kaldnes K3 / Hel-X diện tích {formatNumber(data.mediaSpecificSurface)} m²/m³), khối lượng {formatNumber(result.requiredMediaVolumeM3)} m³. Lưới chắn inox SUS 304 khe hở 3 – 5 mm đặt tại cửa thu nước để ngăn giá thể trôi ra ngoài.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Hệ thống phân phối khí xáo trộn</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Ống phân phối khí bọt trung bình/thô inox SUS 304 bố trí so le đáy bể để tạo dòng xoáy xáo trộn liên tục toàn bộ khối giá thể, đồng thời cung cấp oxy hòa tan DO ≥ 2.5 mg/L.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 4. BỂ UASB -----------------
  const rawData = unit.data?.uasb || {
    q: qAverageDay > 0 ? roundTo(qAverageDay, 2) : 100,
    qOverride: false,
    codIn: codIn || 2000,
    volumetricLoadingCod: 6.0,
    upflowVelocity: 0.8,
    length: 4.0,
    width: 3.0,
    waterDepth: 5.0,
    freeboard: 0.8,
    dimensionsOverride: false,
  };

  const data: UasbData = {
    ...rawData,
    q: rawData.q !== null && rawData.q !== undefined ? roundTo(rawData.q, 2) : (qAverageDay > 0 ? roundTo(qAverageDay, 2) : null),
    codIn: roundTo(rawData.codIn, 0),
    volumetricLoadingCod: roundTo(rawData.volumetricLoadingCod, 1),
    upflowVelocity: roundTo(rawData.upflowVelocity, 2),
    length: roundTo(rawData.length, 2),
    width: roundTo(rawData.width, 2),
    waterDepth: roundTo(rawData.waterDepth, 2),
    freeboard: roundTo(rawData.freeboard, 2),
  };

  const result = calculateUasb(data);

  const handleChange = (updates: Partial<UasbData>) => {
    const merged = { ...data, ...updates };
    const auto = updateAutoUasbDimensions(merged);
    const res = calculateUasb(auto);
    onUpdate({ ...unit.data, uasb: auto }, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleDimensionDirect = (updates: Partial<UasbData>) => {
    const merged = { ...data, ...updates, dimensionsOverride: true };
    const res = calculateUasb(merged);
    onUpdate({ ...unit.data, uasb: merged }, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetFlow = () => {
    const q = qAverageDay > 0 ? roundTo(qAverageDay, 2) : 100;
    handleChange({ q, qOverride: false });
  };

  const autoDimension = () => {
    const adjusted = updateAutoUasbDimensions({ ...data, dimensionsOverride: false });
    const res = calculateUasb(adjusted);
    onUpdate({ ...unit.data, uasb: adjusted }, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể kỵ khí UASB</h2>
              <p className="text-xs text-[#63776d]">
                Metcalf & Eddy & Lettinga: Xử lý kỵ khí dòng chảy ngược qua tầng bùn hạt và thu hồi Biogas
              </p>
            </div>
            <button
              type="button"
              onClick={resetFlow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↻ Lấy lại Q từ Tải lượng</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng ngày Q (m³/ngày)
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
                  {data.qOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Tải lượng (${formatNumber(qAverageDay)} m³/d)`}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  COD đầu vào bể (mg/L)
                </label>
                <NumericInput
                  min={500}
                  max={30000}
                  value={data.codIn}
                  onChange={(val) => handleChange({ codIn: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Nước thải hữu cơ đậm đặc</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Tải trọng thể tích VLR (kg COD/m³·d)
                </label>
                <NumericInput
                  min={2.0}
                  max={15.0}
                  value={data.volumetricLoadingCod}
                  onChange={(val) => handleChange({ volumetricLoadingCod: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
                <span className="text-[10px] text-[#708477]">Khuyên dùng: 4.0 – 8.0 kg COD/m³·d</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Vận tốc dòng dâng v<sub>up</sub> (m/h)
                </label>
                <NumericInput
                  min={0.3}
                  max={1.5}
                  value={data.upflowVelocity}
                  onChange={(val) => handleChange({ upflowVelocity: val })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: ≤ 1.0 m/h tránh trôi bùn</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực & Thu hồi Biogas UASB</h2>
              <p className="text-xs text-[#63776d]">Tính toán thể tích vùng phản ứng, vận tốc dòng dâng và sản lượng khí Metan CH₄</p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính Bể UASB', [
                  'Tải lượng COD nạp hàng ngày: L_COD = (Q · COD_in) / 1000 (kg COD/ngày)',
                  'Thể tích bể yêu cầu theo tải trọng: Vyc = L_COD / VLR (m³)',
                  'Vận tốc dòng nước dâng: v_up = (Q / 24) / (L · B) (m/h)',
                  'Sản lượng khí Biogas sinh ra: V_biogas ~ 0.35 m³ CH4 / kg COD khử (hiệu suất khử 75 - 85%)',
                ])
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd8d0] bg-[#fbfdfb] text-[#1b3d2c] text-xs font-semibold hover:bg-[#eef5f1]"
            >
              <Calculator className="w-3.5 h-3.5 text-[#176b45]" />
              <span>Xem công thức</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Tải lượng COD nạp</span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.codLoadKgDay)} kg/ngày</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">COD vào: {formatNumber(data.codIn)} mg/L</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích yêu cầu V<sub>yc</sub></span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredVolume)} m³</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">VLR = {formatNumber(data.volumetricLoadingCod)} kg/m³·d</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Thể tích thực tế V<sub>tt</sub></span>
              <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                {formatNumber(result.actualVolume)} m³
              </span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">v_up = {formatNumber(result.actualUpflowVelocity)} m/h</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Sản lượng khí Biogas dự kiến</span>
              <span className="text-lg font-bold text-[#176b45]">{formatNumber(result.biogasYieldM3Day)} m³/ngày</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">~ 0.35 m³ CH₄/kg COD</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
            {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
            <div className="text-xs space-y-1">
              <span className="font-bold">{result.pass ? 'Bể UASB thỏa mãn tải trọng thể tích và vận tốc dòng dâng' : 'Chưa đạt thể tích yêu cầu'}</span>
              <p>
                Thể tích thực tế {formatNumber(result.actualVolume)} m³ (yêu cầu {formatNumber(result.requiredVolume)} m³). Vận tốc dâng {formatNumber(result.actualUpflowVelocity)} m/h (≤ 1.0 m/h). Sinh ra ước tính {formatNumber(result.biogasYieldM3Day)} m³ Biogas/ngày.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dimensions' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể UASB</h2>
              <p className="text-xs text-[#63776d]">Chiều dài, chiều rộng, chiều sâu nước và khoang tách 3 pha Khí - Nước - Bùn (GLS)</p>
            </div>
            <button
              type="button"
              onClick={autoDimension}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự động tính kích thước đề xuất</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
              <NumericInput
                min={1.0}
                value={data.length}
                onChange={(val) => handleDimensionDirect({ length: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
              <NumericInput
                min={1.0}
                value={data.width}
                onChange={(val) => handleDimensionDirect({ width: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
              <NumericInput
                min={3.5}
                value={data.waterDepth}
                onChange={(val) => handleDimensionDirect({ waterDepth: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
              <NumericInput
                min={0.5}
                value={data.freeboard}
                onChange={(val) => handleDimensionDirect({ freeboard: val })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-[#5a7264] block">Tổng chiều cao thành bể</span>
              <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.totalHeight)} m</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5a7264] block">Thể tích thực tế</span>
              <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.actualVolume)} m³</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5a7264] block">Vận tốc dòng dâng</span>
              <span className="text-base font-bold text-[#176b45]">{formatNumber(result.actualUpflowVelocity)} m/h</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện công nghệ Bể UASB</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">1. Bộ chụp tách 3 pha Khí - Lỏng - Rắn (GLS Separator)</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Chụp thu khí dạng nón/mái tam giác bằng Inox SUS 304 hoặc composite góc nghiêng 45°–60° để hoàn lưu bùn lắng trở lại tầng đáy, ngăn bọt khí mang bùn trôi ra máng thu nước trong.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">2. Hệ thống phân phối đáy & Đường ống thu khí Biogas</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Mạng lưới ống nhánh phân phối nước vào đáy bể chia đều diện tích (1 điểm phân phối cho mỗi 2 – 4 m² đáy), ống thu khí biogas bằng thép bọc cao su chịu khí H₂S kèm bẫy nước ngưng và bình dập tia lửa chống cháy nổ.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
