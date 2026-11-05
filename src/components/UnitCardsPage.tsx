import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Plus, Layers } from 'lucide-react';
import { TechnologyUnit } from '../types/ecs';
import {
  formatNumber,
  calculatePumpWell,
  calculateEqualization,
  calculateAerotank,
  calculateSecondaryClarifier,
  calculateDisinfection,
  calculateAnoxic,
  calculateSludgeTank,
  calculateGenericUnit,
  calculateBarScreen,
  calculateGritChamber,
  calculateGreaseTrap,
  calculateCoagulation,
  calculateFlocculation,
  calculateDaf,
  calculateSbr,
  calculateMbr,
  calculateMbbr,
  calculateUasb,
  calculateChemicalClarifier,
  calculateSandFilter,
  calculateFilterPress,
} from '../utils/calculations';

interface UnitCardsPageProps {
  units: TechnologyUnit[];
  onOpenUnit: (id: string) => void;
  onGoToTechnology: () => void;
  onBack: () => void;
}

export const UnitCardsPage: React.FC<UnitCardsPageProps> = ({
  units,
  onOpenUnit,
  onGoToTechnology,
  onBack,
}) => {
  const [, setPrecisionTick] = useState(0);

  useEffect(() => {
    const handler = () => setPrecisionTick((t) => t + 1);
    window.addEventListener('ecs-decimal-precision-changed', handler);
    return () => window.removeEventListener('ecs-decimal-precision-changed', handler);
  }, []);
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 pb-20 animate-fadeIn space-y-6">
      {/* Top back bar */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại công cụ nước thải</span>
        </button>
      </div>

      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#193d2c]">
          Tính toán chi tiết từng công trình
        </h1>
        <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
          Chọn một công trình bên dưới để nhập thông số công nghệ, tính kích thước và kiểm tra thể tích.
        </p>
      </div>

      {/* Grid of Unit Process Cards */}
      {units.length === 0 ? (
        <div className="p-10 rounded-2xl border-2 border-dashed border-[#ccdcd1] bg-white text-center space-y-4">
          <Layers className="w-10 h-10 text-[#7ca08a] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#1b3d2c]">Chưa có công trình nào trong dây chuyền</h3>
            <p className="text-xs text-[#6e8276] max-w-md mx-auto">
              Vui lòng chuyển sang mục Chọn công nghệ để thêm các công trình xử lý cần thiết cho dự án.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToTechnology}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#176b45] text-white text-xs font-bold hover:bg-[#105a39] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Mở bảng chọn công nghệ</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => {
            const isDone = unit.status === 'done';

            // Calculate mini-summary for all supported units
            let miniDim = '';
            let miniVol = '';
            let miniTime = '';

            if (unit.catalogName === 'Hầm bơm' && unit.data?.pumpWell) {
              const res = calculatePumpWell(unit.data.pumpWell);
              if (res.valid) {
                miniDim =
                  unit.data.pumpWell.geometry === 'circle'
                    ? `D ${formatNumber(res.diameter)}m × H ${formatNumber(res.totalHeight)}m`
                    : `L ${formatNumber(res.length)}m × B ${formatNumber(res.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actual)} m³ (y/c: ${formatNumber(res.required)} m³)`;
                miniTime = `${formatNumber(unit.data.pumpWell.storageMinutes)} phút`;
              }
            } else if (unit.catalogName === 'Bể điều hòa' && unit.data?.equalizationTank) {
              const res = calculateEqualization(unit.data.equalizationTank);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.equalizationTank.length)}m × B ${formatNumber(unit.data.equalizationTank.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actual)} m³ (y/c: ${formatNumber(res.required)} m³)`;
                miniTime = `${formatNumber(unit.data.equalizationTank.hrtHours)} giờ`;
              }
            } else if (unit.catalogName === 'Bể Aerotank' && unit.data?.aerotank) {
              const res = calculateAerotank(unit.data.aerotank);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.aerotank.length)}m × B ${formatNumber(unit.data.aerotank.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actual)} m³ (y/c: ${formatNumber(res.required)} m³)`;
                miniTime = res.includeNitrification
                  ? `BOD ${formatNumber(unit.data.aerotank.bodIn)}→${formatNumber(unit.data.aerotank.bodOut)} | NH₄⁺ ${formatNumber(res.nh4In)}→${formatNumber(res.nh4Out)} mg/L (Khí: ${formatNumber(res.airFlowM3h)} m³/h)`
                  : `BOD: ${formatNumber(unit.data.aerotank.bodIn)} → ${formatNumber(unit.data.aerotank.bodOut)} mg/L (Khí: ${formatNumber(res.airFlowM3h)} m³/h)`;
              }
            } else if (unit.catalogName === 'Bể lắng sinh học' && unit.data?.secondaryClarifier) {
              const res = calculateSecondaryClarifier(unit.data.secondaryClarifier);
              if (res.valid) {
                miniDim =
                  unit.data.secondaryClarifier.geometry === 'circle'
                    ? `D ${formatNumber(unit.data.secondaryClarifier.diameter)}m × H ${formatNumber(res.totalHeight)}m`
                    : `L ${formatNumber(unit.data.secondaryClarifier.length)}m × B ${formatNumber(unit.data.secondaryClarifier.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (Diện tích: ${formatNumber(res.actualArea)} m²)`;
                miniTime = `q₀ = ${formatNumber(res.actualQ0)} m³/m²·h | Lưu nước ${formatNumber(res.retentionHours)} h`;
              }
            } else if (unit.catalogName === 'Bể khử trùng' && unit.data?.disinfectionTank) {
              const res = calculateDisinfection(unit.data.disinfectionTank);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.disinfectionTank.length)}m × B ${formatNumber(unit.data.disinfectionTank.width)}m × H ${formatNumber(res.totalHeight)}m (${unit.data.disinfectionTank.channels} ngăn)`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `Tiếp xúc ${formatNumber(res.actualContactTime)} phút | Javel ${formatNumber(res.javelLitersDay)} L/ngày`;
              }
            } else if (unit.catalogName === 'Bể Anoxic' && unit.data?.anoxicTank) {
              const res = calculateAnoxic(unit.data.anoxicTank);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.anoxicTank.length)}m × B ${formatNumber(unit.data.anoxicTank.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `HRT ${formatNumber(res.actualHrt)} h | R=${formatNumber(unit.data.anoxicTank.recycleRatio * 100, 0)}% (Khử NO₃: ${formatNumber(res.denitEfficiency)}% | O₂ hồi phục: ${formatNumber(res.o2CreditKgDay)} kg/d)`;
              }
            } else if (['Bể chứa bùn', 'Bể nén bùn'].includes(unit.catalogName) && unit.data?.sludgeTank) {
              const res = calculateSludgeTank(unit.data.sludgeTank);
              if (res.valid) {
                miniDim =
                  unit.data.sludgeTank.geometry === 'circle'
                    ? `D ${formatNumber(unit.data.sludgeTank.diameter)}m × H ${formatNumber(res.totalHeight)}m`
                    : `L ${formatNumber(unit.data.sludgeTank.length)}m × B ${formatNumber(unit.data.sludgeTank.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `Lưu trữ ${formatNumber(unit.data.sludgeTank.storageDays)} ngày | Bùn nén ${formatNumber(res.thickenedSludgePerDay)} m³/d`;
              }
            } else if (unit.catalogName === 'Song chắn rác' && unit.data?.barScreen) {
              const res = calculateBarScreen(unit.data.barScreen);
              if (res.valid) {
                miniDim = `B ${formatNumber(unit.data.barScreen.channelWidth)}m × h ${formatNumber(unit.data.barScreen.waterDepth)}m (H ${formatNumber(res.totalHeight)}m)`;
                miniVol = `Khe: ${formatNumber(unit.data.barScreen.barSpacingMm)} mm (${res.numBars} thanh)`;
                miniTime = `Vận tốc qua khe: ${formatNumber(res.actualVelocity)} m/s (hL: ${formatNumber(res.headLossMm)} mm)`;
              }
            } else if (unit.catalogName === 'Bể lắng cát' && unit.data?.gritChamber) {
              const res = calculateGritChamber(unit.data.gritChamber);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.gritChamber.length)}m × B ${formatNumber(unit.data.gritChamber.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `Lưu cát ${formatNumber(res.actualRetentionSeconds)} s | v ngang ${formatNumber(res.actualVelocity)} m/s`;
              }
            } else if (unit.catalogName === 'Bể tách dầu mỡ' && unit.data?.greaseTrap) {
              const res = calculateGreaseTrap(unit.data.greaseTrap);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.greaseTrap.length)}m × B ${formatNumber(unit.data.greaseTrap.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `Lưu nước ${formatNumber(res.actualRetentionMin)} phút | q₀ = ${formatNumber(res.actualQ0)} m³/m²·h`;
              }
            } else if (['Bể keo tụ', 'Bể phản ứng'].includes(unit.catalogName) && unit.data?.coagulationTank) {
              const res = calculateCoagulation(unit.data.coagulationTank);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.coagulationTank.length)}m × B ${formatNumber(unit.data.coagulationTank.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `Khuấy nhanh ${formatNumber(res.actualRetentionSec)} s (G = ${formatNumber(unit.data.coagulationTank.velocityGradientG)} s⁻¹ | Máy ${formatNumber(res.mixingPowerKw)} kW)`;
              }
            } else if (unit.catalogName === 'Bể tạo bông' && unit.data?.flocculationTank) {
              const res = calculateFlocculation(unit.data.flocculationTank);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.flocculationTank.length)}m × B ${formatNumber(unit.data.flocculationTank.width)}m × H ${formatNumber(res.totalHeight)}m (${unit.data.flocculationTank.stages} ngăn)`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `Lưu ${formatNumber(res.actualRetentionMin)} phút (Ngăn: ${formatNumber(res.compartmentVolume)} m³)`;
              }
            } else if (unit.catalogName === 'Bể tuyển nổi DAF' && unit.data?.daf) {
              const res = calculateDaf(unit.data.daf);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.daf.length)}m × B ${formatNumber(unit.data.daf.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.volumeM3)} m³ (F thực tế: ${formatNumber(res.actualArea)} m²)`;
                miniTime = `Tuần hoàn R=${formatNumber(unit.data.daf.recycleRatio)}% (${formatNumber(res.recycleFlowM3h)} m³/h) | q₀=${formatNumber(res.actualSlr)} m³/m²·h`;
              }
            } else if (unit.catalogName === 'Bể SBR' && unit.data?.sbr) {
              const res = calculateSbr(unit.data.sbr);
              if (res.valid) {
                miniDim = `${unit.data.sbr.numTanks} bể × [L ${formatNumber(unit.data.sbr.length)}m × B ${formatNumber(unit.data.sbr.width)}m × H ${formatNumber(res.totalHeight)}m]`;
                miniVol = `${formatNumber(res.actualVolumePerTank)} m³/bể (Tổng: ${formatNumber(res.totalVolumeAllTanks)} m³)`;
                miniTime = `Chu kỳ ${formatNumber(unit.data.sbr.cycleHours)} h | HWL: ${formatNumber(res.waterHighLevel)}m / LWL: ${formatNumber(res.waterLowLevel)}m`;
              }
            } else if (unit.catalogName === 'Bể MBR' && unit.data?.mbr) {
              const res = calculateMbr(unit.data.mbr);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.mbr.length)}m × B ${formatNumber(unit.data.mbr.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (Màng lọc: ${formatNumber(res.requiredMembraneAreaM2)} m²)`;
                miniTime = `HRT ${formatNumber(res.actualHrt)} h | Flux ${formatNumber(unit.data.mbr.membraneFluxLmh)} LMH (MLSS: ${formatNumber(unit.data.mbr.mlss)} mg/L)`;
              }
            } else if (unit.catalogName === 'Bể MBBR' && unit.data?.mbbr) {
              const res = calculateMbbr(unit.data.mbbr);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.mbbr.length)}m × B ${formatNumber(unit.data.mbbr.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualTankVolumeM3)} m³ (Giá thể: ${formatNumber(res.requiredMediaVolumeM3)} m³)`;
                miniTime = `HRT ${formatNumber(res.actualHrt)} h | Điền đầy ${formatNumber(unit.data.mbbr.fillingFraction)}% (SALR: ${formatNumber(unit.data.mbbr.salr)} g/m²·d)`;
              }
            } else if (unit.catalogName === 'Bể UASB' && unit.data?.uasb) {
              const res = calculateUasb(unit.data.uasb);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.uasb.length)}m × B ${formatNumber(unit.data.uasb.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `VLR ${formatNumber(unit.data.uasb.volumetricLoadingCod)} kg/m³·d | v dâng ${formatNumber(res.actualUpflowVelocity)} m/h (Biogas: ${formatNumber(res.biogasYieldM3Day)} m³/d)`;
              }
            } else if (unit.catalogName === 'Bể lắng hóa lý' && unit.data?.chemicalClarifier) {
              const res = calculateChemicalClarifier(unit.data.chemicalClarifier);
              if (res.valid) {
                miniDim =
                  unit.data.chemicalClarifier.geometry === 'circle'
                    ? `D ${formatNumber(unit.data.chemicalClarifier.diameter)}m × H ${formatNumber(res.totalHeight)}m`
                    : `L ${formatNumber(unit.data.chemicalClarifier.length)}m × B ${formatNumber(unit.data.chemicalClarifier.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (Diện tích: ${formatNumber(res.actualArea)} m²)`;
                miniTime = `q₀ = ${formatNumber(res.actualQ0)} m³/m²·h | Weir: ${formatNumber(res.weirLoadingRate)} m³/m·h`;
              }
            } else if (['Bể lọc áp lực', 'Lọc than hoạt tính'].includes(unit.catalogName) && unit.data?.sandFilter) {
              const res = calculateSandFilter(unit.data.sandFilter);
              if (res.valid) {
                miniDim = `${unit.data.sandFilter.numColumns} bồn × [Ø ${formatNumber(unit.data.sandFilter.diameter * 1000)} × ${formatNumber(unit.data.sandFilter.height * 1000)} mm]`;
                miniVol = `Diện tích lọc: ${formatNumber(res.actualAreaM2)} m² (y/c: ${formatNumber(res.requiredAreaM2)} m²)`;
                miniTime = `Vận tốc lọc ${formatNumber(res.actualVelocity)} m/h | EBCT ${formatNumber(res.ebctMinutes)} phút`;
              }
            } else if (unit.catalogName === 'Máy ép bùn' && unit.data?.filterPress) {
              const res = calculateFilterPress(unit.data.filterPress);
              if (res.valid) {
                miniDim = `Máy công suất ${formatNumber(unit.data.filterPress.capacityM3H)} m³/h (y/c: ${formatNumber(res.requiredCapacityM3H)} m³/h)`;
                miniVol = `Bánh bùn: ${formatNumber(res.sludgeCakeM3Day)} m³/ngày (${formatNumber(res.sludgeCakeKgDay)} kg/ngày)`;
                miniTime = `Thời gian ép ${formatNumber(unit.data.filterPress.operatingHoursPerDay)} h/ngày | Polymer: ${formatNumber(res.polymerConsumptionKgDay)} kg/d`;
              }
            } else if (unit.data?.genericUnit) {
              const res = calculateGenericUnit(unit.data.genericUnit);
              if (res.valid) {
                miniDim = `L ${formatNumber(unit.data.genericUnit.length)}m × B ${formatNumber(unit.data.genericUnit.width)}m × H ${formatNumber(res.totalHeight)}m`;
                miniVol = `${formatNumber(res.actualVolume)} m³ (y/c: ${formatNumber(res.requiredVolume)} m³)`;
                miniTime = `Thời gian ${formatNumber(res.actualRetention)} ${unit.data.genericUnit.retentionUnit}`;
              }
            }

            return (
              <div
                key={unit.id}
                onClick={() => onOpenUnit(unit.id)}
                className="p-5 rounded-2xl border border-[#d6e3db] bg-gradient-to-b from-white to-[#fafcfb] hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#697f72]">
                        {unit.catalogName}
                      </span>
                      <h3 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45] transition-colors">
                        {unit.name}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                        isDone
                          ? 'bg-[#e7f3ec] text-[#176b45] border-[#b6d6c2]'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã tính</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Chưa tính</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Calculated summary lines */}
                  {miniDim && (
                    <div className="p-3 rounded-xl bg-[#f4f8f5] border border-[#e4ede7] text-xs space-y-1.5 text-[#445b4e]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6d8276]">Kích thước:</span>
                        <strong className="text-[#193d2c] font-bold tabular-nums">{miniDim}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#6d8276]">Thể tích:</span>
                        <strong className="text-[#193d2c] font-bold tabular-nums">{miniVol}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#6d8276]">Thời gian / Hiệu suất:</span>
                        <strong className="text-[#193d2c] font-bold tabular-nums">{miniTime}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở bảng tính chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#d8e4dc]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại công cụ nước thải</span>
        </button>

        <button
          type="button"
          onClick={onGoToTechnology}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] text-white text-xs font-semibold hover:bg-[#105a39]"
        >
          <span>Quản lý danh sách công nghệ →</span>
        </button>
      </div>
    </div>
  );
};
