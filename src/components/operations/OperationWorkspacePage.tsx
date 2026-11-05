import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  Recycle,
  Wind,
  Layers,
  Beaker,
  Scale,
  CheckSquare,
  Activity,
  FileSpreadsheet,
  Workflow,
  Sparkles,
  Leaf,
  Filter,
} from 'lucide-react';
import { NutrientDosingTool } from './NutrientDosingTool';
import { AlkalinityDosingTool } from './AlkalinityDosingTool';
import { CarbonDosingTool } from './CarbonDosingTool';
import { MbrCleaningTool } from './MbrCleaningTool';
import { OperationLogbookTool } from './OperationLogbookTool';
import { WaterSupplyOperationTool } from './WaterSupplyOperationTool';
import { AirEmissionOperationTool } from './AirEmissionOperationTool';
import { SolidWasteOperationTool } from './SolidWasteOperationTool';

export type OperationSubsystem = 'wastewater' | 'water' | 'air' | 'solidwaste';
export type WastewaterOpFeature =
  | 'nutrient'
  | 'alkalinity'
  | 'logbook'
  | 'carbon'
  | 'mbr';

interface OperationWorkspacePageProps {
  onBackToHome: () => void;
  designFlowM3Day?: number;
  designBodMgL?: number;
  designCodMgL?: number;
  designTnMgL?: number;
  designTpMgL?: number;
  designAlkalinityMgL?: number;
  initialSubsystem?: OperationSubsystem | null;
  initialFeature?: string | null;
}

