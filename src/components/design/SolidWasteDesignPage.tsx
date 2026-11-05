import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  Calculator,
  CheckCircle2,
  FileText,
  Sliders,
  Trash2,
  Droplets,
  Leaf,
  FileSpreadsheet,
  FileCheck2,
} from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface SolidWasteDesignPageProps {
  onBackToDomains: () => void;
  projectName?: string;
}

type SolidWasteDesignTool =
  | 'forecast'
  | 'landfill'
  | 'leachate'
  | 'compost'
  | 'summary';

export const SolidWasteDesignPage: React.FC<SolidWasteDesignPageProps> = ({
  onBackToDomains,
  projectName = 'Dự án quản lý chất thải rắn',
}) => {
  const precision = getDecimalDigits();
  const [selectedTool, setSelectedTool] = useState<SolidWasteDesignTool | null>(null);
  const [activeTab, setActiveTab] = useState<'calc' | 'result'>('calc');

  // 1. WASTE GENERATION FORECAST (DỰ BÁO PHÁT SINH RÁC)
  const [forecast, setForecast] = useState({
    basePopulation: 120000, // Dân số ban đầu (người)
    annualGrowthRatePercent: 1.8, // Tốc độ gia tăng dân số (%/năm)
    planningYears: 10, // Số năm quy hoạch tính toán (năm)
    wasteGenerationKgPersonDay: 1.15, // Định mức phát sinh rác (kg/người.ngày)
    collectionRatePercent: 90, // Tỷ lệ thu gom rác (%)
    commercialIndustrialTonsDay: 25, // Rác công nghiệp/thương mại (tấn/ngày)
  });

  // Calculate population and waste at final planning year
  const finalPopulation = Math.round(
    forecast.basePopulation *
      Math.pow(1 + forecast.annualGrowthRatePercent / 100, forecast.planningYears)
  );
  const domesticWasteTonsDay =
    (finalPopulation *
      forecast.wasteGenerationKgPersonDay *
      (forecast.collectionRatePercent / 100)) /
    1000;
  const totalWasteTonsDay = domesticWasteTonsDay + forecast.commercialIndustrialTonsDay;
  const totalWasteTonsYear = totalWasteTonsDay * 365;

  // Cumulative waste over the planning period
  let cumulativeWasteTons = 0;
  for (let i = 1; i <= forecast.planningYears; i++) {
    const pop_i =
      forecast.basePopulation * Math.pow(1 + forecast.annualGrowthRatePercent / 100, i);
    const waste_i =
      ((pop_i *
        forecast.wasteGenerationKgPersonDay *
        (forecast.collectionRatePercent / 100)) /
        1000 +
        forecast.commercialIndustrialTonsDay) *
      365;
    cumulativeWasteTons += waste_i;
  }

  // 2. SANITARY LANDFILL CELL SIZING (QUY MÔ Ô CHÔN LẤP HỢP VỆ SINH)
  const [landfill, setLandfill] = useState({
    compactedDensityTonsM3: 0.85, // Tỷ trọng rác sau đầm nén (0.75 - 0.9 tấn/m3)
    dailyCoverSoilRatioPercent: 15, // Tỷ lệ đất phủ trung gian và phủ đỉnh (%)
    totalDepthM: 14.0, // Tổng chiều cao lớp rác (chiều sâu đào + đắp nổi)
    excavationDepthM: 4.5, // Chiều sâu đào âm dưới đất (m)
    geomembraneHdpeMm: 2.0, // Màng chống thấm HDPE (mm)
  });

  const compactedWasteVolumeM3 = cumulativeWasteTons / landfill.compactedDensityTonsM3;
  const totalCellVolumeM3 =
    compactedWasteVolumeM3 * (1 + landfill.dailyCoverSoilRatioPercent / 100);
  const landfillSurfaceAreaM2 = totalCellVolumeM3 / landfill.totalDepthM;
  const landfillAreaHectares = landfillSurfaceAreaM2 / 10000;
  const cellSideLengthM = Math.round(Math.sqrt(landfillSurfaceAreaM2));

  // 3. LEACHATE GENERATION & BASIN (NƯỚC RỈ RÁC & HỒ ĐIỀU HÒA)
  const [leachate, setLeachate] = useState({
    annualRainfallMm: 1850, // Lượng mưa trung bình năm (mm/năm)
    annualEvaporationMm: 1050, // Lượng bốc hơi mặt thoáng (mm/năm)
    infiltrationFactor: 0.35, // Hệ số thấm nước mưa vào đống rác (30-40%)
    retentionDays: 45, // Thời gian lưu trữ trong hồ điều hòa (30-60 ngày)
    basinDepthM: 3.5, // Chiều sâu làm việc hồ điều hòa (m)
  });

  const netPrecipitationM = Math.max(
    0,
    (leachate.annualRainfallMm - leachate.annualEvaporationMm) / 1000
  );
  const annualLeachateVolumeM3 =
    landfillSurfaceAreaM2 * netPrecipitationM * leachate.infiltrationFactor;
  const avgLeachateM3Day = annualLeachateVolumeM3 / 365;
  const peakRainyLeachateM3Day = avgLeachateM3Day * 2.2;
  const retentionBasinVolumeM3 = avgLeachateM3Day * leachate.retentionDays;
  const basinAreaM2 = retentionBasinVolumeM3 / leachate.basinDepthM;
  const basinSideM = Math.round(Math.sqrt(basinAreaM2));

  // 4. COMPOSTING FACILITY (NHÀ MÁY Ủ PHÂN COMPOST)
  const [compost, setCompost] = useState({
    organicFractionPercent: 60, // Tỷ lệ rác hữu cơ phân loại (55-65%)
    aerobicCycleDays: 28, // Chu kỳ ủ hiếu khí nhiệt độ cao (21-30 ngày)
    pileWidthM: 3.5, // Chiều rộng luống ủ (m)
    pileHeightM: 1.8, // Chiều cao luống ủ (m)
    pileLengthM: 35, // Chiều dài luống ủ (m)
    airSupplyRateM3TonMin: 0.9, // Định mức cấp khí hiếu khí (m3/tấn.phút)
    wasteDensityTonsM3: 0.6, // Tỷ trọng rác hữu cơ xốp ủ
  });

  const dailyOrganicTons = totalWasteTonsDay * (compost.organicFractionPercent / 100);
  const totalCompostingMassTons = dailyOrganicTons * compost.aerobicCycleDays;
  const singlePileVolumeM3 =
    0.5 *
    (compost.pileWidthM * 0.7 + compost.pileWidthM) *
    compost.pileHeightM *
    compost.pileLengthM;
  const singlePileMassTons = singlePileVolumeM3 * compost.wasteDensityTonsM3;
  const pilesCount = Math.ceil(totalCompostingMassTons / singlePileMassTons);
  const compostFacilityAreaM2 =
    pilesCount * (compost.pileWidthM + 2.5) * (compost.pileLengthM + 4);
  const totalBlowerFlowM3H = dailyOrganicTons * compost.airSupplyRateM3TonMin * 60;



  // -------------------------------------------------------------------------
  // MỨC 1: DANH MỤC CÁC Ô CHỨC NĂNG THIẾT KẾ CHẤT THẢI RẮN (GIỐNG NƯỚC THẢI)
  // -------------------------------------------------------------------------
  if (selectedTool === null) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 py-8 pb-20 animate-fadeIn space-y-8">
        {/* Back button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onBackToDomains}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Quay lại 4 lĩnh vực</span>
          </button>
        </div>

        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#176b45]">
            PHÂN HỆ KỸ THUẬT CHẤT THẢI RẮN
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
            Công cụ thiết kế quản lý chất thải rắn
          </h1>
          <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
            Chọn nhóm chức năng để tiếp tục làm việc trong dự án hiện tại.
          </p>
        </div>

        {/* Grid of Tools (Giống hoàn toàn cấu trúc ô của Nước thải) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Ô 1: DỰ BÁO PHÁT SINH RÁC */}
          <div
            onClick={() => {
              setSelectedTool('forecast');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Dự báo lượng rác phát sinh
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Quy hoạch năm
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Dự báo dân số đô thị theo tỷ lệ tăng trưởng, định mức phát sinh rác (kg/người·ngày), rác công nghiệp và tổng lũy kế vòng đời.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở dự báo phát sinh rác</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 2: QUY MÔ Ô CHÔN LẤP HỢP VỆ SINH */}
          <div
            onClick={() => {
              setSelectedTool('landfill');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Quy mô ô chôn lấp hợp vệ sinh
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    TCVN 6696
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tính thể tích ô chôn lấp Vo (m³), tỷ trọng đầm nén, đất phủ, diện tích mặt bằng (ha), chiều cao đống rác và màng chống thấm HDPE.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế ô chôn lấp</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 3: NƯỚC RỈ RÁC & HỒ ĐIỀU HÒA */}
          <div
            onClick={() => {
              setSelectedTool('leachate');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Droplets className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Nước rỉ rác & Hồ điều hòa
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                    Thornthwaite
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Cân bằng nước thủy văn (mưa - bốc hơi), lưu lượng trung bình ngày và đỉnh mùa mưa, thể tích hồ sinh học lưu trữ 45 ngày.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở tính nước rỉ rác</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 4: NHÀ MÁY Ủ PHÂN COMPOST */}
          <div
            onClick={() => {
              setSelectedTool('compost');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Leaf className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Nhà máy ủ phân Compost
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Ủ hiếu khí
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tính toán lượng rác hữu cơ phân loại, chu kỳ ủ nóng 55-65°C, số lượng luống ủ hiếu khí, diện tích nhà xưởng có mái che và quạt cấp khí.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Mở thiết kế Compost</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Ô 5: BÁO CÁO THUYẾT MINH TỔNG HỢP */}
          <div
            onClick={() => {
              setSelectedTool('summary');
              setActiveTab('calc');
            }}
            className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group md:col-span-2 lg:col-span-2"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                    Báo cáo & Bảng quy mô chất thải rắn
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#176b45] border border-[#d3e3d8]">
                    TCVN 6696:2009
                  </span>
                </div>
                <p className="text-xs text-[#63776d] leading-relaxed">
                  Tổng hợp thông số quy mô ô chôn lấp, diện tích thu hồi đất, hồ điều hòa nước rỉ rác và nhà xưởng compost để phục vụ báo cáo ĐTM.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
              <span>Xem bảng tổng hợp quy mô kỹ thuật</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tool Titles & Metadata
  const toolMeta: Record<SolidWasteDesignTool, { title: string; tag: string; icon: any }> = {
    forecast: {
      title: '1. Dự Báo Khối Lượng Phát Sinh Chất Thải Rắn',
      tag: 'Quy hoạch phát thải',
      icon: FileSpreadsheet,
    },
    landfill: {
      title: '2. Thiết Kế Quy Mô Ô Chôn Lấp Hợp Vệ Sinh',
      tag: 'TCVN 6696:2009',
      icon: Trash2,
    },
    leachate: {
      title: '3. Cân Bằng Nước Rỉ Rác & Thiết Kế Hồ Điều Hòa',
      tag: 'Cân bằng Thornthwaite',
      icon: Droplets,
    },
    compost: {
      title: '4. Thiết Kế Nhà Máy Sản Xuất Phân Vi Sinh Compost',
      tag: 'Ủ luống hiếu khí',
      icon: Leaf,
    },
    summary: {
      title: '5. Báo Cáo & Bảng Quy Mô Tổng Hợp Chất Thải Rắn',
      tag: 'TCVN 6696:2009',
      icon: FileCheck2,
    },
  };

  const currentToolMeta = selectedTool ? toolMeta[selectedTool] : toolMeta.forecast;
  const ToolIcon = currentToolMeta.icon;

  // -------------------------------------------------------------------------
  // MỨC 2: MÀN HÌNH TÍNH TOÁN CHI TIẾT TỪNG CHỨC NĂNG
  // -------------------------------------------------------------------------
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 pb-24 animate-fadeIn space-y-6">
      {/* Top Header with Back to Tools button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-[#cfded4]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setSelectedTool(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#cbd8d0] bg-white hover:bg-[#edf5f0] text-[#193d2c] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#176b45]" />
              <span>← Quay lại công cụ chất thải rắn</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-xs shrink-0">
              <ToolIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-[#193d2c]">
                  {currentToolMeta.title}
                </h1>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  {currentToolMeta.tag}
                </span>
              </div>
              <p className="text-xs text-[#63776d]">
                Dự án: <strong className="text-[#193d2c]">{projectName}</strong> | Phân hệ Quản lý Chất thải rắn
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* THANH CHUYỂN TÍNH TOÁN VÀ KẾT QUẢ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-[#f4f8f5] rounded-2xl border border-[#cfded4]">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-[#e2ede6] p-1 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('calc')}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calc'
                ? 'bg-[#176b45] text-white shadow-xs'
                : 'text-[#385444] hover:bg-white/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Tính toán</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('result')}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'result'
                ? 'bg-[#176b45] text-white shadow-xs'
                : 'text-[#385444] hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kết quả</span>
          </button>
        </div>

        <div className="text-xs text-[#526b5d] font-medium px-2 text-center sm:text-left">
          {activeTab === 'calc'
            ? 'Nhập và hiệu chỉnh thông số quy hoạch & thiết kế kỹ thuật'
            : 'Xem kết quả tính toán chi tiết, quy mô diện tích & kiểm tra chuẩn'}
        </div>
      </div>

      {/* 1. FORECAST */}
      {selectedTool === 'forecast' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#176b45]" />
                <span>Dữ Liệu Dân Số & Định Mức Rác Thải</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Dân số ban đầu (người):</label>
                    <NumericInput
                      min={0}
                      value={forecast.basePopulation}
                      fallbackValue={0}
                      onChange={(val) => setForecast({ ...forecast, basePopulation: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Tỷ lệ tăng dân số (%/năm):</label>
                    <NumericInput
                      min={0}
                      value={forecast.annualGrowthRatePercent}
                      fallbackValue={0}
                      onChange={(val) => setForecast({ ...forecast, annualGrowthRatePercent: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Trung bình 1.5 - 2.2%</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Thời gian quy hoạch (năm):</label>
                    <NumericInput
                      min={1}
                      value={forecast.planningYears}
                      fallbackValue={5}
                      onChange={(val) => setForecast({ ...forecast, planningYears: val ?? 5 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Định mức rác (kg/người·ngày):</label>
                    <NumericInput
                      min={0.1}
                      value={forecast.wasteGenerationKgPersonDay}
                      fallbackValue={1}
                      onChange={(val) => setForecast({ ...forecast, wasteGenerationKgPersonDay: val ?? 1 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Đô thị: 1.0 - 1.3 kg/người·ngày</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Tỷ lệ thu gom rác (%):</label>
                    <NumericInput
                      min={0}
                      max={100}
                      value={forecast.collectionRatePercent}
                      fallbackValue={0}
                      onChange={(val) => setForecast({ ...forecast, collectionRatePercent: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Rác CN/thương mại (tấn/ngày):</label>
                    <NumericInput
                      min={0}
                      value={forecast.commercialIndustrialTonsDay}
                      fallbackValue={0}
                      onChange={(val) => setForecast({ ...forecast, commercialIndustrialTonsDay: val ?? 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Khối lượng phát sinh tính toán:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold font-mono text-[#176b45]">
                      {formatNumber(totalWasteTonsDay, precision)} tấn/ngày
                    </span>
                    <span className="text-xs text-[#526b5d]">(Lũy kế {forecast.planningYears} năm: {Math.round(cumulativeWasteTons).toLocaleString()} tấn)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] hover:bg-[#125837] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Xem kết quả chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Dự Báo Phát Sinh Chất Thải Rắn
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#f8faf8] border border-[#d8e6de] rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-[#556b5d] block">Khối lượng phát sinh ngày (Năm {forecast.planningYears}):</span>
                    <span className="text-3xl font-extrabold font-mono text-[#176b45]">
                      {formatNumber(totalWasteTonsDay, precision)}
                    </span>
                    <span className="text-xs font-semibold text-[#176b45] ml-1.5">tấn/ngày</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#556b5d] block">Khối lượng phát sinh năm:</span>
                    <span className="text-2xl font-extrabold font-mono text-emerald-800">
                      {Math.round(totalWasteTonsYear).toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 ml-1.5">tấn/năm</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Dân số năm quy hoạch:</span>
                    <strong className="text-base font-mono text-[#183b2a]">
                      {finalPopulation.toLocaleString()} người
                    </strong>
                  </div>
                  <div className="p-3.5 bg-[#f8faf8] border border-[#dce8e0] rounded-xl">
                    <span className="text-[#64796e] block">Tổng lũy kế ({forecast.planningYears} năm):</span>
                    <strong className="text-base font-mono text-blue-700">
                      {Math.round(cumulativeWasteTons).toLocaleString()} tấn
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 leading-relaxed">
                  <strong className="font-bold block mb-1">Cơ sở thiết kế bãi chôn lấp & xử lý:</strong>
                  Tổng lượng rác phát sinh lũy kế là căn cứ trực tiếp để tính toán thể tích ô chôn lấp hợp vệ sinh và diện tích mặt bằng thu hồi đất phục vụ công trình xử lý chất thải rắn.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. LANDFILL CELL SIZING */}
      {selectedTool === 'landfill' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-[#176b45]" />
                <span>Thiết Kế Quy Mô Ô Chôn Lấp Hợp Vệ Sinh</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Tỷ trọng đầm nén (tấn/m³):</label>
                  <NumericInput
                    min={0.3}
                    value={landfill.compactedDensityTonsM3}
                    fallbackValue={0.8}
                    onChange={(val) => setLandfill({ ...landfill, compactedDensityTonsM3: val ?? 0.8 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Chuẩn máy đầm: 0.75 - 0.90 tấn/m³</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Tỷ lệ đất phủ trung gian (%):</label>
                  <NumericInput
                    min={5}
                    max={50}
                    value={landfill.dailyCoverSoilRatioPercent}
                    fallbackValue={15}
                    onChange={(val) => setLandfill({ ...landfill, dailyCoverSoilRatioPercent: val ?? 15 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Tiêu chuẩn: 15 - 20%</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Tổng chiều cao lớp rác H (m):</label>
                  <NumericInput
                    min={3}
                    value={landfill.totalDepthM}
                    fallbackValue={10}
                    onChange={(val) => setLandfill({ ...landfill, totalDepthM: val ?? 10 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Đào đất + đắp nổi: 10 - 18m</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Chiều sâu đào âm (m):</label>
                  <NumericInput
                    min={1}
                    value={landfill.excavationDepthM}
                    fallbackValue={4}
                    onChange={(val) => setLandfill({ ...landfill, excavationDepthM: val ?? 4 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh ô chôn lấp:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      Vo = {Math.round(totalCellVolumeM3).toLocaleString()} m³
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-800">
                      Diện tích: {formatNumber(landfillAreaHectares, precision)} ha (~{Math.round(landfillSurfaceAreaM2).toLocaleString()} m²)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] hover:bg-[#125837] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Xem kết quả chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Dung Tích & Diện Tích Ô Chôn Lấp
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Thể tích hữu dụng ô chôn lấp (Vo):</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {Math.round(totalCellVolumeM3).toLocaleString()} m³
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Diện tích bề mặt ô chôn lấp:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {formatNumber(landfillAreaHectares, precision)} Hecta
                  </span>
                  <span className="text-[11px] text-[#63776d] block font-mono">
                    ~ {Math.round(landfillSurfaceAreaM2).toLocaleString()} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Kích thước mặt bằng ô chôn lấp:</span>
                  <span className="text-base font-bold font-mono text-[#183a2a]">
                    Khoảng {cellSideLengthM} m x {cellSideLengthM} m (Sâu {landfill.totalDepthM} m)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. LEACHATE */}
      {selectedTool === 'leachate' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#176b45]" />
                <span>Dự Báo Nước Rỉ Rác & Hồ Chứa Điều Hòa</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Lượng mưa năm (mm):</label>
                  <NumericInput
                    min={0}
                    value={leachate.annualRainfallMm}
                    fallbackValue={0}
                    onChange={(val) => setLeachate({ ...leachate, annualRainfallMm: val ?? 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Lượng bốc hơi năm (mm):</label>
                  <NumericInput
                    min={0}
                    value={leachate.annualEvaporationMm}
                    fallbackValue={0}
                    onChange={(val) => setLeachate({ ...leachate, annualEvaporationMm: val ?? 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Hệ số thấm nước mưa (%):</label>
                  <NumericInput
                    min={0}
                    max={100}
                    value={Math.round(leachate.infiltrationFactor * 100)}
                    fallbackValue={30}
                    onChange={(val) => setLeachate({ ...leachate, infiltrationFactor: (val ?? 30) / 100 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Chuẩn: 30 - 40%</span>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Thời gian lưu trữ hồ (ngày):</label>
                  <NumericInput
                    min={1}
                    value={leachate.retentionDays}
                    fallbackValue={30}
                    onChange={(val) => setLeachate({ ...leachate, retentionDays: val ?? 30 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#718779]">Tiêu chuẩn: 30 - 60 ngày</span>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh nước rỉ rác:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      Qtb = {formatNumber(avgLeachateM3Day, precision)} m³/ngày
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-800">
                      Hồ điều hòa: {Math.round(retentionBasinVolumeM3).toLocaleString()} m³
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] hover:bg-[#125837] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Xem kết quả chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Lưu Lượng Nước Rỉ Rác & Kích Thước Hồ Chứa
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lưu lượng trung bình ngày:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(avgLeachateM3Day, precision)} m³/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lưu lượng đỉnh mùa mưa:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(peakRainyLeachateM3Day, precision)} m³/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Dung tích hồ ({leachate.retentionDays} ngày):</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {Math.round(retentionBasinVolumeM3).toLocaleString()} m³
                  </span>
                  <span className="text-[11px] text-[#63776d] block font-mono">
                    ~ {basinSideM} x {basinSideM} x {leachate.basinDepthM} m
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. COMPOST */}
      {selectedTool === 'compost' && (
        <div className="animate-fadeIn">
          {activeTab === 'calc' ? (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a] flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#176b45]" />
                <span>Thiết Kế Nhà Máy Ủ Phân Vi Sinh Compost</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Tỷ lệ rác hữu cơ ủ (%):</label>
                    <NumericInput
                      min={10}
                      max={100}
                      value={compost.organicFractionPercent}
                      fallbackValue={50}
                      onChange={(val) => setCompost({ ...compost, organicFractionPercent: val ?? 50 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Chuẩn rác VN: 55 - 65%</span>
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Chu kỳ ủ hiếu khí (ngày):</label>
                    <NumericInput
                      min={7}
                      value={compost.aerobicCycleDays}
                      fallbackValue={28}
                      onChange={(val) => setCompost({ ...compost, aerobicCycleDays: val ?? 28 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#cfded4] font-mono text-sm"
                    />
                    <span className="text-[10px] text-[#718779]">Giai đoạn ủ nóng: 21 - 30 ngày</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Rộng luống (m):</label>
                    <NumericInput
                      min={0.5}
                      value={compost.pileWidthM}
                      fallbackValue={3}
                      onChange={(val) => setCompost({ ...compost, pileWidthM: val ?? 3 })}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Cao luống (m):</label>
                    <NumericInput
                      min={0.5}
                      value={compost.pileHeightM}
                      fallbackValue={1.8}
                      onChange={(val) => setCompost({ ...compost, pileHeightM: val ?? 1.8 })}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-semibold mb-1">Dài luống (m):</label>
                    <NumericInput
                      min={1}
                      value={compost.pileLengthM}
                      fallbackValue={30}
                      onChange={(val) => setCompost({ ...compost, pileLengthM: val ?? 30 })}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#cfded4] font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preview Banner in Calc tab */}
              <div className="p-4 bg-[#f0f7f3] border border-[#cfded4] rounded-xl flex flex-wrap items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-xs text-[#526b5d] block">Tính toán nhanh nhà máy Compost:</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold font-mono text-[#176b45]">
                      {pilesCount} luống ủ ({formatNumber(dailyOrganicTons, precision)} tấn/ngày)
                    </span>
                    <span className="text-lg font-bold font-mono text-blue-700">
                      Quạt cấp khí: {formatNumber(totalBlowerFlowM3H, precision)} m³/h
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] hover:bg-[#125837] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <span>Xem kết quả chi tiết</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#183a2a]">
                  Kết Quả Quy Mô Nhà Xưởng & Quạt Cấp Khí Compost
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('calc')}
                  className="text-xs font-semibold text-[#176b45] hover:underline cursor-pointer"
                >
                  ← Sửa đổi thông số tính toán
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Lượng rác hữu cơ ủ ngày:</span>
                  <span className="text-xl font-bold font-mono text-[#176b45]">
                    {formatNumber(dailyOrganicTons, precision)} tấn/ngày
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Số luống ủ hiếu khí:</span>
                  <span className="text-xl font-bold font-mono text-emerald-800">
                    {pilesCount} luống ủ
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Diện tích nhà xưởng ủ:</span>
                  <span className="text-xl font-bold font-mono text-[#183a2a]">
                    ~ {Math.round(compostFacilityAreaM2).toLocaleString()} m²
                  </span>
                </div>
                <div className="p-3.5 bg-[#f8faf8] border border-[#d8e6de] rounded-xl">
                  <span className="text-[#5b7264] block">Tổng lưu lượng quạt thổi khí:</span>
                  <span className="text-xl font-bold font-mono text-blue-700">
                    {formatNumber(totalBlowerFlowM3H, precision)} m³/h
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SUMMARY TABLE */}
      {selectedTool === 'summary' && (
        <div className="bg-white p-6 rounded-2xl border border-[#cfded4] shadow-xs space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#193d2c]">
              Bảng Tổng Hợp Quy Mô Công Trình Quản Lý Chất Thải Rắn
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f6f2] text-[#183b2a] border-y border-[#d2e2d8]">
                  <th className="p-2.5 font-bold">STT</th>
                  <th className="p-2.5 font-bold">Hạng mục công trình</th>
                  <th className="p-2.5 font-bold">Số lượng / Quy mô</th>
                  <th className="p-2.5 font-bold">Kích thước mặt bằng</th>
                  <th className="p-2.5 font-bold">Thông số công nghệ chính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4ede8] text-[#2c4035]">
                <tr>
                  <td className="p-2.5 font-mono">1</td>
                  <td className="p-2.5 font-semibold">Ô chôn lấp hợp vệ sinh</td>
                  <td className="p-2.5 font-mono">{Math.round(totalCellVolumeM3).toLocaleString()} m³</td>
                  <td className="p-2.5 font-mono">~ {cellSideLengthM} x {cellSideLengthM} m ({formatNumber(landfillAreaHectares, precision)} ha)</td>
                  <td className="p-2.5">Sâu {landfill.totalDepthM}m, Đầm nén {landfill.compactedDensityTonsM3} tấn/m³, Màng chống thấm HDPE {landfill.geomembraneHdpeMm}mm</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">2</td>
                  <td className="p-2.5 font-semibold">Hồ chứa & điều hòa nước rỉ rác</td>
                  <td className="p-2.5 font-mono">{Math.round(retentionBasinVolumeM3).toLocaleString()} m³</td>
                  <td className="p-2.5 font-mono">~ {basinSideM} x {basinSideM} x {leachate.basinDepthM} m</td>
                  <td className="p-2.5">Lưu nước {leachate.retentionDays} ngày, Qtb = {formatNumber(avgLeachateM3Day, precision)} m³/ngày, Mùa mưa {formatNumber(peakRainyLeachateM3Day, precision)} m³/ngày</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">3</td>
                  <td className="p-2.5 font-semibold">Nhà máy ủ phân vi sinh Compost</td>
                  <td className="p-2.5 font-mono">{pilesCount} luống ủ hiếu khí</td>
                  <td className="p-2.5 font-mono">Diện tích ~ {Math.round(compostFacilityAreaM2).toLocaleString()} m²</td>
                  <td className="p-2.5">Ủ hiếu khí {compost.aerobicCycleDays} ngày, Rác hữu cơ {formatNumber(dailyOrganicTons, precision)} tấn/ngày, Quạt cấp khí {formatNumber(totalBlowerFlowM3H, precision)} m³/h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
