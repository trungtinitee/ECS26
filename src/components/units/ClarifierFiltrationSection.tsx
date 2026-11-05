import React from 'react';
import { RotateCcw, Calculator, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  TechnologyUnit,
  UnitTab,
  ChemicalClarifierData,
  SandFilterData,
  FilterPressData,
} from '../../types/ecs';
import {
  formatNumber,
  roundTo,
  calculateChemicalClarifier,
  updateAutoChemicalClarifierDimensions,
  calculateSandFilter,
  updateAutoSandFilterDimensions,
  calculateFilterPress,
} from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface ClarifierFiltrationSectionProps {
  unit: TechnologyUnit;
  activeTab: UnitTab;
  qPeakHour: number;
  excessSludgeM3Day?: number;
  onUpdate: (updatedData: any, status: 'pending' | 'done') => void;
  showFormula: (title: string, lines: string[]) => void;
}

export const ClarifierFiltrationSection: React.FC<ClarifierFiltrationSectionProps> = ({
  unit,
  activeTab,
  qPeakHour,
  excessSludgeM3Day = 2.5,
  onUpdate,
  showFormula,
}) => {
  const isChemicalClarifier = unit.catalogName === 'Bể lắng hóa lý';
  const isSandFilter = ['Bể lọc áp lực', 'Lọc than hoạt tính'].includes(unit.catalogName);
  const isFilterPress = unit.catalogName === 'Máy ép bùn';

  // ----------------- 1. BỂ LẮNG HÓA LÝ -----------------
  if (isChemicalClarifier) {
    const rawData = unit.data?.chemicalClarifier || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      surfaceOverflowRate: 1.2,
      waterDepth: 3.2,
      freeboard: 0.5,
      geometry: 'circle',
      diameter: 2.5,
      length: 2.5,
      width: 2.5,
      dimensionsOverride: false,
    };

    const data: ChemicalClarifierData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      surfaceOverflowRate: roundTo(rawData.surfaceOverflowRate, 2),
      waterDepth: roundTo(rawData.waterDepth, 2),
      freeboard: roundTo(rawData.freeboard, 2),
      diameter: roundTo(rawData.diameter, 2),
      length: roundTo(rawData.length, 2),
      width: roundTo(rawData.width, 2),
    };

    const result = calculateChemicalClarifier(data);

    const handleChange = (updates: Partial<ChemicalClarifierData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoChemicalClarifierDimensions(merged);
      const res = calculateChemicalClarifier(auto);
      onUpdate({ ...unit.data, chemicalClarifier: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<ChemicalClarifierData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateChemicalClarifier(merged);
      onUpdate({ ...unit.data, chemicalClarifier: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoChemicalClarifierDimensions({ ...data, dimensionsOverride: false });
      const res = calculateChemicalClarifier(adjusted);
      onUpdate({ ...unit.data, chemicalClarifier: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Bể lắng hóa lý (Lắng đợt 1 / Hóa lý)</h2>
                <p className="text-xs text-[#63776d]">
                  TCVN 7957 & Metcalf & Eddy: Lắng kết tủa bông cặn keo tụ PAC/Polymer
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
                    step={0.1}
                    min={0.1}
                    value={data.surfaceOverflowRate}
                    fallbackValue={1.2}
                    onChange={(val) => handleChange({ surfaceOverflowRate: val ?? 1.2 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Lắng hóa lý: 1.0 – 1.5 m³/m²·h</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Hình học bể</label>
                  <select
                    value={data.geometry}
                    onChange={(e) => handleChange({ geometry: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  >
                    <option value="circle">Tròn (Bể lắng li tâm)</option>
                    <option value="rectangle">Chữ nhật (Bể lắng ngang)</option>
                  </select>
                  <span className="text-[10px] text-[#708477]">Bể tròn thu gom bùn hiệu quả hơn</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực Bể lắng hóa lý</h2>
                <p className="text-xs text-[#63776d]">Tính toán diện tích lắng, thời gian lưu và tải trọng máng tràn răng cưa weir</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula('Công thức tính Bể lắng hóa lý', [
                    'Diện tích lắng yêu cầu: Fyc = Qh / q0 (m²)',
                    'Bể tròn: Đường kính D = √(4 · Fyc / π) (m)',
                    'Chiều dài máng tràn weir: Lweir = π · D (m) hoặc 2·(L + B)',
                    'Tải trọng máng thu nước: qweir = Qh / Lweir (m³/m·h) (tiêu chuẩn ≤ 10 m³/m·h)',
                    'Thời gian lưu nước: t = V / Qh (h) (thường 1.5 – 2.5 h)',
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
                <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích lắng yêu cầu</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredArea)} m²</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">q₀ = {formatNumber(data.surfaceOverflowRate)} m³/m²·h</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích thực tế</span>
                <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualArea)} m²
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">q₀ thực tế: {formatNumber(result.actualQ0)} m³/m²·h</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thời gian lưu nước</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.retentionHours)} giờ</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Thể tích {formatNumber(result.actualVolume)} m³</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Tải trọng máng tràn weir</span>
                <span className={`text-lg font-bold ${result.weirLoadingRate <= 10.0 ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.weirLoadingRate)} m³/m·h
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Tiêu chuẩn ≤ 10.0 m³/m·h</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Bể lắng hóa lý đạt tiêu chuẩn thủy lực' : 'Chưa đạt diện tích hoặc tải trọng máng'}</span>
                <p>
                  Tải trọng bề mặt đạt {formatNumber(result.actualQ0)} m³/m²·h. Chiều dài máng thu răng cưa đạt {formatNumber(result.weirLength)} m đảm bảo nước thu đều không kéo theo cặn.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước hình học Bể lắng hóa lý</h2>
                <p className="text-xs text-[#63776d]">Đường kính (hoặc Dài x Rộng), chiều sâu nước và chiều cao an toàn</p>
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

            {data.geometry === 'circle' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Đường kính D (m)</label>
                  <NumericInput
                    step={0.1}
                    min={0.5}
                    value={data.diameter}
                    fallbackValue={2.5}
                    onChange={(val) => handleDimensionDirect({ diameter: val ?? 2.5 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Đường kính lòng bể</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                  <NumericInput
                    step={0.1}
                    min={1.0}
                    value={data.waterDepth}
                    fallbackValue={3.2}
                    onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 3.2 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Chiều sâu lắng</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều cao an toàn H<sub>bv</sub> (m)</label>
                  <NumericInput
                    step={0.05}
                    min={0.2}
                    value={data.freeboard}
                    fallbackValue={0.5}
                    onChange={(val) => handleDimensionDirect({ freeboard: val ?? 0.5 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Thành bể bảo vệ</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều dài L (m)</label>
                  <NumericInput
                    step={0.1}
                    min={0.5}
                    value={data.length}
                    fallbackValue={3.0}
                    onChange={(val) => handleDimensionDirect({ length: val ?? 3.0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều rộng B (m)</label>
                  <NumericInput
                    step={0.1}
                    min={0.5}
                    value={data.width}
                    fallbackValue={2.0}
                    onChange={(val) => handleDimensionDirect({ width: val ?? 2.0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều sâu nước H (m)</label>
                  <NumericInput
                    step={0.1}
                    min={1.0}
                    value={data.waterDepth}
                    fallbackValue={3.2}
                    onChange={(val) => handleDimensionDirect({ waterDepth: val ?? 3.2 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">Chiều cao bảo vệ H<sub>bv</sub> (m)</label>
                  <NumericInput
                    step={0.05}
                    min={0.2}
                    value={data.freeboard}
                    fallbackValue={0.5}
                    onChange={(val) => handleDimensionDirect({ freeboard: val ?? 0.5 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                </div>
              </div>
            )}

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
                <span className="text-[11px] text-[#5a7264] block">Chiều dài máng răng cưa weir</span>
                <span className="text-base font-bold text-[#176b45]">{formatNumber(result.weirLength)} m</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện Bể lắng hóa lý</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Cầu gạt bùn đáy & Gạt váng nổi</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Cầu gạt bùn dạng xoay tâm (hoặc tịnh tiến nếu bể chữ nhật) tốc độ vòng quay 1 – 3 vòng/giờ, lưỡi gạt cao su tổng hợp gom bùn về hố bùn trung tâm đáy bể, tích hợp cần gạt váng nổi mặt nước.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Ống trung tâm tạo dòng & Bơm bùn hóa lý</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Ống trung tâm inox (Flocculating well) đường kính ~ 20% đường kính bể để giảm chấn dòng chảy, 02 bơm bùn hóa lý trục vít hoặc bơm màng khí nén bơm bùn sang bể chứa bùn hoặc máy ép bùn.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 2. BỂ LỌC ÁP LỰC / LỌC THAN -----------------
  if (isSandFilter) {
    const isCarbon = unit.catalogName === 'Lọc than hoạt tính';
    const rawData = unit.data?.sandFilter || {
      qh: qPeakHour ? roundTo(qPeakHour, 2) : 5,
      qhOverride: false,
      filtrationVelocity: isCarbon ? 8.0 : 10.0,
      mediaDepth: 1.2,
      numColumns: 1,
      diameter: 1.0,
      height: 2.2,
      dimensionsOverride: false,
      filterType: isCarbon ? 'carbon' : 'sand',
    };

    const data: SandFilterData = {
      ...rawData,
      qh: rawData.qh !== null && rawData.qh !== undefined ? roundTo(rawData.qh, 2) : (qPeakHour ? roundTo(qPeakHour, 2) : null),
      filtrationVelocity: roundTo(rawData.filtrationVelocity, 1),
      mediaDepth: roundTo(rawData.mediaDepth, 2),
      numColumns: roundTo(rawData.numColumns, 0),
      diameter: roundTo(rawData.diameter, 2),
      height: roundTo(rawData.height, 2),
      filterType: isCarbon ? 'carbon' : 'sand',
    };

    const result = calculateSandFilter(data);

    const handleChange = (updates: Partial<SandFilterData>) => {
      const merged = { ...data, ...updates };
      const auto = updateAutoSandFilterDimensions(merged);
      const res = calculateSandFilter(auto);
      onUpdate({ ...unit.data, sandFilter: auto }, res.valid && res.pass ? 'done' : 'pending');
    };

    const handleDimensionDirect = (updates: Partial<SandFilterData>) => {
      const merged = { ...data, ...updates, dimensionsOverride: true };
      const res = calculateSandFilter(merged);
      onUpdate({ ...unit.data, sandFilter: merged }, res.valid && res.pass ? 'done' : 'pending');
    };

    const resetFlow = () => {
      const qh = qPeakHour > 0 ? roundTo(qPeakHour, 2) : 5;
      handleChange({ qh, qhOverride: false });
    };

    const autoDimension = () => {
      const adjusted = updateAutoSandFilterDimensions({ ...data, dimensionsOverride: false });
      const res = calculateSandFilter(adjusted);
      onUpdate({ ...unit.data, sandFilter: adjusted }, res.valid && res.pass ? 'done' : 'pending');
    };

    return (
      <div className="space-y-6">
        {activeTab === 'input' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">
                  {isCarbon ? 'Thông số Bồn lọc than hoạt tính (Activated Carbon Filter)' : 'Thông số Bồn lọc cát áp lực (Pressure Sand Filter)'}
                </h2>
                <p className="text-xs text-[#63776d]">
                  {isCarbon
                    ? 'Khử màu, mùi, chất hữu cơ hòa tan khó phân hủy và clo dư bằng hấp phụ than'
                    : 'Lọc giữ cặn lơ lửng mịn SS ≤ 5 mg/L và làm trong nước sau xử lý'}
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
                    Vận tốc lọc v (m/h)
                  </label>
                  <NumericInput
                    step={0.5}
                    min={1}
                    value={data.filtrationVelocity}
                    fallbackValue={isCarbon ? 8 : 10}
                    onChange={(val) => handleChange({ filtrationVelocity: val ?? (isCarbon ? 8 : 10) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">{isCarbon ? 'Lọc than: 6 – 10 m/h' : 'Lọc cát: 8 – 14 m/h'}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Chiều dày lớp vật liệu lọc (m)
                  </label>
                  <NumericInput
                    step={0.1}
                    min={0.3}
                    value={data.mediaDepth}
                    fallbackValue={1.2}
                    onChange={(val) => handleChange({ mediaDepth: val ?? 1.2 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Thường chọn: 1.0 – 1.4 m</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Số lượng bồn lọc (cột)
                  </label>
                  <NumericInput
                    step={1}
                    min={1}
                    value={data.numColumns}
                    fallbackValue={1}
                    onChange={(val) => handleChange({ numColumns: Math.round(val ?? 1) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                  />
                  <span className="text-[10px] text-[#708477]">Bố trí song song hoặc luân phiên rửa ngược</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kết quả kiểm tra thủy lực Cụm bồn lọc</h2>
                <p className="text-xs text-[#63776d]">Tính diện tích lọc, vận tốc thực tế và thời gian tiếp xúc rỗng EBCT</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  showFormula(isCarbon ? 'Công thức tính Bồn lọc than' : 'Công thức tính Bồn lọc áp lực', [
                    'Diện tích lọc yêu cầu: Fyc = Qh / v (m²)',
                    'Diện tích 1 bồn: F1 = π · D² / 4 (m²)',
                    'Tổng diện tích lọc thực tế: Ftt = F1 · n (m²)',
                    'Vận tốc lọc thực tế: v_tt = Qh / Ftt (m/h)',
                    'Thời gian tiếp xúc lớp vật liệu (EBCT): EBCT = (Ftt · h_media / Qh) · 60 (phút)',
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
                <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích lọc yêu cầu</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredAreaM2)} m²</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">v = {formatNumber(data.filtrationVelocity)} m/h</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Diện tích lọc thực tế ({data.numColumns} bồn)</span>
                <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                  {formatNumber(result.actualAreaM2)} m²
                </span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">v thực tế: {formatNumber(result.actualVelocity)} m/h</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Thời gian tiếp xúc rỗng EBCT</span>
                <span className="text-lg font-bold text-[#176b45]">{formatNumber(result.ebctMinutes)} phút</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Lớp vật liệu dày {formatNumber(data.mediaDepth)} m</span>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
                <span className="text-[11px] font-semibold text-[#5a7264] block">Lưu lượng rửa ngược đề xuất</span>
                <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.actualAreaM2 * 35)} m³/h</span>
                <span className="text-[10px] text-[#788e81] block mt-0.5">Cường độ ~ 10 – 12 L/m²·s</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
              {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
              <div className="text-xs space-y-1">
                <span className="font-bold">{result.pass ? 'Cụm bồn lọc đạt yêu cầu diện tích và vận tốc lọc' : 'Diện tích lọc chưa đủ'}</span>
                <p>
                  Vận tốc lọc thực tế đạt {formatNumber(result.actualVelocity)} m/h. Thời gian tiếp xúc EBCT đạt {formatNumber(result.ebctMinutes)} phút.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dimensions' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Kích thước bồn lọc áp lực</h2>
                <p className="text-xs text-[#63776d]">Đường kính bồn D và chiều cao vỏ bồn H</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Đường kính mỗi bồn D (m)</label>
                <NumericInput
                  step={0.05}
                  min={0.2}
                  value={data.diameter}
                  fallbackValue={1.0}
                  onChange={(val) => handleDimensionDirect({ diameter: val ?? 1.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Quy cách bồn tiêu chuẩn (Composite / Thép)</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Chiều cao bồn H (m)</label>
                <NumericInput
                  step={0.1}
                  min={1.0}
                  value={data.height}
                  fallbackValue={2.2}
                  onChange={(val) => handleDimensionDirect({ height: val ?? 2.2 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Thường từ 1.8 – 2.5 m</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Số bồn lọc hoạt động</label>
                <NumericInput
                  step={1}
                  min={1}
                  value={data.numColumns}
                  fallbackValue={1}
                  onChange={(val) => handleDimensionDirect({ numColumns: Math.round(val ?? 1) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Cụm thiết bị</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] text-[#5a7264] block">Quy cách kích thước bồn</span>
                <span className="text-base font-bold text-[#193a2a]">Ø {formatNumber(data.diameter * 1000)} × {formatNumber(data.height * 1000)} mm</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Thể tích vật liệu lọc 1 bồn</span>
                <span className="text-base font-bold text-[#193a2a]">{formatNumber((Math.PI * data.diameter * data.diameter * data.mediaDepth) / 4)} m³</span>
              </div>
              <div>
                <span className="text-[11px] text-[#5a7264] block">Vật liệu bồn</span>
                <span className="text-base font-bold text-[#176b45]">FRP Composite / Thép bọc Epoxy</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & vật liệu Cụm bồn lọc</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">1. Vật liệu lọc đa tầng & Lưới chặn hạt</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  {isCarbon
                    ? 'Than hoạt tính gáo dừa hoạt hóa dạng hạt (Iodine number ≥ 900 mg/g), lớp đệm sỏi thạch anh đỡ đáy 2 – 4 mm và 5 – 10 mm.'
                    : 'Cát thạch anh chọn lọc kích thước 0.8 – 1.2 mm, sỏi đỡ 2 – 5 mm, than Anthracite lớp trên 1.2 – 2.0 mm (lọc đa tầng cát-than).'}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
                <span className="text-xs font-bold text-[#1e4532]">2. Cụm van điều khiển tự động / tay & Bơm lọc</span>
                <p className="text-xs text-[#52665a] leading-relaxed">
                  Cụm van điều khiển đa cổng (Autovalve Runxin hoặc cụm van bướm khí nén) cho 3 chế độ: Lọc (Filter) - Rửa ngược (Backwash) - Rửa xuôi (Fast Rinse), kèm bơm tăng áp lọc chuyên dụng.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- 3. MÁY ÉP BÙN -----------------
  const rawData = unit.data?.filterPress || {
    sludgeVolumePerDay: excessSludgeM3Day > 0 ? roundTo(excessSludgeM3Day, 2) : 2.5,
    sludgeVolumeOverride: false,
    operatingHoursPerDay: 4.0,
    feedMoisture: 97.0,
    cakeMoisture: 75.0,
    dimensionsOverride: false,
    capacityM3H: 1.0,
  };

  const data: FilterPressData = {
    ...rawData,
    sludgeVolumePerDay:
      rawData.sludgeVolumePerDay !== null && rawData.sludgeVolumePerDay !== undefined
        ? roundTo(rawData.sludgeVolumePerDay, 2)
        : (excessSludgeM3Day > 0 ? roundTo(excessSludgeM3Day, 2) : null),
    operatingHoursPerDay: roundTo(rawData.operatingHoursPerDay, 1),
    feedMoisture: roundTo(rawData.feedMoisture, 1),
    cakeMoisture: roundTo(rawData.cakeMoisture, 1),
    capacityM3H: roundTo(rawData.capacityM3H, 2),
  };

  const result = calculateFilterPress(data);

  const handleChange = (updates: Partial<FilterPressData>) => {
    const merged = { ...data, ...updates };
    const reqCap = roundTo((merged.sludgeVolumePerDay || 2.5) / (merged.operatingHoursPerDay || 4.0), 2);
    if (!merged.dimensionsOverride) {
      merged.capacityM3H = Math.max(0.5, reqCap);
    }
    const res = calculateFilterPress(merged);
    onUpdate({ ...unit.data, filterPress: merged }, res.valid && res.pass ? 'done' : 'pending');
  };

  const handleCapacityDirect = (cap: number) => {
    const merged = { ...data, capacityM3H: cap, dimensionsOverride: true };
    const res = calculateFilterPress(merged);
    onUpdate({ ...unit.data, filterPress: merged }, res.valid && res.pass ? 'done' : 'pending');
  };

  const resetSludge = () => {
    const v = excessSludgeM3Day > 0 ? roundTo(excessSludgeM3Day, 2) : 2.5;
    handleChange({ sludgeVolumePerDay: v, sludgeVolumeOverride: false });
  };

  const autoCapacity = () => {
    const reqCap = roundTo((data.sludgeVolumePerDay || 2.5) / (data.operatingHoursPerDay || 4.0), 2);
    const updated = { ...data, capacityM3H: Math.max(0.5, reqCap), dimensionsOverride: false };
    const res = calculateFilterPress(updated);
    onUpdate({ ...unit.data, filterPress: updated }, res.valid && res.pass ? 'done' : 'pending');
  };

  return (
    <div className="space-y-6">
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số thiết kế Máy ép bùn (Sludge Dewatering Unit)</h2>
              <p className="text-xs text-[#63776d]">
                Giảm thể tích bùn thải từ độ ẩm 97–99% xuống bánh bùn khô 70–80% để vận chuyển tiêu hủy
              </p>
            </div>
            <button
              type="button"
              onClick={resetSludge}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>↻ Lấy lại lượng bùn sinh ra</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lượng bùn lỏng sinh ra V (m³/ngày)
                </label>
                <NumericInput
                  step={0.1}
                  min={0}
                  allowNull
                  value={data.sludgeVolumePerDay !== null && data.sludgeVolumePerDay !== undefined ? data.sludgeVolumePerDay : null}
                  onChange={(val) =>
                    handleChange({
                      sludgeVolumePerDay: val,
                      sludgeVolumeOverride: true,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">
                  {data.sludgeVolumeOverride ? 'Đang dùng giá trị nhập riêng' : `Liên kết từ Bùn dư sinh học (${formatNumber(excessSludgeM3Day)} m³/d)`}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Thời gian ép bùn trong ngày (h/ngày)
                </label>
                <NumericInput
                  step={0.5}
                  min={1}
                  value={data.operatingHoursPerDay}
                  fallbackValue={4.0}
                  onChange={(val) => handleChange({ operatingHoursPerDay: val ?? 4.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Tiêu chuẩn: 4 – 8 giờ/ngày</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Độ ẩm bùn cấp vào (%)
                </label>
                <NumericInput
                  step={0.5}
                  min={50}
                  max={99.9}
                  value={data.feedMoisture}
                  fallbackValue={97.0}
                  onChange={(val) => handleChange({ feedMoisture: val ?? 97.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Bùn sau bể nén: 96 – 98%</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Độ ẩm bánh bùn sau ép (%)
                </label>
                <NumericInput
                  step={1}
                  min={30}
                  max={95}
                  value={data.cakeMoisture}
                  fallbackValue={75.0}
                  onChange={(val) => handleChange({ cakeMoisture: val ?? 75.0 })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Khung bản: 70–75%; Băng tải/Trục vít: 75–82%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Kết quả tính toán công suất Máy ép bùn</h2>
              <p className="text-xs text-[#63776d]">Tính toán công suất bơm bùn, lượng bùn khô và hóa chất Polymer keo tụ</p>
            </div>
            <button
              type="button"
              onClick={() =>
                showFormula('Công thức tính Máy ép bùn', [
                  'Công suất máy ép yêu cầu: Qmay = Vbun / t (m³/h)',
                  'Lượng cặn khô hàng ngày: DS = Vbun · 1000 · (100 - P_vao)/100 (kg cặn khô/ngày)',
                  'Khối lượng bánh bùn sau ép: W_banh = DS / ((100 - P_ra)/100) (kg bánh bùn/ngày)',
                  'Thể tích bánh bùn ép: V_banh = W_banh / 1050 (m³/ngày)',
                  'Lượng polymer tiêu tốn: Q_poly = (DS / 1000) · 3.0 kg polymer/tấn cặn khô',
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
              <span className="text-[11px] font-semibold text-[#5a7264] block">Công suất yêu cầu</span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.requiredCapacityM3H)} m³/h</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">Thời gian ép {formatNumber(data.operatingHoursPerDay)} h/d</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Công suất máy chọn</span>
              <span className={`text-lg font-bold ${result.pass ? 'text-[#176b45]' : 'text-amber-600'}`}>
                {formatNumber(data.capacityM3H)} m³/h
              </span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">{result.pass ? 'Đạt công suất' : 'Chưa đủ công suất'}</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Khối lượng bánh bùn ép</span>
              <span className="text-lg font-bold text-[#176b45]">{formatNumber(result.sludgeCakeKgDay)} kg/ngày</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">~ {formatNumber(result.sludgeCakeM3Day)} m³/ngày</span>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9]">
              <span className="text-[11px] font-semibold text-[#5a7264] block">Lượng Polymer tiêu hao</span>
              <span className="text-lg font-bold text-[#193a2a]">{formatNumber(result.polymerConsumptionKgDay)} kg/ngày</span>
              <span className="text-[10px] text-[#788e81] block mt-0.5">Polymer Cation keo tụ bùn</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${result.pass ? 'bg-[#f0f8f3] border-[#b9e0c7] text-[#135938]' : 'bg-amber-50 border-amber-200 text-amber-800'} flex items-start gap-3`}>
            {result.pass ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#176b45]" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />}
            <div className="text-xs space-y-1">
              <span className="font-bold">{result.pass ? 'Công suất máy ép bùn thỏa mãn nhu cầu xử lý' : 'Công suất máy nhỏ hơn yêu cầu'}</span>
              <p>
                Lượng bùn khô sinh ra {formatNumber(result.drySolidsKgDay)} kg DS/ngày. Thể tích bánh bùn ép tạo ra chỉ còn {formatNumber(result.sludgeCakeM3Day)} m³/ngày (giảm ~ {formatNumber(((data.sludgeVolumePerDay || 2.5) - result.sludgeCakeM3Day) / (data.sludgeVolumePerDay || 2.5) * 100)}% thể tích so với ban đầu).
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dimensions' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#e5eee8]">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số kích thước & công suất Máy ép bùn</h2>
              <p className="text-xs text-[#63776d]">Công suất xử lý bùn thực tế của thiết bị máy ép</p>
            </div>
            <button
              type="button"
              onClick={autoCapacity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c4dcce] bg-[#f2f8f4] text-[#176b45] text-xs font-semibold hover:bg-[#e4f1e8]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tự động chọn công suất phù hợp</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Công suất xử lý bùn của máy Q<sub>máy</sub> (m³/h)</label>
              <NumericInput
                step={0.2}
                min={0.1}
                value={data.capacityM3H}
                fallbackValue={1.0}
                onChange={(val) => handleCapacityDirect(val ?? 1.0)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
              />
              <span className="text-[10px] text-[#708477]">Công suất cấp bùn của bơm màng / trục vít</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#234333]">Chủng loại máy ép bùn đề xuất</label>
              <input
                type="text"
                readOnly
                value="Máy ép bùn khung bản tự động / Máy ép bùn trục vít đa đĩa"
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-[#f5f8f6] font-semibold"
              />
              <span className="text-[10px] text-[#708477]">Hiệu quả tách nước cao, vận hành tiết kiệm điện</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#f9fbf9] grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-[#5a7264] block">Lượng bánh bùn mỗi ngày</span>
              <span className="text-base font-bold text-[#176b45]">{formatNumber(result.sludgeCakeM3Day)} m³/ngày</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5a7264] block">Lượng nước tách ra hoàn lưu</span>
              <span className="text-base font-bold text-[#193a2a]">{formatNumber(Math.max(0, (data.sludgeVolumePerDay || 2.5) - result.sludgeCakeM3Day))} m³/ngày</span>
            </div>
            <div>
              <span className="text-[11px] text-[#5a7264] block">Polymer Cation tiêu thụ</span>
              <span className="text-base font-bold text-[#193a2a]">{formatNumber(result.polymerConsumptionKgDay)} kg/ngày</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#183b2b]">Thiết bị & phụ kiện công nghệ Máy ép bùn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">1. Máy ép bùn & Bơm cấp bùn màng khí nén</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Máy ép bùn khung bản (tấm bản nhựa Polypropylene chịu áp 15 – 20 bar, vải lọc bùn dệt sợi đơn monofilament chống bám cặn) hoặc máy ép bùn trục vít đa đĩa Inox SUS 304, kèm 01 bơm màng khí nén chuyên dụng cấp bùn.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#d2e3d8] bg-[#fbfdfb] space-y-2">
              <span className="text-xs font-bold text-[#1e4532]">2. Hệ thống pha Polymer Cation & Băng tải chuyển bánh bùn</span>
              <p className="text-xs text-[#52665a] leading-relaxed">
                Hệ thống chuẩn bị dung dịch polymer tự động 3 ngăn (Hòa trộn - Chín - Châm), bơm định lượng polymer và phễu hứng bánh bùn xả xuống bao chứa Jumbo hoặc máng vít tải chuyển bùn khô ra xe thu gom.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