export const OperationWorkspacePage: React.FC<OperationWorkspacePageProps> = ({
  onBackToHome,
  designFlowM3Day = 100,
  designBodMgL = 250,
  designCodMgL = 500,
  designTnMgL = 40,
  designTpMgL = 8,
  designAlkalinityMgL = 150,
  initialSubsystem = null,
  initialFeature = null,
}) => {
  // Navigation level:
  // 1: 'domains' -> 4 ô lựa chọn 4 phân hệ (Nước thải, Nước cấp, Khí thải, Chất thải rắn)
  // 2: 'tools' -> Các ô chức năng của phân hệ đã chọn
  // 3: 'calculator' -> Màn hình tính toán chi tiết của chức năng
  const [selectedSubsystem, setSelectedSubsystem] = useState<OperationSubsystem | null>(
    initialSubsystem || null
  );
  const [selectedFeature, setSelectedFeature] = useState<string | null>(
    initialFeature || null
  );

  // Sync props when navigated from Header dropdown or other views
  useEffect(() => {
    setSelectedSubsystem(initialSubsystem || null);
    setSelectedFeature(initialFeature || null);
  }, [initialSubsystem, initialFeature]);

  // ----------------------------------------------------
  // LEVEL 3: MÀN HÌNH TÍNH TOÁN CHI TIẾT
  // ----------------------------------------------------
  if (selectedSubsystem && selectedFeature) {
    return (
      <div className="max-w-[1240px] mx-auto px-3 sm:px-4 py-6 pb-24 animate-fadeIn space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#cfded4] shadow-xs">
          {/* NƯỚC THẢI */}
          {selectedSubsystem === 'wastewater' && (
            <>
              {selectedFeature === 'nutrient' && (
                <NutrientDosingTool
                  onBack={() => setSelectedFeature(null)}
                  designFlowM3Day={designFlowM3Day}
                  designBodMgL={designBodMgL}
                  designTnMgL={designTnMgL}
                  designTpMgL={designTpMgL}
                />
              )}
              {selectedFeature === 'alkalinity' && (
                <AlkalinityDosingTool
                  onBack={() => setSelectedFeature(null)}
                  designFlowM3Day={designFlowM3Day}
                  designAlkalinityMgL={designAlkalinityMgL}
                  designNh4MgL={designTnMgL ? designTnMgL * 0.75 : 30}
                />
              )}
              {selectedFeature === 'carbon' && (
                <CarbonDosingTool
                  onBack={() => setSelectedFeature(null)}
                  designFlowM3Day={designFlowM3Day}
                  designCodMgL={designCodMgL}
                  designTnMgL={designTnMgL}
                />
              )}
              {selectedFeature === 'mbr' && (
                <MbrCleaningTool onBack={() => setSelectedFeature(null)} />
              )}
              {selectedFeature === 'logbook' && (
                <OperationLogbookTool
                  onBack={() => setSelectedFeature(null)}
                  designFlowM3Day={designFlowM3Day}
                />
              )}
            </>
          )}

          {/* NƯỚC CẤP */}
          {selectedSubsystem === 'water' && (
            <WaterSupplyOperationTool
              initialTab={
                selectedFeature === 'chlorine'
                  ? 'chlorine'
                  : selectedFeature === 'filterWash'
                  ? 'filterWash'
                  : 'pac'
              }
              onBack={() => setSelectedFeature(null)}
            />
          )}

          {/* KHÍ THẢI */}
          {selectedSubsystem === 'air' && (
            <AirEmissionOperationTool
              initialTab={
                selectedFeature === 'baghouse' ? 'baghouse' : 'scrubber'
              }
              onBack={() => setSelectedFeature(null)}
            />
          )}

          {/* CHẤT THẢI RẮN */}
          {selectedSubsystem === 'solidwaste' && (
            <SolidWasteOperationTool
              initialTab={selectedFeature || undefined}
              onBack={() => setSelectedFeature(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LEVEL 2: DANH MỤC CÁC Ô CHỨC NĂNG CỦA TỪNG PHÂN HỆ
  // ----------------------------------------------------
  if (selectedSubsystem) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 py-8 pb-20 animate-fadeIn space-y-8">
        {/* Back button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => {
              setSelectedSubsystem(null);
              setSelectedFeature(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Quay lại 4 phân hệ vận hành</span>
          </button>
        </div>

        {/* 1. NƯỚC THẢI */}
        {selectedSubsystem === 'wastewater' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#176b45]">
                PHÂN HỆ VẬN HÀNH NƯỚC THẢI
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
                Công cụ vận hành nước thải
              </h1>
              <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
                Chọn chức năng vận hành để thực hiện tính toán định lượng hóa chất, kiểm soát chế độ vi sinh và ghi chép nhật ký ca trực.
              </p>
            </div>

            {/* Grid 5 ô chức năng nước thải */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Ô 1: TÍNH DINH DƯỠNG */}
              <div
                onClick={() => setSelectedFeature('nutrient')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Beaker className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45] transition-colors">
                        Tính dinh dưỡng bổ sung
                      </h2>
                    </div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                      BOD : N : P = 100 : 5 : 1
                    </span>
                    <p className="text-xs text-[#63776d] leading-relaxed pt-1">
                      Cân bằng dinh dưỡng sinh học. Tính lượng Urê, DAP, H₃PO₄, Supe lân, nồng độ pha bồn và lưu lượng bơm định lượng.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở tính toán dinh dưỡng</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Ô 2: TÍNH KIỀM BỔ SUNG */}
              <div
                onClick={() => setSelectedFeature('alkalinity')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45] transition-colors">
                        Tính kiềm bổ sung
                      </h2>
                    </div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                      7.14 g CaCO₃ / g N
                    </span>
                    <p className="text-xs text-[#63776d] leading-relaxed pt-1">
                      Cân bằng độ kiềm duy trì pH cho vi sinh Nitrat hóa. Bù kiềm từ khử Nitrat Anoxic. Tính NaHCO₃, Soda, Xút NaOH, Vôi tôi.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở tính toán độ kiềm</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Ô 3: NHẬT KÝ VẬN HÀNH */}
              <div
                onClick={() => setSelectedFeature('logbook')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45] transition-colors">
                        Nhật ký vận hành
                      </h2>
                    </div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                      Tự động tính SVI & Xuất Excel
                    </span>
                    <p className="text-xs text-[#63776d] leading-relaxed pt-1">
                      Ghi chép ca trực hàng ngày: Q, pH, DO, MLSS, SV₃₀. Tự động đánh giá chỉ số lắng bùn SVI, phát hiện sớm nguy cơ nở bùn và xuất bảng CSV.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở sổ nhật ký vận hành</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Ô 4: TÍNH COD BỔ SUNG */}
              <div
                onClick={() => setSelectedFeature('carbon')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center font-extrabold text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    C
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45] transition-colors">
                        Tính COD bổ sung
                      </h2>
                    </div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                      Khử Nitrat Anoxic
                    </span>
                    <p className="text-xs text-[#63776d] leading-relaxed pt-1">
                      Bổ sung cơ chất Carbon cho bể thiếu khí khi nước thải nghèo BOD. Tính lượng Methanol, Ethanol, Mật rỉ đường, Natri Axetat.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở tính nguồn COD bổ sung</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Ô 5: VẬN HÀNH RỬA MÀNG MBR */}
              <div
                onClick={() => setSelectedFeature('mbr')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45] transition-colors">
                        Vận hành rửa màng MBR
                      </h2>
                    </div>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                      Rửa MC & RC / Áp suất TMP
                    </span>
                    <p className="text-xs text-[#63776d] leading-relaxed pt-1">
                      Tính toán thể tích dung dịch ngâm, khối lượng hóa chất Javel NaOCl, Axit Citric, lưu lượng bơm rửa ngược và quy trình 6 bước.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở quy trình rửa màng MBR</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. NƯỚC CẤP */}
        {selectedSubsystem === 'water' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#176b45]">
                PHÂN HỆ VẬN HÀNH NƯỚC CẤP
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
                Công cụ vận hành trạm nước cấp
              </h1>
              <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
                Tính toán định lượng phèn PAC, nồng độ Clo khử trùng nước sinh hoạt và chu kỳ rửa ngược lọc cát.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div
                onClick={() => setSelectedFeature('pac')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                      Châm phèn keo tụ PAC
                    </h2>
                    <p className="text-xs text-[#63776d] leading-relaxed mt-1">
                      Định lượng phèn PAC 10% theo độ đục NTU và lưu lượng nước xử lý.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở tính phèn PAC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div
                onClick={() => setSelectedFeature('chlorine')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                      Khử trùng Clo nước sạch
                    </h2>
                    <p className="text-xs text-[#63776d] leading-relaxed mt-1">
                      Kiểm soát liều lượng Clo hoạt tính nguyên chất và thể tích Javel 10% thương phẩm.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở tính khử trùng Clo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div
                onClick={() => setSelectedFeature('filterWash')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Filter className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                      Rửa ngược bể lọc cát
                    </h2>
                    <p className="text-xs text-[#63776d] leading-relaxed mt-1">
                      Tính toán cường độ rửa nước (12-16 L/s·m²), lưu lượng bơm và lượng nước tiêu hao.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở thủy lực rửa lọc</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. KHÍ THẢI */}
        {selectedSubsystem === 'air' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#176b45]">
                PHÂN HỆ VẬN HÀNH KHÍ THẢI
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
                Công cụ vận hành xử lý khí thải
              </h1>
              <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
                Kiểm soát dung dịch kiềm hấp thụ Scrubber khử khí axit (SOx, HCl) và theo dõi chênh áp túi lọc bụi Fabric Filter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                onClick={() => setSelectedFeature('scrubber')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Wind className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                      Tháp hấp thụ Scrubber (Kiềm NaOH)
                    </h2>
                    <p className="text-xs text-[#63776d] leading-relaxed mt-1">
                      Tính toán định lượng dung dịch xút NaOH 32% khử SO₂ và HCl theo tải lượng khí.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở tính toán Scrubber</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div
                onClick={() => setSelectedFeature('baghouse')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                      Giám sát chênh áp lọc bụi túi vải
                    </h2>
                    <p className="text-xs text-[#63776d] leading-relaxed mt-1">
                      Theo dõi độ sụt áp ΔP qua túi lọc, cảnh báo nghẹt bụi và điều chỉnh chu kỳ giũ khí nén.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở giám sát túi lọc</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CHẤT THẢI RẮN */}
        {selectedSubsystem === 'solidwaste' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#176b45]">
                PHÂN HỆ VẬN HÀNH CHẤT THẢI RẮN
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
                Công cụ vận hành chất thải rắn
              </h1>
              <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
                Tính toán phối trộn tỷ lệ C/N tối ưu ủ Compost phân hữu cơ vi sinh và cân bằng độ ẩm cơ chất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div
                onClick={() => setSelectedFeature('compost')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                      Phối trộn C/N ủ Compost
                    </h2>
                    <p className="text-xs text-[#63776d] leading-relaxed mt-1">
                      Cân bằng tỷ lệ C/N tối ưu (25-30:1) cho đống ủ rác hữu cơ kết hợp mùn cưa/tro trấu.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở tính phối trộn Compost</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div
                onClick={() => setSelectedFeature('moisture')}
                className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                      Cân bằng độ ẩm cơ chất
                    </h2>
                    <p className="text-xs text-[#63776d] leading-relaxed mt-1">
                      Kiểm soát độ ẩm đống ủ nằm trong khoảng lý tưởng 50-60% giúp vi sinh phân giải tối đa.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
                  <span>Mở cân bằng ẩm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // LEVEL 1: HIỂN THỊ 4 Ô LỰA CHỌN 4 PHÂN HỆ (GIỐNG DOMAINSELECTIONPAGE)
  // ----------------------------------------------------
  return (
    <div className="max-w-[1180px] mx-auto px-4 py-8 pb-20 animate-fadeIn space-y-8">
      {/* Top back action */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
      </div>

      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-emerald-50 text-[#176b45] border border-emerald-200">
          Module Vận hành hệ thống
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
          Chọn phân hệ vận hành
        </h1>
        <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
          Chọn nhóm phân hệ kỹ thuật môi trường để thực hiện các phép tính toán và kiểm soát vận hành.
        </p>
      </div>

      {/* Grid of 4 Domains (Ô lựa chọn 4 phân hệ như thiết kế) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. NƯỚC THẢI - HOÀN THIỆN ĐẦY ĐỦ */}
        <div
          onClick={() => setSelectedSubsystem('wastewater')}
          className="p-6 rounded-2xl border-2 border-[#176b45] bg-white hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between gap-4 group relative overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#176b45] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Recycle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#173a29]">Vận hành Nước thải</h2>
                <span className="text-[10px] font-bold bg-[#e5f2e9] text-[#176b45] px-2 py-0.5 rounded-full border border-[#b8dbc3]">
                  5 công cụ vận hành
                </span>
              </div>
              <p className="text-xs text-[#55695e] leading-relaxed">
                Tính dinh dưỡng bổ sung BOD:N:P, tính kiềm bù Nitrat hóa, tính nguồn COD khử Nitrat Anoxic, quy trình rửa màng MBR và sổ nhật ký vận hành hàng ngày (tự động tính SVI).
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#d8e8dc] text-xs font-bold text-[#176b45]">
            <span>Mở các chức năng vận hành nước thải</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* 2. NƯỚC CẤP */}
        <div
          onClick={() => setSelectedSubsystem('water')}
          className="p-6 rounded-2xl border border-[#d6e2da] bg-white hover:border-[#8bbda0] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Droplets className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#183a2a]">Vận hành Nước cấp</h2>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  3 công cụ vận hành
                </span>
              </div>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Tính toán định lượng phèn keo tụ PAC 10% theo độ đục NTU, liều lượng Clo hoạt tính khử trùng nước sạch và tính thủy lực chu kỳ rửa ngược bể lọc nhanh cát thạch anh.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Mở các chức năng vận hành nước cấp</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. KHÍ THẢI */}
        <div
          onClick={() => setSelectedSubsystem('air')}
          className="p-6 rounded-2xl border border-[#d6e2da] bg-white hover:border-[#8bbda0] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wind className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#183a2a]">Vận hành Khí thải</h2>
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  2 công cụ vận hành
                </span>
              </div>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Định lượng dung dịch xút NaOH 32% hấp thụ tháp Scrubber khử SO₂ và HCl, giám sát độ sụt áp túi lọc vải Baghouse (ΔP mmH₂O) và chu kỳ giũ bụi khí nén.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Mở các chức năng vận hành khí thải</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. CHẤT THẢI RẮN */}
        <div
          onClick={() => setSelectedSubsystem('solidwaste')}
          className="p-6 rounded-2xl border border-[#d6e2da] bg-white hover:border-[#8bbda0] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#183a2a]">Vận hành Chất thải rắn</h2>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  2 công cụ vận hành
                </span>
              </div>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Tính toán cân bằng tỷ lệ C/N tối ưu (25-30:1) cho quá trình ủ Compost phân hữu cơ vi sinh, tính lượng phụ gia mùn cưa và kiểm soát cân bằng độ ẩm đống ủ (50-60%).
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Mở các chức năng vận hành chất thải rắn</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
